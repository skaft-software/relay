/**
 * Relay catalog enrichment — make the registry's sizing data GGUF-derived.
 *
 * The hardware-fit math must come from each model's own GGUF, not a hand table.
 * A GGUF stores all of its architecture metadata + tensor shapes in the header,
 * which sits at the *start* of the file — so we range-fetch the first few MB of
 * one quant per repo (a valid truncated GGUF: header intact, tensor data cut),
 * run the SAME `analyze()` the on-disk sizer uses, and write the results back:
 *
 *   kv_ptok      KV cache bytes/token at q4_0 (exact, from tensor dims)
 *   nonex_frac   non-expert byte fraction (shared weights kept on GPU)
 *   arch, expert_count, active_experts   straight from the GGUF metadata
 *
 * After this, adding a model to the registry needs ZERO hand-tuned sizing — run
 * `relay catalog enrich` and every quant of the new repo is sized from its file.
 *
 * Sharded (>1 file) repos are skipped: their per-shard headers hold only part of
 * the tensor list, and they're far too large for consumer GPUs anyway (the size
 * check already marks them "too big"), so an exact kv_ptok wouldn't change the UI.
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { CATALOG_PATH, readCatalog, type CatalogEntry } from './setup-logic.ts';
import { readGguf } from './sizing/gguf.ts';
import { readMeta, analyze } from './sizing/size-model.ts';

type RepoEntry = CatalogEntry & { hf_repo?: string };

type Sizing = { kvPtok: number; nonexFrac: number; arch: string; nexp: number; nact: number };

const TMP = join(tmpdir(), 'relay-catalog-enrich');

async function rangeGet(url: string, bytes: number): Promise<string> {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` }, redirect: 'follow' });
  if (!(res.status === 200 || res.status === 206)) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(TMP, { recursive: true });
  const f = join(TMP, 'header.gguf');
  writeFileSync(f, buf);
  return f;
}

/** Fetch just enough header to size the model, growing the range on EOF. */
async function sizeFromHeader(url: string): Promise<Sizing | null> {
  for (const mb of [6, 24, 96]) {
    let f: string | undefined;
    try {
      f = await rangeGet(url, mb * 1024 * 1024);
      const meta = readMeta(readGguf(f));
      const a = analyze(meta);
      const total = a.nonex + a.exp;
      return {
        kvPtok: Math.round(a.kvPtok),
        nonexFrac: total > 0 ? Math.round((a.nonex / total) * 1000) / 1000 : 1,
        arch: meta.arch,
        nexp: meta.nexp,
        nact: meta.nact,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/EOF/i.test(msg)) { return null; } // a real error (404, not a GGUF) — don't retry bigger
      // else: header bigger than the range — retry with more bytes
    } finally {
      if (f) { try { rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ } }
    }
  }
  return null;
}

export async function runCatalogCli(args: string[]): Promise<void> {
  const sub = args[0] ?? 'help';
  if (sub === '--help' || sub === '-h' || sub === 'help') {
    console.log('\nUsage: relay catalog enrich [--force] [--limit N] [--repo <substr>]');
    console.log('  Range-fetches each repo\'s GGUF header and writes GGUF-derived sizing');
    console.log('  (kv_ptok, nonex_frac, arch, expert counts) into the catalog so the fit');
    console.log('  math needs no hand-maintained per-model tables.\n');
    return;
  }
  if (sub !== 'enrich') { console.error(`Unknown catalog subcommand: ${sub}`); process.exit(1); }

  const force = args.includes('--force');
  const limitI = args.indexOf('--limit');
  const limit = limitI >= 0 ? Number(args[limitI + 1]) : Infinity;
  const repoI = args.indexOf('--repo');
  const repoFilter = repoI >= 0 ? args[repoI + 1] : undefined;

  const cat = readCatalog() as RepoEntry[];
  const byRepo = new Map<string, RepoEntry[]>();
  for (const m of cat) {
    if (!m.hf_repo) continue;
    if (repoFilter && !m.hf_repo.toLowerCase().includes(repoFilter.toLowerCase())) continue;
    (byRepo.get(m.hf_repo) ?? byRepo.set(m.hf_repo, []).get(m.hf_repo)!).push(m);
  }

  console.log(`Enriching ${byRepo.size} repos from GGUF headers …\n`);
  let done = 0, skipped = 0, failed = 0;
  for (const [repo, entries] of byRepo) {
    if (done >= limit) break;
    if (!force && entries.every((e) => typeof e.kv_ptok === 'number')) { skipped++; continue; }
    // Smallest single-file quant = fastest header fetch.
    const cand = entries
      .filter((e) => (!e.shards || e.shards === 1) && e.download_url)
      .sort((a, b) => (a.size_gb ?? 1e9) - (b.size_gb ?? 1e9))[0];
    if (!cand) { console.log(`· skip  ${repo} (only sharded / no url)`); skipped++; continue; }

    let r: Sizing | null = null;
    try { r = await sizeFromHeader(cand.download_url!); } catch { r = null; }
    if (!r) { console.log(`✗ FAIL  ${repo}`); failed++; continue; }

    for (const e of entries) {
      e.kv_ptok = r.kvPtok;
      if (r.arch && r.arch !== '?') e.arch = r.arch;
      if (r.nexp > 0) {
        e.moe = true;
        e.expert_count = r.nexp;
        e.active_experts = r.nact;
        e.nonex_frac = r.nonexFrac;
      } else {
        e.nonex_frac = 1;
      }
    }
    done++;
    console.log(`✓ ${repo}  kv_ptok=${r.kvPtok} arch=${r.arch} ${r.nexp > 0 ? `moe ${r.nact}/${r.nexp} nonex=${r.nonexFrac}` : 'dense'}`);
  }

  writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2) + '\n');
  console.log(`\nEnriched ${done}, skipped ${skipped}, failed ${failed}. Wrote ${CATALOG_PATH}`);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('catalog.ts')) {
  void runCatalogCli(process.argv.slice(2));
}
