/**
 * Relay provisioning brain.
 *
 * Detects what is actually on the machine — the organized layout, an existing
 * llama-server (and its backend), GPU VRAM, and the GGUF models on disk — then
 * computes hardware-fit configs and (later) generates start-scripts, the model
 * map, and docker mounts. Detection is read-only and best-effort: every probe
 * swallows its own errors so a missing tool never aborts provisioning.
 *
 * Run standalone to print a plan:
 *   node --experimental-strip-types src/provision.ts
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sizeModel, buildLaunchFlags, GB } from './sizing/size-model.ts';

// ── Types ────────────────────────────────────────────────────────────────

export type Backend = 'cuda' | 'vulkan' | 'hip' | 'metal' | 'cpu' | 'unknown' | 'auto';
export type Profile = 'nano' | 'full';
export type FitClass = 'full-gpu' | 'partial-offload' | 'too-large' | 'unknown';

export type ProvisionOptions = {
  apply: boolean;
  profile: Profile;
  backend: Backend;
  modelsDir?: string;
  skipBuild: boolean;
  skipDocker: boolean;
  smoke: boolean;
};

export type Layout = {
  relayHome: string;
  modelsDir: string;
  scriptsDir: string;
  logsDir: string;
};

export type LlamaServer = {
  path: string | null;
  buildDir: string | null;
  backend: Backend;
  source: 'env' | 'path' | 'convention' | 'none';
};

export type GpuInfo = {
  /** Backend-relative index, e.g. 0 for CUDA0 / Vulkan0. */
  index: number;
  /** Device handle as llama.cpp names it (CUDA0, Vulkan1, ROCm0, …). Matches what `--device` expects. */
  device: string;
  name: string;
  vramGb: number;
  /** Free VRAM if the probe reported it (only `--list-devices` does). */
  freeVramGb?: number;
};

export type Hardware = {
  vendor: 'nvidia' | 'amd' | 'apple' | 'none';
  /** First GPU's name — back-compat single-GPU label. */
  gpuName?: string;
  /**
   * Conservative single-model VRAM budget in GB = the largest single card.
   * Equal to the one card's VRAM on single-GPU boxes (no behavioral change there).
   */
  vramGb: number;
  ramGb: number;
  /** Every GPU the machine exposes. Empty when vendor === 'none'. */
  gpus: GpuInfo[];
  gpuCount: number;
  /** Largest single card's VRAM (= the single-model budget basis, = vramGb). */
  maxGpuVramGb: number;
  /** Sum of all cards' VRAM — the physical ceiling reachable via splitting. */
  totalGpuVramGb: number;
};

export type ModelFile = {
  id: string;
  label: string;
  path: string;
  sizeGb: number;
  quant: string;
  moe: boolean;
  vision: boolean;
  mmproj?: string;
  draft?: string;
  shards: number;
  incomplete: boolean;
};

type BuiltModel = ModelFile & { folder: string; stem: string };

export type ModelFit = {
  model: ModelFile;
  fit: FitClass;
  ngl: number;
  ctxSize: number;
  cpuMoe?: string;
};

// ── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_PORT = 1234;

// ── Layout ───────────────────────────────────────────────────────────────

const HOME = process.env.HOME ?? '';

function firstExisting(paths: Array<string | undefined>): string | undefined {
  for (const p of paths) if (p && existsSync(p)) return p;
  return undefined;
}

export function resolveLayout(env: NodeJS.ProcessEnv = process.env, modelsDirOverride?: string): Layout {
  const relayHome = join(HOME, '.relay');
  const modelsDir = modelsDirOverride
    ?? firstExisting([env.RELAY_MODEL_DIR, join(HOME, 'models'), join(relayHome, 'models')])
    ?? join(relayHome, 'models');
  return {
    relayHome,
    modelsDir,
    scriptsDir: join(relayHome, 'start-scripts'),
    logsDir: join(relayHome, 'logs'),
  };
}

// ── llama-server detection ───────────────────────────────────────────────

function which(cmd: string): string | undefined {
  try {
    return execFileSync('which', [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function inferBackend(serverPath: string, buildDir: string | null): Backend {
  const hay = (serverPath + ' ' + (buildDir ?? '')).toLowerCase();
  if (hay.includes('cuda')) return 'cuda';
  if (hay.includes('vulkan')) return 'vulkan';
  if (hay.includes('hip') || hay.includes('rocm')) return 'hip';
  if (hay.includes('metal')) return 'metal';
  try {
    const out = execFileSync(serverPath, ['--list-devices'], { encoding: 'utf8', timeout: 6000, stdio: ['ignore', 'pipe', 'pipe'] }).toLowerCase();
    if (out.includes('cuda')) return 'cuda';
    if (out.includes('vulkan')) return 'vulkan';
    if (out.includes('rocm') || out.includes('hip')) return 'hip';
    if (out.includes('metal')) return 'metal';
    if (out.includes('cpu')) return 'cpu';
  } catch { /* ignore */ }
  return 'unknown';
}

export function detectLlamaServer(env: NodeJS.ProcessEnv = process.env): LlamaServer {
  const candidates: Array<{ path?: string; source: LlamaServer['source'] }> = [
    { path: env.RELAY_LLAMA_SERVER_PATH, source: 'env' },
    { path: join(HOME, 'llama.cpp/build/bin/llama-server'), source: 'convention' },
    { path: join(HOME, 'llama.cpp/build-cuda/bin/llama-server'), source: 'convention' },
    { path: join(HOME, 'llama.cpp/build-vulkan/bin/llama-server'), source: 'convention' },
    { path: join(HOME, 'llama.cpp/build-rocm/bin/llama-server'), source: 'convention' },
    { path: join(HOME, 'llama.cpp/build-metal/bin/llama-server'), source: 'convention' },
    { path: which('llama-server'), source: 'path' },
    { path: '/opt/llama.cpp/build/bin/llama-server', source: 'convention' },
    { path: '/usr/local/bin/llama-server', source: 'convention' },
  ];
  for (const c of candidates) {
    if (c.path && existsSync(c.path)) {
      const buildDir = c.path.includes('/bin/') ? dirname(dirname(c.path)) : null;
      return { path: c.path, buildDir, backend: inferBackend(c.path, buildDir), source: c.source };
    }
  }
  return { path: null, buildDir: null, backend: 'unknown', source: 'none' };
}

// ── Hardware ─────────────────────────────────────────────────────────────

function ramGb(): number {
  try {
    const m = /^MemTotal:\s+(\d+)\s+kB/m.exec(execFileSync('cat', ['/proc/meminfo'], { encoding: 'utf8' }));
    if (m) return Math.round(Number(m[1]) / 1024 / 1024);
  } catch { /* ignore */ }
  return 0;
}

// ── GPU enumeration (pure parsers — fixture-testable) ──────────────────────

/** Map a llama.cpp device handle + name to a relay vendor. */
export function gpuVendor(device: string, name: string): Hardware['vendor'] {
  const d = device.toLowerCase();
  if (d.startsWith('cuda')) return 'nvidia';
  if (d.startsWith('rocm') || d.startsWith('hip')) return 'amd';
  if (d.startsWith('metal') || d.startsWith('mtl')) return 'apple';
  // Vulkan (or anything else): fall back to the human name.
  const n = name.toLowerCase();
  if (n.includes('nvidia') || /\bgeforce|\bquadro|\btesla|\brtx|\bgtx\b/.test(n)) return 'nvidia';
  if (n.includes('amd') || n.includes('radeon') || n.includes('rocm') || /\bgfx\d/.test(n)) return 'amd';
  if (n.includes('apple') || n.includes('metal')) return 'apple';
  return 'none';
}

/**
 * Parse `llama-server --list-devices` output. This is the authoritative,
 * cross-vendor source: the device handles it prints (CUDA0, Vulkan1, ROCm0)
 * are exactly what `--device` accepts. Example line:
 *   `  Vulkan0: AMD Radeon RX 9070 XT (RADV GFX1201) (16304 MiB, 6345 MiB free)`
 */
export function parseListDevices(out: string): GpuInfo[] {
  const gpus: GpuInfo[] = [];
  const re = /^\s*([A-Za-z]+)(\d+):\s*(.+?)\s*\((\d+)\s*MiB(?:,\s*(\d+)\s*MiB\s*free)?\)\s*$/;
  for (const line of out.split('\n')) {
    const m = re.exec(line);
    if (!m) continue;
    const [, prefix, idx, name, totalMib, freeMib] = m;
    const device = prefix! + idx!;
    const vramGb = Math.round(Number(totalMib) / 1024);
    if (!vramGb) continue;
    const g: GpuInfo = { index: Number(idx), device, name: name!.trim(), vramGb };
    if (freeMib) g.freeVramGb = Math.round(Number(freeMib) / 1024);
    gpus.push(g);
  }
  return gpus;
}

/**
 * Parse `nvidia-smi --query-gpu=index,name,memory.total --format=csv,noheader,nounits`.
 * One line per GPU — read them ALL (the previous code read only line 0).
 */
export function parseNvidiaSmi(out: string): GpuInfo[] {
  const gpus: GpuInfo[] = [];
  for (const line of out.trim().split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 3) continue;
    const [idx, name, mib] = parts;
    const vramGb = Math.round(Number(mib) / 1024);
    if (!vramGb) continue;
    gpus.push({ index: Number(idx), device: 'CUDA' + Number(idx), name: name!, vramGb });
  }
  return gpus;
}

/** Roll a GPU list up into the Hardware summary fields. */
export function summarizeGpus(gpus: GpuInfo[], vendor: Hardware['vendor']): Hardware {
  const vrams = gpus.map((g) => g.vramGb);
  const maxGpuVramGb = vrams.length ? Math.max(...vrams) : 0;
  const totalGpuVramGb = vrams.reduce((a, b) => a + b, 0);
  return {
    vendor: gpus.length ? vendor : 'none',
    gpuName: gpus[0]?.name,
    vramGb: maxGpuVramGb,
    ramGb: ramGb(),
    gpus,
    gpuCount: gpus.length,
    maxGpuVramGb,
    totalGpuVramGb,
  };
}

export function detectHardware(serverPath?: string): Hardware {
  // Authoritative: ask the actual llama-server binary. Works for CUDA, Vulkan
  // and ROCm uniformly and yields device handles that match `--device`.
  const server = serverPath ?? detectLlamaServer().path ?? undefined;
  if (server) {
    try {
      const out = execFileSync(server, ['--list-devices'],
        { encoding: 'utf8', timeout: 8000, stdio: ['ignore', 'pipe', 'ignore'] });
      const gpus = parseListDevices(out);
      if (gpus.length) {
        const vendor = gpuVendor(gpus[0]!.device, gpus[0]!.name);
        return summarizeGpus(gpus, vendor);
      }
    } catch { /* fall through to vendor tools */ }
  }

  // Fallback: NVIDIA via nvidia-smi (now reads every GPU).
  try {
    const out = execFileSync('nvidia-smi', ['--query-gpu=index,name,memory.total', '--format=csv,noheader,nounits'],
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    const gpus = parseNvidiaSmi(out);
    if (gpus.length) return summarizeGpus(gpus, 'nvidia');
  } catch { /* ignore */ }

  // Fallback: AMD via rocm-smi (sum all cards, not just the first match).
  try {
    const out = execFileSync('rocm-smi', ['--showmeminfo', 'vram', '--csv'],
      { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    const totals = [...out.matchAll(/(\d{9,})/g)].map((m) => Number(m[1]));
    if (totals.length) {
      const gpus: GpuInfo[] = totals.map((bytes, i) => ({
        // Relay uses Vulkan for AMD (not HIP/ROCm). Handles match what a Vulkan
        // llama-server reports in --list-devices. If you build with HIP, the
        // primary --list-devices path runs first and this fallback never fires.
        index: i, device: 'Vulkan' + i, name: amdName() ?? 'AMD GPU', vramGb: Math.round(bytes / 1024 ** 3),
      })).filter((g) => g.vramGb > 0);
      if (gpus.length) return summarizeGpus(gpus, 'amd');
    }
  } catch { /* ignore */ }

  // Fallback: AMD/other via vulkaninfo (single heap — no multi-GPU detail).
  const vk = vulkanVram();
  if (vk.vramGb > 0) {
    return summarizeGpus([{ index: 0, device: 'Vulkan0', name: vk.name ?? 'GPU', vramGb: vk.vramGb }], 'amd');
  }
  return summarizeGpus([], 'none');
}

function amdName(): string | undefined {
  return vulkanVram().name;
}

function vulkanVram(): { name?: string; vramGb: number } {
  try {
    const out = execFileSync('vulkaninfo', [], { encoding: 'utf8', timeout: 6000, stdio: ['ignore', 'pipe', 'ignore'] });
    const name = /deviceName\s*=\s*(.+)/.exec(out)?.[1]?.trim();
    const heaps = [...out.matchAll(/size\s*=\s*(\d+)[^\n]*\n[^\n]*MEMORY_PROPERTY_DEVICE_LOCAL_BIT/g)].map((m) => Number(m[1]));
    const vramGb = heaps.length ? Math.round(Math.max(...heaps) / 1024 ** 3) : 0;
    return { name, vramGb };
  } catch {
    return { vramGb: 0 };
  }
}

// ── Backend selection ────────────────────────────────────────────────────

const BACKEND_PREFERENCE: Record<string, Backend[]> = {
  nvidia: ['cuda', 'vulkan', 'cpu'],
  amd: ['vulkan', 'hip', 'cpu'],
  apple: ['metal', 'cpu'],
  none: ['cpu'],
};

export function selectBackend(vendor: Hardware['vendor'], detectedBackend: Backend): Backend {
  const prefs = BACKEND_PREFERENCE[vendor] ?? ['cpu'];
  if (detectedBackend !== 'unknown' && detectedBackend !== 'cpu' && prefs.includes(detectedBackend)) {
    return detectedBackend;
  }
  return prefs[0]!;
}

// ── llama.cpp build planner ──────────────────────────────────────────────

export type BuildPlan = {
  backend: Backend;
  buildDir: string;
  cmakeFlags: string[];
  cmds: string[];
};

export function buildPlanLlamaCpp(backend: Backend, llamaRoot?: string): BuildPlan {
  const root = llamaRoot ?? join(HOME, 'llama.cpp');
  let buildDir: string;
  let cmakeFlags: string[];
  switch (backend) {
    case 'cuda':
      buildDir = join(root, 'build-cuda');
      cmakeFlags = ['-DGGML_CUDA=ON'];
      break;
    case 'vulkan':
      buildDir = join(root, 'build-vulkan');
      cmakeFlags = ['-DGGML_VULKAN=ON'];
      break;
    case 'hip':
      buildDir = join(root, 'build-rocm');
      cmakeFlags = ['-DGGML_HIP=ON'];
      break;
    case 'metal':
      buildDir = join(root, 'build-metal');
      cmakeFlags = ['-DGGML_METAL=ON'];
      break;
    case 'cpu':
    default:
      buildDir = join(root, 'build');
      cmakeFlags = [];
      break;
  }
  const cmds = [
    'cmake -B ' + buildDir + ' ' + cmakeFlags.join(' '),
    'cmake --build ' + buildDir + ' -j',
  ];
  return { backend, buildDir, cmakeFlags, cmds };
}

function printBuildPlan(bp: BuildPlan): void {
  console.log('\n  llama.cpp build plan [' + bp.backend + ']');
  console.log('    build dir: ' + bp.buildDir);
  for (const c of bp.cmds) console.log('    $ ' + c);
  console.log('    binary:    ' + bp.buildDir + '/bin/llama-server');
  console.log('');
}

// ── Model scan ───────────────────────────────────────────────────────────

const COMPANION_RE = /(mmproj|mtp|draft)/i;
const SHARD_RE = /-(\d{5})-of-(\d{5})\.gguf$/i;

function walk(dir: string, depth = 4): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (depth > 0 && e.name !== '.git') out.push(...walk(full, depth - 1));
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.gguf')) {
      out.push(full);
    }
  }
  return out;
}

function sharedPrefixLen(a: string, b: string): number {
  let i = 0;
  const n = Math.min(a.length, b.length);
  while (i < n && a[i] === b[i]) i += 1;
  return i;
}

function completeness(m: ModelFile): number {
  return m.sizeGb * 10 + (m.vision ? 2 : 0) + (m.draft ? 1 : 0);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function prettyLabel(stem: string): string {
  return stem.replace(/[._]/g, ' ').replace(/-(of)-/i, ' $1 ').replace(/\s+/g, ' ').trim();
}

function inferQuant(stem: string): string {
  const m = /\b(iq\d[a-z_]*|q\d(_[a-z0-9]+)*|bf16|f16|f32|tq\d_\d)\b/i.exec(stem);
  return m ? m[1]!.toLowerCase() : 'unknown';
}

function readCatalog(): Set<string> {
  const catalogPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'model-catalog.json');
  try {
    const raw = readFileSync(catalogPath, 'utf8');
    const entries = JSON.parse(raw) as Array<{ id: string; moe?: boolean }>;
    return new Set(entries.filter((e) => e.moe).map((e) => e.id));
  } catch {
    return new Set();
  }
}

function isMoe(stem: string, catalogMoe?: boolean): boolean {
  if (catalogMoe) return true;
  return /\b(a\d+b|moe|\d+x\d+b|qwen3-?(coder-)?(next|30b|35b|80b))\b/i.test(stem);
}

export function scanModels(dir: string): ModelFile[] {
  const all = walk(dir);
  const companions = all.filter((f) => COMPANION_RE.test(basename(f)));
  const bases = all.filter((f) => {
    const b = basename(f);
    if (COMPANION_RE.test(b)) return false;
    const sh = SHARD_RE.exec(b);
    return !sh || sh[1] === '00001';
  });

  const catalogMoeIds = readCatalog();

  const built: BuiltModel[] = bases.map((path) => {
    const b = basename(path);
    const stem = b.replace(SHARD_RE, '').replace(/\.gguf$/i, '');
    const folder = dirname(path);
    const shards = SHARD_RE.test(b) ? Number(SHARD_RE.exec(b)![2]) : 1;
    const sizeBytes = shards > 1
      ? all.filter((f) => dirname(f) === folder && basename(f).replace(SHARD_RE, '') === stem + '.gguf')
          .reduce((s, f) => s + safeSize(f), 0)
      : safeSize(path);
    const sizeGb = Math.round((sizeBytes / 1024 ** 3) * 10) / 10;
    const stemSlug = slug(stem);
    const stemTokens = stemSlug.split('-').filter(Boolean);
    const catalogMoe = [...catalogMoeIds].some((catId) =>
      catId.split('-').filter(Boolean).every((t) => stemTokens.includes(t))
    );
    return {
      id: slug(stem),
      label: prettyLabel(stem),
      path,
      sizeGb,
      quant: inferQuant(stem),
      moe: isMoe(stem, catalogMoe),
      vision: false,
      shards,
      incomplete: sizeBytes > 0 && sizeGb < 0.3,
      folder,
      stem,
    };
  });

  for (const c of companions) {
    const cfolder = dirname(c);
    const cstem = basename(c).toLowerCase();
    const isMmproj = /mmproj/i.test(cstem);
    for (const m of built) {
      if (m.folder !== cfolder) continue;
      if (sharedPrefixLen(m.stem.toLowerCase(), cstem) < 12) continue;
      if (isMmproj) { m.vision = true; m.mmproj = c; }
      else { m.draft = c; }
    }
  }

  const byId = new Map<string, BuiltModel>();
  for (const m of built) {
    const prev = byId.get(m.id);
    if (!prev || completeness(m) > completeness(prev)) byId.set(m.id, m);
  }

  return [...byId.values()]
    .map((m): ModelFile => ({
      id: m.id, label: m.label, path: m.path, sizeGb: m.sizeGb, quant: m.quant,
      moe: m.moe, vision: m.vision, mmproj: m.mmproj, draft: m.draft,
      shards: m.shards, incomplete: m.incomplete,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function safeSize(f: string): number {
  try { return statSync(f).size; } catch { return 0; }
}

// ── Hardware-fit math ────────────────────────────────────────────────────

export function fitModel(model: ModelFile, hw: Hardware, profile: Profile = 'full'): ModelFit {
  if (model.incomplete) return { model, fit: 'unknown', ngl: 0, ctxSize: 0 };
  const gpuBudget = Math.max(0, effectiveSizingVramGb(hw) - 2);
  const ramBudget = Math.max(0, hw.ramGb - 8);
  let fit: FitClass;
  if (!hw.vramGb || !model.sizeGb) fit = 'unknown';
  else if (model.sizeGb <= gpuBudget) fit = 'full-gpu';
  else if (model.sizeGb <= gpuBudget + ramBudget) fit = 'partial-offload';
  else fit = 'too-large';

  // Never emit -ngl 999 for partial-offload — that would pretend the model
  // fully fits GPU when it doesn't.  0 means "let llama.cpp decide" (via --fit)
  // or "no GPU offload" for MoE.
  const ngl = fit === 'full-gpu' ? 999 : 0;

  let ctxSize: number;
  if (profile === 'nano') {
    ctxSize = fit === 'full-gpu' ? 16384 : fit === 'partial-offload' ? 8192 : 4096;
  } else {
    ctxSize = fit === 'full-gpu' ? 32768 : fit === 'partial-offload' ? 16384 : 8192;
  }

  let cpuMoe: string | undefined;
  if (model.moe && fit !== 'full-gpu' && fit !== 'unknown') {
    if (fit === 'too-large') cpuMoe = '--cpu-moe';
    else {
      const overflow = Math.max(0, model.sizeGb - gpuBudget);
      const layers = Math.min(40, Math.max(1, Math.round(overflow / model.sizeGb * 48)));
      cpuMoe = '--n-cpu-moe ' + layers;
    }
  }
  return { model, fit, ngl, ctxSize, cpuMoe };
}


// ── TypeScript sizing engine integration ──────────────────────────────

type SizeModelResult = {
  maxCtx: number;
  launchFlags: string[];
  expertFlag: string;
  nCpuMoe: number;
  headroomPct: number;
  kvGb: number;
};

export function sizeModelForProvision(ggufPath: string, hw: Hardware): SizeModelResult | null {
  try {
    // Reserve RAM for OS/docker/relay/cloudflared/systemd before CPU offload;
    // the sizing engine itself also keeps a 2GB DRAM offload reserve.
    const dramGb = Math.max(0, (hw.ramGb || 0) - 4);
    const vramGb = effectiveSizingVramGb(hw);
    const { result } = sizeModel(ggufPath, Math.trunc(vramGb * GB), Math.trunc(dramGb * GB));
    const mode = result.modes.balanced;
    if (!result.ok || !mode) return null;
    const { launchFlags, expertFlag } = buildLaunchFlags(mode, { gpuLayers: mode.gpuLayers });
    return {
      maxCtx: mode.ctx,
      launchFlags,
      expertFlag,
      nCpuMoe: mode.cpuMoeLayers,
      headroomPct: mode.headroomPct,
      kvGb: mode.kvGb,
    };
  } catch {
    return null;
  }
}

// ── Generation ───────────────────────────────────────────────────────────

function shq(v: string): string {
  return "'" + v.replace(/'/g, "'\\''") + "'";
}

export function renderStartScript(model: ModelFile, entry: MapEntry, llama: LlamaServer, launchFlags?: string[]): string {
  const server = llama.path ?? 'llama-server';
  const buildDir = llama.buildDir ?? dirname(dirname(server));
  let args: string[][];
  if (launchFlags && launchFlags.length > 0) {
    const pairs: string[][] = [];
    let i = 0;
    while (i < launchFlags.length) {
      const f = launchFlags[i]!;
      if (f.startsWith('-') && i + 1 < launchFlags.length && !launchFlags[i + 1]!.startsWith('-')) {
        pairs.push([f, launchFlags[i + 1]!]);
        i += 2;
      } else {
        pairs.push([f]);
        i += 1;
      }
    }
    args = pairs;
    args.unshift(['--port', '"$LLAMA_PORT"']);
    args.unshift(['--host', '127.0.0.1']);
    args.unshift(['--model', '"$MODEL"']);
  } else {
    args = [
      ['--model', '"$MODEL"'],
      ['--host', '127.0.0.1'],
      ['--port', '"$LLAMA_PORT"'],
      ['--ctx-size', String(entry.ctx_size)],
      ['-ngl', '999'],
      ['--parallel', '1'],
      ['--flash-attn', 'on'],
      ['--cache-type-k', 'q4_0'],
      ['--cache-type-v', 'q4_0'],
      ['--jinja'],
    ];
  }
  if (entry.gpu) {
    const present = new Set(args.map((a) => a[0]!));
    for (const pair of gpuLaunchFlags(entry.gpu, present)) args.push(pair);
  }
  if (entry.thinking_levels?.length) {
    const present = new Set(args.map((a) => a[0]!));
    if (!present.has('--reasoning-format')) args.push(['--reasoning-format', 'deepseek']);
    if (!present.has('--reasoning')) args.push(['--reasoning', 'on']);
  }
  if (entry.expert_flag) {
    const present = new Set(args.map((a) => a[0]!));
    const parts = entry.expert_flag.trim().split(/\s+/);
    if (parts[0] === '--cpu-moe' && !present.has('--cpu-moe')) {
      args.push(['--cpu-moe']);
    } else if (parts[0] === '--n-cpu-moe' && parts[1] && !present.has('--n-cpu-moe')) {
      args.push(['--n-cpu-moe', parts[1]]);
    }
  }
  if (entry.multimodal && model.mmproj) args.push(['--mmproj', shq(model.mmproj)]);
  if (model.draft) args.push(['--model-draft', shq(model.draft)]);
  const body = args.map((a) => '  ' + a.join(' ') + ' \\').join('\n');
  return '#!/usr/bin/env bash\n' +
    'set -euo pipefail\n' +
    '# relay model: ' + model.id + '  (generated by relay provision)' + (model.vision ? ' · vision' : '') + (model.draft ? ' · draft' : '') + '\n' +
    'LLAMA_PORT="${LLAMA_PORT:-' + entry.port + '}"\n' +
    'MODEL=' + shq(model.path) + '\n' +
    'LLAMA_SERVER=' + shq(server) + '\n' +
    'if [[ ! -f "$MODEL" ]]; then echo "relay: model not found: $MODEL" >&2; exit 1; fi\n' +
    'cd ' + shq(buildDir) + '\n' +
    'exec "$LLAMA_SERVER" \\\n' +
    body + '\n' +
    '  "$@"\n';
}

export type MapEntry = {
  cmd: string;
  ctx_size: number;
  port: number;
  multimodal?: boolean;
  expert_flag?: string;
  thinking_levels?: string[];
  gpu?: GpuConfig;
};

/**
 * Per-model GPU placement, mapped 1:1 onto llama.cpp flags. Every field is
 * optional; only the ones set are emitted. Round-trips through the models map
 * JSON (reconcileMap preserves user edits), so this is the user-facing knob.
 */
export type GpuConfig = {
  /** `--device` — comma-separated handles, e.g. "CUDA0" or "CUDA0,CUDA1", or "none". */
  device?: string;
  /** `--split-mode` — how to spread the model across GPUs. */
  splitMode?: 'none' | 'layer' | 'row' | 'tensor';
  /** `--tensor-split` — per-GPU proportions, e.g. [3,1] for a 24G+8G pair. */
  tensorSplit?: number[];
  /** `--main-gpu` — primary device for scratch/KV. */
  mainGpu?: number;
  /** `-ngl` — exact layer count, or 'all' for full offload. Omit to leave the default / let --fit decide. */
  gpuLayers?: number | 'all';
  /** `--fit on|off` — let llama.cpp auto-fit unset args to device memory. */
  fit?: boolean;
  /** `--fit-target` — per-device free-VRAM margin (MiB). */
  fitTarget?: number[];
};

/**
 * Turn a GpuConfig into flag pairs for renderStartScript. Pure + exported so
 * the NVIDIA / multi-GPU mapping is unit-tested without the hardware.
 * `present` is the set of flags already in the base args, so we never duplicate
 * one (e.g. -ngl is in the default args).
 */
export function gpuLaunchFlags(gpu: GpuConfig, present: ReadonlySet<string> = new Set()): string[][] {
  const out: string[][] = [];
  const push = (flag: string, value?: string) => {
    if (present.has(flag)) return;
    out.push(value === undefined ? [flag] : [flag, value]);
  };
  if (gpu.device) push('--device', gpu.device);
  if (gpu.splitMode) push('--split-mode', gpu.splitMode);
  if (gpu.tensorSplit && gpu.tensorSplit.length) push('--tensor-split', gpu.tensorSplit.join(','));
  if (typeof gpu.mainGpu === 'number') push('--main-gpu', String(gpu.mainGpu));
  if (gpu.gpuLayers !== undefined && !present.has('-ngl') && !present.has('--n-gpu-layers') && !present.has('--gpu-layers')) {
    out.push(['-ngl', gpu.gpuLayers === 'all' ? '999' : String(gpu.gpuLayers)]);
  }
  if (gpu.fit !== undefined) push('--fit', gpu.fit ? 'on' : 'off');
  if (gpu.fitTarget && gpu.fitTarget.length) push('--fit-target', gpu.fitTarget.join(','));
  return out;
}

const MULTI_GPU_MIN_USABLE_GB = 4;
const MULTI_GPU_MIN_SECONDARY_FRAC = 0.25;

function perGpuReserveGb(vendor: Hardware['vendor']): number {
  if (vendor === 'amd') return 1.5;
  if (vendor === 'nvidia') return 1.0;
  if (vendor === 'apple') return 1.0;
  return 1.0;
}

export type GpuPlacementPlan = {
  devices: GpuInfo[];
  config: GpuConfig;
  /** Effective aggregate VRAM budget for Relay sizing, after per-device reserve. */
  effectiveVramGb: number;
};

/**
 * Pick a portable llama.cpp GPU placement. Default to layer split: it works on
 * CUDA, Vulkan/HIP, and Metal, accepts the same --device handles printed by
 * --list-devices, and avoids experimental tensor mode. Tiny integrated GPUs are
 * filtered out so a discrete card is not slowed down or OOMed by a 1-2GB iGPU.
 */
export function planGpuPlacement(hw: Hardware): GpuPlacementPlan | undefined {
  if (!hw.gpus.length) return undefined;
  const reserve = perGpuReserveGb(hw.vendor);
  const scored = hw.gpus
    .map((gpu) => ({ gpu, usableGb: Math.max(0, gpu.vramGb - reserve) }))
    .filter((x) => x.usableGb >= MULTI_GPU_MIN_USABLE_GB)
    .sort((a, b) => b.usableGb - a.usableGb || a.gpu.index - b.gpu.index);
  if (!scored.length) return undefined;

  const largest = scored[0]!.usableGb;
  const selected = scored
    .filter((x) => x.usableGb >= largest * MULTI_GPU_MIN_SECONDARY_FRAC)
    .sort((a, b) => a.gpu.index - b.gpu.index);
  if (!selected.length) return undefined;

  if (selected.length === 1) {
    const only = selected[0]!;
    if (hw.gpuCount <= 1) return undefined;
    return {
      devices: [only.gpu],
      config: { device: only.gpu.device },
      effectiveVramGb: only.gpu.vramGb,
    };
  }

  return {
    devices: selected.map((x) => x.gpu),
    config: {
      device: selected.map((x) => x.gpu.device).join(','),
      splitMode: 'layer',
      tensorSplit: selected.map((x) => x.gpu.vramGb),
    },
    effectiveVramGb: Math.max(0, Math.round(selected.reduce((sum, x) => sum + x.usableGb, 0) * 10) / 10),
  };
}

/** Effective VRAM budget used by fit/sizing. Single GPU keeps legacy behavior;
 * multi-GPU uses the selected layer-split aggregate budget. */
export function effectiveSizingVramGb(hw: Hardware): number {
  const placement = planGpuPlacement(hw);
  return placement?.effectiveVramGb ?? hw.vramGb;
}

export function modelMapEntry(fit: ModelFit, containerScriptPath: string, port: number, tuned?: SizeModelResult): MapEntry {
  const ctx_size = tuned?.maxCtx || fit.ctxSize;
  const e: MapEntry = { cmd: containerScriptPath, ctx_size, port };
  if (fit.model.vision) e.multimodal = true;
  if (tuned?.expertFlag) e.expert_flag = tuned.expertFlag;
  else if (fit.cpuMoe) e.expert_flag = fit.cpuMoe;
  return e;
}

export type Reconciled = {
  merged: Record<string, MapEntry>;
  preserved: string[];
  added: string[];
  kept: string[];
};

export function reconcileMap(
  generated: Record<string, MapEntry>,
  existing: Record<string, MapEntry>,
): Reconciled {
  const merged: Record<string, MapEntry> = {};
  const preserved: string[] = [];
  const added: string[] = [];
  const kept: string[] = [];
  for (const [id, gen] of Object.entries(generated)) {
    if (existing[id]) {
      merged[id] = { ...gen, ...existing[id] };
      preserved.push(id);
    } else {
      merged[id] = gen;
      added.push(id);
    }
  }
  for (const [id, ex] of Object.entries(existing)) {
    if (!merged[id]) { merged[id] = ex; kept.push(id); }
  }
  return { merged, preserved, added, kept };
}

function usedPorts(existing: Record<string, MapEntry>): Set<number> {
  return new Set(Object.values(existing).map((e) => e.port).filter((p): p is number => typeof p === 'number'));
}

export function generateMap(
  plan: Plan,
  existing: Record<string, MapEntry>,
  containerScriptDir = '/relay/start-scripts',
  portBase = 8081,
): { map: Record<string, MapEntry>; tuned: Record<string, SizeModelResult> } {
  const taken = usedPorts(existing);
  let next = portBase;
  const nextPort = (id: string): number => {
    if (existing[id]?.port) return existing[id]!.port;
    while (taken.has(next)) next += 1;
    taken.add(next);
    return next;
  };
  const out: Record<string, MapEntry> = {};
  const tuned: Record<string, SizeModelResult> = {};
  for (const fit of plan.models) {
    if (fit.model.incomplete) continue;
    const port = nextPort(fit.model.id);
    let sizeResult: SizeModelResult | undefined;
    if (!existing[fit.model.id]) {
      console.error('  tuning: ' + fit.model.id + ' ...');
      sizeResult = sizeModelForProvision(fit.model.path, plan.hw) ?? undefined;
      if (sizeResult) {
        tuned[fit.model.id] = sizeResult;
      }
    }
    const entry = modelMapEntry(fit, containerScriptDir + '/start-' + fit.model.id + '.sh', port, sizeResult);
    // Multi-GPU default: use llama.cpp layer split across selected devices.
    // Device handles come from --list-devices, so this works for CUDA, Vulkan,
    // HIP/ROCm, and Metal. Tiny iGPUs are filtered by planGpuPlacement().
    if (plan.hw.gpuCount > 1 && !entry.gpu) {
      const placement = planGpuPlacement(plan.hw);
      if (placement) entry.gpu = placement.config;
    }
    out[fit.model.id] = entry;
  }
  return { map: out, tuned };
}

export function readExistingMap(envPath: string): Record<string, MapEntry> {
  try {
    const text = readFileSync(envPath, 'utf8');
    const m = /^RELAY_MODEL_MAP=(.*)$/m.exec(text);
    if (!m) return {};
    return JSON.parse(m[1]!) as Record<string, MapEntry>;
  } catch {
    return {};
  }
}

// ── Apply ────────────────────────────────────────────────────────────────

export function composeVolumes(layout: Layout, llama: LlamaServer): string[] {
  const build = llama.buildDir ?? join(HOME, 'llama.cpp/build');
  return [
    layout.modelsDir + ':' + layout.modelsDir + ':ro',
    build + ':' + build + ':ro',
    layout.scriptsDir + ':/relay/start-scripts:ro',
  ];
}

function renderEnv(envPath: string, updates: Record<string, string>): string {
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split('\n') : [];
  const seen = new Set<string>();
  const out = lines.map((l) => {
    if (!l || l.trimStart().startsWith('#')) return l;
    const i = l.indexOf('=');
    if (i <= 0) return l;
    const k = l.slice(0, i);
    if (k in updates) { seen.add(k); return k + '=' + updates[k]; }
    return l;
  });
  for (const [k, v] of Object.entries(updates)) if (!seen.has(k)) out.push(k + '=' + v);
  return out.join('\n').replace(/\n+$/, '') + '\n';
}

export type ApplyResult = {
  backupDir: string;
  scriptsDir: string;
  scriptsWritten: number;
  newModels: string[];
  preservedCount: number;
  keptCount: number;
  stagedEnv: string;
  volumes: string[];
  llamaPath: string | null;
};

export function applyProvision(
  repoDir: string,
  opts: Partial<ProvisionOptions> & { writeScripts?: boolean } = {},
): ApplyResult {
  const writeScripts = opts.writeScripts ?? true;
  const envPath = join(repoDir, '.env');
  const composePath = join(repoDir, 'docker-compose.yml');
  const plan = buildPlan({
    apply: opts.apply ?? true,
    profile: opts.profile ?? 'full',
    backend: opts.backend ?? 'auto',
    modelsDir: opts.modelsDir,
    skipBuild: opts.skipBuild ?? false,
    skipDocker: opts.skipDocker ?? false,
    smoke: opts.smoke ?? false,
  });
  const existing = readExistingMap(envPath);
  const { map: generated, tuned } = generateMap(plan, existing);
  const { merged, preserved, added, kept } = reconcileMap(generated, existing);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(plan.layout.relayHome, 'backups', ts);
  mkdirSync(backupDir, { recursive: true });
  mkdirSync(plan.layout.scriptsDir, { recursive: true });
  mkdirSync(plan.layout.logsDir, { recursive: true });
  if (existsSync(envPath)) copyFileSync(envPath, join(backupDir, '.env.bak'));
  if (existsSync(composePath)) copyFileSync(composePath, join(backupDir, 'docker-compose.yml.bak'));

  const fileById = new Map(plan.models.map((f) => [f.model.id, f.model]));
  let scriptsWritten = 0;
  if (writeScripts) {
    for (const [id, entry] of Object.entries(merged)) {
      const model = fileById.get(id);
      if (!model) continue;
      const scriptPath = join(plan.layout.scriptsDir, 'start-' + id + '.sh');
      writeFileSync(scriptPath, renderStartScript(model, entry, plan.llama, tuned[id]?.launchFlags));
      chmodSync(scriptPath, 0o755);
      scriptsWritten += 1;
    }
  }

  const stagedEnv = join(backupDir, '.env.new');
  writeFileSync(stagedEnv, renderEnv(envPath, {
    RELAY_MODEL_MAP: JSON.stringify(merged),
    RELAY_MODEL_DIR: plan.layout.modelsDir,
    RELAY_LLAMA_SERVER_PATH: plan.llama.path ?? '',
    RELAY_LOG_FILE: join(plan.layout.logsDir, 'relay.log'),
  }));

  return {
    backupDir,
    scriptsDir: plan.layout.scriptsDir,
    scriptsWritten,
    newModels: added,
    preservedCount: preserved.length,
    keptCount: kept.length,
    stagedEnv,
    volumes: composeVolumes(plan.layout, plan.llama),
    llamaPath: plan.llama.path,
  };
}

// ── Rollback ─────────────────────────────────────────────────────────────

export function printRollback(backupDir: string, envPath: string, composePath: string): void {
  console.log('\n  Rollback (restore backups):');
  if (existsSync(join(backupDir, '.env.bak'))) {
    console.log('    cp ' + join(backupDir, '.env.bak') + ' ' + envPath);
  }
  if (existsSync(join(backupDir, 'docker-compose.yml.bak'))) {
    console.log('    cp ' + join(backupDir, 'docker-compose.yml.bak') + ' ' + composePath);
  }
  console.log('');
}

// ── Smoke check ──────────────────────────────────────────────────────────

export function smokeCheck(port?: number): void {
  const p = port ?? DEFAULT_PORT;
  console.log('\n  Smoke: GET http://127.0.0.1:' + p + '/v1/models ...');
  try {
    const curl = execFileSync('curl', ['-s', '-f', '--max-time', '10', 'http://127.0.0.1:' + p + '/v1/models'],
      { encoding: 'utf8', timeout: 12000, stdio: ['ignore', 'pipe', 'pipe'] });
    const data = JSON.parse(curl);
    if (data?.data && Array.isArray(data.data)) {
      console.log('  ✓ Relay is running. ' + data.data.length + ' model(s) available:');
      for (const m of data.data) {
        console.log('    - ' + (m.id ?? '(unnamed)'));
      }
    } else if (data?.object === 'list' && data.data) {
      console.log('  ✓ Relay is running. ' + data.data.length + ' model(s) available:');
      for (const m of data.data) {
        console.log('    - ' + (m.id ?? '(unnamed)'));
      }
    } else {
      console.log('  ⚠ Relay responded but no model list found.');
    }
  } catch {
    console.log('  ⚠ Could not reach Relay. Is it running?');
    console.log('    Try: curl http://127.0.0.1:' + p + '/v1/models');
  }
}

// ── Plan ─────────────────────────────────────────────────────────────────

export type Plan = {
  layout: Layout;
  llama: LlamaServer;
  hw: Hardware;
  models: ModelFit[];
  backend: Backend;
  profile: Profile;
  buildPlan?: BuildPlan;
};

export function buildPlan(opts?: ProvisionOptions, env: NodeJS.ProcessEnv = process.env): Plan {
  const profile = opts?.profile ?? 'full';
  const modelsDirOverride = opts?.modelsDir;

  const layout = resolveLayout(env, modelsDirOverride);
  const detected = detectLlamaServer(env);

  let llama = detected;
  let backend: Backend = opts?.backend ?? 'auto';

  if (backend === 'auto') {
    const hwTemp = detectHardware();
    backend = selectBackend(hwTemp.vendor, detected.backend);
  } else {
    if (llama.path) {
      llama = { ...llama, backend };
    }
  }

  const hw = detectHardware();
  const models = scanModels(layout.modelsDir).map((m) => fitModel(m, hw, profile));

  let buildPlan: BuildPlan | undefined;
  if (!llama.path && !opts?.skipBuild) {
    buildPlan = buildPlanLlamaCpp(backend);
  }

  return { layout, llama, hw, models, backend, profile, buildPlan };
}

/** One honest hardware summary line. Pure + exported for snapshot testing. */
export function formatHardware(hw: Hardware): string {
  if (hw.vendor === 'none' || hw.gpuCount === 0) {
    return 'none · no GPU · CPU only · ' + hw.ramGb + 'GB RAM';
  }
  const plural = hw.gpuCount === 1 ? 'GPU' : 'GPUs';
  const name = hw.gpuName ? ' · ' + hw.gpuName : '';
  // Per-card VRAM: collapse to "16GB each" when uniform, else "24GB + 8GB".
  const vrams = hw.gpus.map((g) => g.vramGb);
  const uniform = vrams.every((v) => v === vrams[0]);
  const perCard = hw.gpuCount === 1
    ? hw.maxGpuVramGb + 'GB'
    : uniform
      ? hw.maxGpuVramGb + 'GB each'
      : vrams.map((v) => v + 'GB').join(' + ');
  return hw.vendor + ' · ' + hw.gpuCount + ' ' + plural + name + ' · ' + perCard +
    ' · ' + hw.totalGpuVramGb + 'GB total VRAM · ' + hw.ramGb + 'GB RAM';
}

function printPlan(plan: Plan, skipDocker = false): void {
  const { layout, llama, hw, models, backend, profile, buildPlan } = plan;
  const w = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
  console.log('\nRelay provisioning plan');
  console.log('───────────────────────');
  console.log('  profile:     ' + profile);
  console.log('  backend:     ' + backend);
  console.log('  layout       relay=' + layout.relayHome);
  console.log('               models=' + layout.modelsDir);
  console.log('               scripts=' + layout.scriptsDir + '  logs=' + layout.logsDir);
  console.log('  llama-server ' + (llama.path ?? '(none — would build)') + '  [' + llama.backend + ', via ' + llama.source + ']');
  console.log('  hardware     ' + formatHardware(hw));
  if (hw.gpuCount > 1) {
    const placement = planGpuPlacement(hw);
    const devices = placement?.devices.map((g) => g.device).join(',') ?? 'none';
    console.log('               split budget: ' + effectiveSizingVramGb(hw) + 'GB  ·  total physical VRAM: ' + hw.totalGpuVramGb + 'GB  ·  devices: ' + devices);
  }
  console.log('  models       ' + models.length + ' found in ' + layout.modelsDir + '\n');
  for (const f of models) {
    const flags = [
      f.model.incomplete ? 'INCOMPLETE?' : 'ngl ' + f.ngl,
      f.model.incomplete ? '' : 'ctx ' + f.ctxSize,
      f.cpuMoe ?? '',
      f.model.vision ? 'vision' : '',
      f.model.draft ? 'draft' : '',
      f.model.shards > 1 ? f.model.shards + ' shards' : '',
    ].filter(Boolean).join(' ');
    console.log('  ' + w(f.fit, 16) + w(f.model.id, 44) + w(f.model.sizeGb + 'GB ' + f.model.quant, 16) + flags);
  }

  if (hw.vendor === 'none') {
    console.log('\n  ⚠ Warning: No GPU detected. Models will run CPU-only (very slow).');
  }
  if (hw.gpuCount > 1) {
    const placement = planGpuPlacement(hw);
    console.log('\n  ℹ ' + hw.gpuCount + ' GPUs: defaulting to llama.cpp layer split across selected devices.');
    if (placement) {
      console.log('    flags: ' + gpuLaunchFlags(placement.config).map((p) => p.join(' ')).join(' '));
    }
    console.log('    For finer control edit the per-model "gpu" block in RELAY_MODEL_MAP.');
  }
  if (profile === 'nano' && hw.ramGb > 0 && hw.ramGb < 8) {
    console.log('  ⚠ Warning: Less than 8GB RAM. Nano profile may still be tight.');
  }
  if (profile === 'full' && hw.ramGb > 0 && hw.ramGb < 12) {
    console.log('  ⚠ Warning: Less than 12GB RAM. Consider --profile nano.');
  }

  if (buildPlan) {
    printBuildPlan(buildPlan);
  }

  if (!skipDocker) {
    console.log('  Docker compose mounts:');
    for (const v of composeVolumes(layout, llama)) console.log('    - ' + v);
  }

  console.log('');
}

// ── CLI argument parsing ─────────────────────────────────────────────────

function printUsage(): void {
  console.log('\nUsage: relay provision [flags]');
  console.log('');
  console.log('  Detects hardware, scans models, and generates or reconciles Relay config.');
  console.log('');
  console.log('Flags:');
  console.log('  --apply               Apply the plan (writes scripts, stages .env). Default: dry-run.');
  console.log('  --profile nano|full   Profile: nano (conservative, small nodes) or full (default).');
  console.log('  --backend auto|cuda|vulkan|rocm|metal|cpu');
  console.log('                        Override backend selection. Default: auto.');
  console.log('  --models-dir <path>   Override model search root directory.');
  console.log('  --skip-build          Skip llama.cpp build plan; use existing binary only.');
  console.log('  --skip-docker         Skip Docker Compose mount suggestions.');
  console.log('  --smoke               Run post-provision smoke check against running Relay.');
  console.log('  --help, -h            Show this help.');
  console.log('');
}

export function parseProvisionArgs(args: string[]): ProvisionOptions & { help: boolean } {
  const opts: ProvisionOptions = {
    apply: false,
    profile: 'full',
    backend: 'auto' as Backend,
    skipBuild: false,
    skipDocker: false,
    smoke: false,
  };
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    switch (a) {
      case '--apply':
        opts.apply = true;
        break;
      case '--profile':
        if (args[i + 1] === 'nano' || args[i + 1] === 'full') {
          opts.profile = args[++i]! as Profile;
        }
        break;
      case '--backend':
        if (args[i + 1] && ['auto', 'cuda', 'vulkan', 'rocm', 'metal', 'cpu', 'hip'].includes(args[i + 1]!)) {
          const raw = args[++i]!;
          opts.backend = (raw === 'hip' || raw === 'rocm' ? 'hip' : raw) as Backend;
        }
        break;
      case '--models-dir':
        if (args[i + 1]) opts.modelsDir = args[++i];
        break;
      case '--skip-build':
        opts.skipBuild = true;
        break;
      case '--skip-docker':
        opts.skipDocker = true;
        break;
      case '--smoke':
        opts.smoke = true;
        break;
      case '--help':
      case '-h':
        help = true;
        break;
    }
  }
  return { ...opts, help };
}

// ── Main CLI ─────────────────────────────────────────────────────────────

export function runProvisionCli(args: string[], repoDir: string): void {
  const opts = parseProvisionArgs(args);

  if (opts.help) {
    printUsage();
    process.exit(0);
  }

  const plan = buildPlan(opts);

  if (opts.smoke) {
    smokeCheck();
    process.exit(0);
  }

  if (opts.apply) {
    const r = applyProvision(repoDir, opts);
    const envPath = join(repoDir, '.env');
    const composePath = join(repoDir, 'docker-compose.yml');
    console.log('\nProvision applied (staged — live service untouched)');
    console.log('──────────────────────────────────────────────────');
    console.log('  scripts written   ' + r.scriptsWritten + ' → ' + r.scriptsDir);
    console.log('  preserved tuning  ' + r.preservedCount + '   new ' + r.newModels.length + '   kept(off-disk) ' + r.keptCount);
    console.log('  llama-server      ' + (r.llamaPath ?? '(none)'));
    console.log('  backup            ' + r.backupDir);
    console.log('  staged .env       ' + r.stagedEnv);
    if (!opts.skipDocker) {
      console.log('\n  compose mounts to apply at cutover:');
      for (const v of r.volumes) console.log('    - ' + v);
    }
    printRollback(r.backupDir, envPath, composePath);
    console.log('  cutover (your call): swap staged .env, set the mounts above, then restart relay.\n');
    process.exit(0);
  }

  // Dry-run
  printPlan(plan, opts.skipDocker);

  const envPath = join(repoDir, '.env');
  const existing = readExistingMap(envPath);
  const { map: generated } = generateMap(plan, existing);
  const { merged, preserved, added, kept } = reconcileMap(generated, existing);
  console.log('Reconcile (vs current RELAY_MODEL_MAP)');
  console.log('─────────────────────────────────────');
  console.log('  generated ' + Object.keys(generated).length + '  ·  preserved-tuning ' + preserved.length + '  ·  new ' + added.length + '  ·  kept-unscanned ' + kept.length + '  ·  total ' + Object.keys(merged).length);
  if (added.length) console.log('  new models:   ' + added.join(', '));
  if (kept.length) console.log('  kept (not on disk): ' + kept.join(', '));

  if (!opts.skipDocker && plan.buildPlan) {
    console.log('\n  ⚠ No llama-server found and --skip-build not set.');
    console.log('  Build it first, then re-run. See build plan above.');
  }

  console.log('\n  apply with: relay provision --apply   (writes scripts, stages .env — live service untouched)');
  console.log('  smoke with: relay provision --smoke\n');
}

// Standalone entry for verification.
if (process.argv[1] && process.argv[1].endsWith('provision.ts')) {
  runProvisionCli(process.argv.slice(2), join(dirname(process.argv[1]), '..'));
}
