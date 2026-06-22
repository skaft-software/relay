/**
 * Relay probe — turn a *calculated* fit into a *tested* one.
 *
 * Sizing math says a model should fit at some context. A probe proves it: we
 * launch the real llama-server with the exact planned flags AT THE FULL SIZED
 * CONTEXT (llama.cpp preallocates the KV cache on load, so a healthy server
 * means that much KV actually fit in VRAM), parse the runtime facts it prints
 * (flash-attn on? cache type q4_0? expert offload? buffer sizes?), then shut it
 * down and cache the verdict. Only a cached, successful probe lets the picker
 * show "✓ tested".
 */
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

import { detectHardware } from './provision.ts';
import { detectWorkingLlamaServer, chooseBackend } from './llama.ts';
import { sizeModelTS, readCatalog, fmtCtx } from './setup-logic.ts';
import { installedPath, modelsDir } from './models.ts';

const HOME = homedir() || process.env.HOME || '';
function cacheFile(): string { return join(HOME, '.relay', 'probe-cache.json'); }

export type ProbeFacts = {
  flashAttn?: boolean;
  cacheTypeK?: string;
  cacheTypeV?: string;
  gpuBufMib?: number;
  cpuBufMib?: number;
  kvBufMib?: number;
  computeBufMib?: number;
  expertFlag?: string;
};

export type ProbeResult = {
  ok: boolean;
  ctx: number;            // the context we actually launched (and thus tested)
  error?: string;
  facts: ProbeFacts;
  binary?: string;
  loadSeconds?: number;
};

type CacheEntry = ProbeResult & { key: string; ts: number };

// ── Cache ────────────────────────────────────────────────────────────────

function keyFor(ggufPath: string, vramGb: number): string {
  let mtime = 0;
  try { mtime = Math.round(statSync(ggufPath).mtimeMs); } catch { /* ignore */ }
  return `${ggufPath}|${mtime}|${vramGb}`;
}

function readCache(): Record<string, CacheEntry> {
  try { return JSON.parse(readFileSync(cacheFile(), 'utf8')) as Record<string, CacheEntry>; } catch { return {}; }
}

function writeCache(c: Record<string, CacheEntry>): void {
  mkdirSync(join(HOME, '.relay'), { recursive: true });
  writeFileSync(cacheFile(), JSON.stringify(c, null, 2));
}

/** A previously probed context for this exact file+hardware, or null. */
export function cachedTestedCtx(ggufPath: string, vramGb: number): number | null {
  const e = readCache()[keyFor(ggufPath, vramGb)];
  return e && e.ok ? e.ctx : null;
}

// ── Log parsing ──────────────────────────────────────────────────────────

function tail(path: string, bytes = 65536): string {
  try {
    const sz = statSync(path).size;
    const start = Math.max(0, sz - bytes);
    const fd = openSync(path, 'r');
    const buf = Buffer.alloc(Math.min(bytes, sz));
    readSync(fd, buf, 0, buf.length, start);
    closeSync(fd);
    return buf.toString('utf8');
  } catch { return ''; }
}

function num(re: RegExp, s: string): number | undefined {
  const m = re.exec(s);
  return m ? Number(m[1]) : undefined;
}

function parseFacts(log: string): ProbeFacts {
  const f: ProbeFacts = {};
  if (/flash[_ ]?attn\S*\s*[=:]\s*(1|enabled|true|on)/i.test(log) || /flash attention is enabled/i.test(log)) f.flashAttn = true;
  else if (/flash[_ ]?attn\S*\s*[=:]\s*(0|disabled|false|off)/i.test(log)) f.flashAttn = false;
  f.cacheTypeK = /type_k\s*[=:]\s*([\w_]+)/i.exec(log)?.[1];
  f.cacheTypeV = /type_v\s*[=:]\s*([\w_]+)/i.exec(log)?.[1];
  f.gpuBufMib = num(/(?:Vulkan|CUDA|ROCm|Metal)\d*.*?(?:model )?buffer size\s*=\s*([\d.]+)\s*MiB/i, log);
  f.cpuBufMib = num(/CPU_?M?a?p?p?e?d?.*?(?:model )?buffer size\s*=\s*([\d.]+)\s*MiB/i, log);
  f.kvBufMib = num(/KV (?:buffer|self).*?(?:size\s*=\s*)?([\d.]+)\s*MiB/i, log);
  f.computeBufMib = num(/compute buffer size\s*=\s*([\d.]+)\s*MiB/i, log);
  return f;
}

function freePort(): number {
  for (let p = 18120; p <= 18180; p++) {
    const r = spawnSync('bash', ['-c', `ss -ltn 2>/dev/null | grep -q ":${p} " && echo used || echo free`], { encoding: 'utf8' });
    if ((r.stdout ?? '').includes('free')) return p;
  }
  return 18137;
}

// ── Probe ──────────────────────────────────────────────────────────────────

export async function probeModel(ggufPath: string, opts: { onLine?: (l: string) => void; healthTimeoutMs?: number } = {}): Promise<ProbeResult> {
  const log = opts.onLine ?? (() => {});
  if (!existsSync(ggufPath)) return { ok: false, ctx: 0, error: 'file not found: ' + ggufPath, facts: {} };

  const hw = detectHardware();
  const working = detectWorkingLlamaServer(chooseBackend(hw));
  if (!working?.path) return { ok: false, ctx: 0, error: 'no working llama-server (build one: relay llama build)', facts: {} };

  const vramGb = hw.vramGb || 0;
  const tuned = sizeModelTS(ggufPath, vramGb, Math.max(0, hw.ramGb - 4));
  if (!tuned) return { ok: false, ctx: 0, error: 'sizing failed (could not read GGUF)', facts: {} };

  const ctx = tuned.maxCtx;
  const port = freePort();
  const logPath = join('/tmp', `relay-probe-${port}.log`);

  // Build argv: the sized launch flags, but at the FULL ctx, + expert flag, no webui.
  const flags = [...tuned.launchFlags];
  const expertArgs = tuned.expertFlag ? tuned.expertFlag.split(' ') : [];
  const argv = ['--model', ggufPath, '--host', '127.0.0.1', '--port', String(port), '--no-webui', ...flags, ...expertArgs];

  log(`launching ${working.path}`);
  log(`  ctx=${ctx}${tuned.expertFlag ? ' ' + tuned.expertFlag : ''} on port ${port}`);

  const out = openSync(logPath, 'w');
  const child = spawn(working.path, argv, { stdio: ['ignore', out, out], detached: true });
  closeSync(out);

  const deadline = Date.now() + (opts.healthTimeoutMs ?? 240_000);
  let healthy = false; let died = false;
  const startedAt = Date.now();
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    try { process.kill(child.pid!, 0); } catch { died = true; break; }
    const r = spawnSync('curl', ['-sf', '-o', '/dev/null', `http://127.0.0.1:${port}/health`], { timeout: 4000 });
    if (r.status === 0) { healthy = true; break; }
    const lg = tail(logPath, 8192);
    if (/out of memory|failed to allocate|cudaMalloc|ggml_vulkan:.*alloc|terminate called/i.test(lg)) { died = true; break; }
  }
  const loadSeconds = Math.round((Date.now() - startedAt) / 1000);

  const logText = tail(logPath);
  const facts = parseFacts(logText);
  facts.expertFlag = tuned.expertFlag || undefined;
  // A healthy load means these flags were accepted, so record them as applied
  // (this llama.cpp build does not log buffer sizes at default verbosity).
  const flagStr = argv.join(' ');
  if (facts.flashAttn === undefined) facts.flashAttn = /--flash-attn\s+(on|1|true)/i.test(flagStr) ? true : (/--flash-attn\s+(off|0)/i.test(flagStr) ? false : undefined);
  facts.cacheTypeK ??= /--cache-type-k\s+(\S+)/i.exec(flagStr)?.[1];
  facts.cacheTypeV ??= /--cache-type-v\s+(\S+)/i.exec(flagStr)?.[1];

  // Shut it down.
  try { process.kill(-child.pid!, 'SIGTERM'); } catch { /* ignore */ }
  await new Promise((r) => setTimeout(r, 1500));
  try { process.kill(-child.pid!, 'SIGKILL'); } catch { /* ignore */ }

  const result: ProbeResult = healthy
    ? { ok: true, ctx, facts, binary: working.path, loadSeconds }
    : { ok: false, ctx, facts, binary: working.path, loadSeconds, error: died ? 'server died (likely OOM — see ' + logPath + ')' : 'health timeout' };

  // Cache it.
  const cache = readCache();
  cache[keyFor(ggufPath, vramGb)] = { ...result, key: keyFor(ggufPath, vramGb), ts: Date.now() };
  writeCache(cache);
  return result;
}

// ── CLI ──────────────────────────────────────────────────────────────────

function resolveTarget(arg: string | undefined, env: NodeJS.ProcessEnv): string | null {
  if (!arg) return null;
  if (existsSync(arg) && arg.toLowerCase().endsWith('.gguf')) return arg;
  const dir = modelsDir(env);
  const cat = readCatalog();
  const m = cat.find((x) => x.id === arg) || cat.find((x) => x.id.includes(arg));
  return m ? installedPath(m, dir) : null;
}

export async function runProbeCli(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (args[0] === '--help' || args[0] === '-h' || !args[0]) {
    console.log('\nUsage: relay probe <model-id|path-to.gguf>');
    console.log('  Launches the model with its planned flags at full context, verifies it');
    console.log('  loads + serves, records the result so the picker can show "✓ tested".\n');
    return;
  }
  const path = resolveTarget(args[0], env);
  if (!path) { console.error(`Not found / not installed: ${args[0]}. See: relay models list`); process.exit(1); }
  console.log(`\nProbing ${path.split('/').pop()} …  (this launches llama-server briefly)`);
  const res = await probeModel(path, { onLine: (l) => console.log('  ' + l) });
  console.log('');
  if (res.ok) {
    console.log(`  ✓ TESTED: loaded + served at ${fmtCtx(res.ctx)} ctx in ${res.loadSeconds}s`);
  } else {
    console.log(`  ✗ FAILED at ${fmtCtx(res.ctx)} ctx: ${res.error}`);
  }
  const f = res.facts;
  const bits: string[] = [];
  if (f.flashAttn !== undefined) bits.push(`flash-attn ${f.flashAttn ? 'on' : 'OFF'}`);
  if (f.cacheTypeK) bits.push(`KV ${f.cacheTypeK}/${f.cacheTypeV ?? '?'}`);
  if (f.expertFlag) bits.push(`experts ${f.expertFlag}`);
  if (f.gpuBufMib) bits.push(`GPU ${(f.gpuBufMib / 1024).toFixed(1)}GB`);
  if (f.cpuBufMib) bits.push(`CPU ${(f.cpuBufMib / 1024).toFixed(1)}GB`);
  if (f.kvBufMib) bits.push(`KV ${(f.kvBufMib / 1024).toFixed(1)}GB`);
  if (bits.length) console.log(`  runtime: ${bits.join(' · ')}`);
  console.log('');
  process.exit(res.ok ? 0 : 1);
}

// Standalone entry for direct execution / debugging.
if (process.argv[1] && process.argv[1].endsWith('probe.ts')) {
  void runProbeCli(process.argv.slice(2));
}
