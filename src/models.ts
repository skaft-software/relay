/**
 * Relay model management — list, download and delete local GGUF models.
 *
 * Honesty rule: a catalog model is only ever shown as "installed" when its GGUF
 * is actually on disk. Everything else is "available to download" — we never
 * imply a model is ready and then later say "not installed, download it".
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, statfsSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';

import { readCatalog, type CatalogEntry } from './setup-logic.ts';

const HOME = homedir() || process.env.HOME || '';

export function modelsDir(env: NodeJS.ProcessEnv = process.env): string {
  return (env.RELAY_MODEL_DIR && existsSync(env.RELAY_MODEL_DIR)) ? env.RELAY_MODEL_DIR : join(HOME, 'models');
}

// ── Disk scan ──────────────────────────────────────────────────────────────

export type DiskGguf = { path: string; name: string; sizeGb: number };

/** All GGUF files under a directory (depth-limited), with sizes. */
export function scanGgufs(dir: string, depth = 4): DiskGguf[] {
  const out: DiskGguf[] = [];
  const walk = (d: string, left: number) => {
    if (left < 0) return;
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full, left - 1);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.gguf')) {
        let sizeGb = 0;
        try { sizeGb = Math.round((statSync(full).size / 1024 ** 3) * 10) / 10; } catch { /* ignore */ }
        out.push({ path: full, name: e.name, sizeGb });
      }
    }
  };
  walk(dir, depth);
  return out;
}

/** Extract the HuggingFace repo name from a download URL.
 *  "https://huggingface.co/unsloth/Qwen3.6-35B-A3B-MTP-GGUF/resolve/main/file.gguf"
 *  → "Qwen3.6-35B-A3B-MTP-GGUF" */
function extractRepoFromUrl(url: string): string | null {
  const m = url.match(/huggingface\.co\/[^/]+\/([^/]+)/i);
  return m ? m[1] ?? null : null;
}

/** Resolve the on-disk GGUF path for a catalog entry, or null if not installed. */
export function installedPath(model: CatalogEntry, dir: string): string | null {
  if (model.filename) {
    const direct = resolve(dir, model.filename);
    if (existsSync(direct)) return direct;
    // filename may live in a nested folder — but verify the repo matches.
    // MTP and non-MTP variants share the same GGUF filename (e.g.
    // Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf) in different HuggingFace repos.
    const repo = extractRepoFromUrl(model.download_url ?? '');
    const hit = scanGgufs(dir).find((g) => {
      if (g.name.toLowerCase() !== model.filename!.toLowerCase()) return false;
      if (!repo) return true; // no URL to disambiguate — accept any path
      // If the file path contains a repo-like directory, verify it matches.
      // Flat-dir downloads (no repo in path) pass through.
      const pathLower = g.path.toLowerCase();
      const pathHasRepo = /unsloth\/[^/]+/.test(pathLower) || /mradermacher\/[^/]+/.test(pathLower);
      if (!pathHasRepo) return true;
      return pathLower.includes(repo.toLowerCase());
    });
    if (hit) return hit.path;
  }
  // fall back to id-stem matching
  const stem = model.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (stem.length > 6) {
    const hit = scanGgufs(dir).find((g) => g.name.toLowerCase().replace(/\.gguf$/, '').replace(/[^a-z0-9]/g, '').includes(stem));
    if (hit) return hit.path;
  }
  return null;
}

export type ModelRow = {
  model: CatalogEntry;
  installed: boolean;
  path: string | null;
  sizeOnDiskGb: number | null;
};

/** Catalog joined with disk truth, de-duplicated so the same GGUF (or the same
 *  download) never appears twice — the catalog carries several ids per file. */
export function listModels(dir: string = modelsDir()): ModelRow[] {
  const catalog = readCatalog();
  const rows = catalog.map((model): ModelRow => {
    const path = installedPath(model, dir);
    let sizeOnDiskGb: number | null = null;
    if (path) { try { sizeOnDiskGb = Math.round((statSync(path).size / 1024 ** 3) * 10) / 10; } catch { /* ignore */ } }
    return { model, installed: Boolean(path), path, sizeOnDiskGb };
  });
  const seen = new Map<string, ModelRow>();
  for (const r of rows) {
    const key = r.path
      ? 'disk:' + r.path
      : 'dl:' + (r.model.filename ?? r.model.download_url ?? r.model.id).toLowerCase();
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()];
}

// ── Disk space ──────────────────────────────────────────────────────────────

export function freeSpaceGb(dir: string): number {
  try {
    let probe = dir;
    while (probe && !existsSync(probe)) probe = dirname(probe);
    const s = statfsSync(probe || '/');
    return Math.floor((s.bavail * s.bsize) / 1024 ** 3);
  } catch { return -1; }
}

// ── Download ─────────────────────────────────────────────────────────────────

function commandPath(cmd: string): string | undefined {
  try { return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined; }
  catch { return undefined; }
}

export type DownloadCheck = { ok: boolean; reason?: string; destination: string; needGb: number; freeGb: number };

const SHARD_RE = /-(\d{5})-of-(\d{5})\.gguf$/i;

/** All files a model needs: one for single-file, or every shard for a sharded
 *  repo (derived from the `-00001-of-0000N` pattern + the `shards` count). */
export function shardSet(model: CatalogEntry): Array<{ url: string; filename: string }> {
  const filename = model.filename ?? model.download_url?.split('/').pop() ?? `${model.id}.gguf`;
  const url = model.download_url ?? '';
  const n = model.shards ?? 1;
  if (n <= 1 || !SHARD_RE.test(filename)) return [{ url, filename }];
  const out: Array<{ url: string; filename: string }> = [];
  for (let i = 1; i <= n; i++) {
    const tag = `-${String(i).padStart(5, '0')}-of-${String(n).padStart(5, '0')}.gguf`;
    out.push({ url: url.replace(SHARD_RE, tag), filename: filename.replace(SHARD_RE, tag) });
  }
  return out;
}

/** Pre-flight a download: resolve destination(s), estimate size, check disk space.
 *  For sharded models, "already installed" means EVERY shard is present. */
export function checkDownload(model: CatalogEntry, dir: string): DownloadCheck {
  const shards = shardSet(model);
  const destination = resolve(dir, shards[0]!.filename);
  const needGb = Math.ceil(model.size_gb ?? 0);
  const freeGb = freeSpaceGb(dir);
  if (!model.download_url) return { ok: false, reason: `No download URL for ${model.id}`, destination, needGb, freeGb };
  if (shards.every((s) => existsSync(resolve(dir, s.filename)))) return { ok: false, reason: 'already installed', destination, needGb, freeGb };
  if (freeGb >= 0 && needGb > 0 && freeGb < needGb + 2) {
    return { ok: false, reason: `not enough disk space: need ~${needGb} GB (+2 GB headroom), only ${freeGb} GB free`, destination, needGb, freeGb };
  }
  return { ok: true, destination, needGb, freeGb };
}

/**
 * Download a model — every shard for sharded repos — with resumable transfers,
 * inheriting the terminal so the user sees curl/wget's live progress + ETA.
 * Returns the first-shard path. Partial files (.part) are kept so re-running resumes.
 */
export function downloadModel(model: CatalogEntry, dir: string): string {
  const check = checkDownload(model, dir);
  if (check.reason === 'already installed') return check.destination;
  if (!check.ok) throw new Error(check.reason ?? 'cannot download');
  mkdirSync(dir, { recursive: true });
  const curl = commandPath('curl');
  const wget = commandPath('wget');
  if (!curl && !wget) throw new Error('curl or wget is required to download models');

  const shards = shardSet(model);
  let i = 0;
  for (const sh of shards) {
    i++;
    const dest = resolve(dir, sh.filename);
    if (existsSync(dest)) continue; // already have this shard
    if (shards.length > 1) process.stdout.write(`\n[shard ${i}/${shards.length}] ${sh.filename}\n`);
    const tmp = dest + '.part';
    const r = curl
      ? spawnSyncInherit('curl', ['-fL', '--retry', '3', '--continue-at', '-', '-o', tmp, sh.url])
      : spawnSyncInherit('wget', ['-c', '-O', tmp, sh.url]);
    if (r !== 0) throw new Error(`download failed for ${sh.filename} (exit ${r}); partial kept — re-run to resume`);
    try { execFileSync('mv', ['-f', tmp, dest]); } catch { /* leave .part */ }
  }
  return check.destination;
}

function spawnSyncInherit(cmd: string, args: string[]): number {
  const r = spawnSync(cmd, args, { stdio: 'inherit', timeout: 6 * 3600_000 });
  return r.status ?? 1;
}

// ── Delete ───────────────────────────────────────────────────────────────────

export type DeleteResult = { removed: string[]; freedGb: number };

/** Delete a model's GGUF file(s) — the main file plus shard siblings and
 *  mmproj/draft companions in the same folder. Returns what was removed. */
export function deleteModelFiles(targetPath: string): DeleteResult {
  const removed: string[] = [];
  let freedBytes = 0;
  if (!existsSync(targetPath)) return { removed, freedGb: 0 };
  const folder = dirname(targetPath);
  const baseStem = basename(targetPath).replace(/(-\d{5}-of-\d{5})?\.gguf$/i, '');

  const toRemove = new Set<string>([targetPath]);
  // shards + companions sharing the stem in the same folder
  try {
    for (const e of readdirSync(folder)) {
      if (!e.toLowerCase().endsWith('.gguf')) continue;
      const stem = e.replace(/(-\d{5}-of-\d{5})?\.gguf$/i, '');
      if (stem === baseStem) toRemove.add(join(folder, e));
      // companions: mmproj/draft/mtp that share a long prefix with the stem
      if (/(mmproj|draft|mtp)/i.test(e) && sharedPrefix(stem.toLowerCase(), baseStem.toLowerCase()) >= 10) {
        toRemove.add(join(folder, e));
      }
    }
  } catch { /* ignore */ }

  for (const f of toRemove) {
    try { freedBytes += statSync(f).size; rmSync(f); removed.push(f); } catch { /* ignore */ }
  }
  return { removed, freedGb: Math.round((freedBytes / 1024 ** 3) * 10) / 10 };
}

function sharedPrefix(a: string, b: string): number {
  let i = 0; const n = Math.min(a.length, b.length);
  while (i < n && a[i] === b[i]) i++;
  return i;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function fmtCtx(n: number): string { return n >= 1024 ? `${Math.round(n / 1024)}k` : String(n); }

function printList(env: NodeJS.ProcessEnv): void {
  const dir = modelsDir(env);
  const rows = listModels(dir);
  console.log(`\nModels  ·  ${dir}  ·  ${freeSpaceGb(dir)} GB free`);
  console.log('────────────────────────────────────────────────────────');
  const inst = rows.filter((r) => r.installed);
  const avail = rows.filter((r) => !r.installed);
  console.log(`\n  Installed (${inst.length}):`);
  if (!inst.length) console.log('    (none yet — download one below)');
  for (const r of inst) console.log(`    ✓ ${r.model.id.padEnd(28)} ${(r.sizeOnDiskGb ?? '?') + ' GB'}`);
  console.log(`\n  Available to download (${avail.length}):`);
  for (const r of avail) console.log(`    ○ ${r.model.id.padEnd(28)} ~${r.model.size_gb ?? '?'} GB  ctx ${fmtCtx(r.model.ctx)}`);
  console.log('\n  relay models download <id>   ·   relay models rm <id>\n');
}

export function runModelsCli(args: string[], env: NodeJS.ProcessEnv = process.env): void {
  const sub = args[0] ?? 'list';

  if (sub === '--help' || sub === '-h' || sub === 'help') {
    console.log('\nUsage: relay models [list|download <id>|rm <id>]');
    console.log('  list              Show installed vs available models (default)');
    console.log('  download <id>     Download a catalog model (resumable, disk-checked)');
    console.log('  rm <id>           Delete an installed model\'s GGUF (frees disk)');
    console.log('');
    return;
  }

  if (sub === 'list') { printList(env); return; }

  const dir = modelsDir(env);
  const catalog = readCatalog();
  const id = args[1];
  const model = id ? (catalog.find((m) => m.id === id) || catalog.find((m) => m.id.includes(id))) : undefined;

  if (sub === 'download') {
    if (!model) { console.error(`Unknown model id: ${id ?? '(none)'}. See: relay models list`); process.exit(1); }
    const check = checkDownload(model, dir);
    if (check.reason === 'already installed') { console.log(`✓ ${model.id} is already installed: ${check.destination}`); return; }
    if (!check.ok) { console.error(`✗ ${check.reason}`); process.exit(1); }
    console.log(`\nDownloading ${model.id}  (~${check.needGb} GB, ${check.freeGb} GB free)`);
    console.log(`  → ${check.destination}\n`);
    try { const p = downloadModel(model, dir); console.log(`\n✓ Downloaded: ${p}\n`); }
    catch (e) { console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}\n`); process.exit(1); }
    return;
  }

  if (sub === 'rm' || sub === 'delete' || sub === 'remove') {
    if (!model) { console.error(`Unknown model id: ${id ?? '(none)'}. See: relay models list`); process.exit(1); }
    const path = installedPath(model, dir);
    if (!path) { console.log(`${model.id} is not installed — nothing to delete.`); return; }
    const res = deleteModelFiles(path);
    console.log(`\n✓ Deleted ${model.id} — freed ${res.freedGb} GB:`);
    for (const f of res.removed) console.log(`    ${f}`);
    console.log('');
    return;
  }

  console.error(`Unknown models subcommand: ${sub}. Try: relay models --help`);
  process.exit(1);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('models.ts')) {
  runModelsCli(process.argv.slice(2));
}
