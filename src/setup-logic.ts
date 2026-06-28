/**
 * Relay setup logic — pure functions for config, model catalog, GPU probing,
 * and start-script generation. No UI code. Imported by both the TUI (setup.ts)
 * and tests.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { packageDir, envFilePath, startScriptsDir, ensureDataDir } from './paths.ts';
import { sizeModel, buildLaunchFlags, GB, KV_QUANT_RATIO, type FitStrategy, type SizedMode, type SizeResult } from './sizing/size-model.ts';
export type { FitStrategy };

// ── Types ───────────────────────────────────────────────────────────────

export type CatalogEntry = {
  id: string;
  label: string;
  family: string;
  lane: string;
  ctx: number;
  vision: boolean;
  thinking: 'off' | 'on' | 'toggle';
  quant: string;
  size_gb?: number;
  download_url?: string;
  filename?: string;
  hf_repo?: string;
  moe?: boolean;
  arch?: string;
  expert_count?: number;
  active_experts?: number;
  shards?: number;
  /** GGUF-derived KV bytes-per-token at F32 (from the model's own header, via
   *  `relay catalog enrich`). When present it's the source of truth for the fit
   *  estimate — no hand-maintained per-arch table needed. */
  kv_ptok?: number;
  /** GGUF-derived non-expert byte fraction (shared/attention weights that stay
   *  on the GPU for MoE). The real split from the file, not the nact/nexp proxy. */
  nonex_frac?: number;
};

export type EnvMap = Map<string, string>;

export type GpuProbe = {
  gpu_type: string;
  driver: string;
  vram_total_gb: number;
  vram_free_gb: number;
};

export type FitClass = 'full-gpu' | 'partial-offload' | 'too-large' | 'unknown';

export type CloudflareInfo = {
  installed: boolean;
  version?: string;
  certPresent: boolean;
  tunnels: Array<{ id: string; name: string }>;
  serviceActive: boolean;
};

export type Deployment = { serviceActive: boolean; dockerPresent: boolean };

// ── Constants ───────────────────────────────────────────────────────────

export const PKG = packageDir();
export const ENV_PATH = envFilePath();
export const EXAMPLE_PATH = resolve(PKG, '.env.example');
export const CATALOG_PATH = resolve(PKG, 'docs', 'model-catalog.json');
export const CUSTOM_CATALOG_PATH = resolve(PKG, 'docs', 'custom-catalog.json');
export const START_SCRIPTS_DIR = startScriptsDir();
export const PROBE_GPU_PATH = resolve(PKG, 'scripts', 'probe-gpu.sh');
export const PKG_PATH = resolve(PKG, 'package.json');
export const DOCTOR_SCRIPT = resolve(PKG, 'scripts', 'doctor.ts');

export const SYSTEM_RAM_GB = detectSystemRamGb();

// ── Version ─────────────────────────────────────────────────────────────

export function relayVersion(): string {
  try {
    return (JSON.parse(readFileSync(PKG_PATH, 'utf8')) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ── Env file I/O ────────────────────────────────────────────────────────

export function parseEnv(text: string): EnvMap {
  const env = new Map<string, string>();
  for (const line of text.split('\n')) {
    if (!line || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    env.set(line.slice(0, idx), line.slice(idx + 1));
  }
  return env;
}

export function writeEnv(path: string, env: EnvMap): void {
  const original = readFileSync(path, 'utf8').split('\n');
  const seen = new Set<string>();
  const next = original.map((line) => {
    if (!line || line.trimStart().startsWith('#')) return line;
    const idx = line.indexOf('=');
    if (idx <= 0) return line;
    const key = line.slice(0, idx);
    if (!env.has(key)) return line;
    seen.add(key);
    return `${key}=${env.get(key) ?? ''}`;
  });
  for (const [key, value] of env.entries()) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  writeFileSync(path, `${next.join('\n').replace(/\n+$/, '')}\n`);
}

export function seedEnv(): EnvMap {
  if (!existsSync(ENV_PATH) && existsSync(EXAMPLE_PATH)) {
    ensureDataDir();
    copyFileSync(EXAMPLE_PATH, ENV_PATH);
  }
  return existsSync(ENV_PATH) ? parseEnv(readFileSync(ENV_PATH, 'utf8')) : new Map<string, string>();
}

export function endpoint(env: EnvMap): string {
  return `http://${env.get('HOST') ?? '127.0.0.1'}:${env.get('PORT') ?? '1234'}/v1`;
}

// ── Catalog ─────────────────────────────────────────────────────────────

export function readCatalog(): CatalogEntry[] {
  let entries: CatalogEntry[] = [];
  if (existsSync(CATALOG_PATH)) {
    entries = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as CatalogEntry[];
  }
  // Merge custom catalog entries (manually curated models outside Unsloth collection).
  // Custom entries provide the base metadata; main-catalog entries (which may have
  // GGUF-derived kv_ptok / nonex_frac from `relay catalog enrich`) overlay on top.
  if (existsSync(CUSTOM_CATALOG_PATH)) {
    const custom = JSON.parse(readFileSync(CUSTOM_CATALOG_PATH, 'utf8')) as CatalogEntry[];
    const customById = new Map(custom.map((e) => [e.id, e]));
    const customRepos = new Set(custom.map((e) => e.hf_repo).filter(Boolean) as string[]);
    const merged = new Map<string, CatalogEntry>();
    for (const e of entries) {
      const customMatch = customById.get(e.id) ?? (e.hf_repo && customRepos.has(e.hf_repo) ? [...customById.values()].find((c) => c.hf_repo === e.hf_repo) : undefined);
      if (customMatch) {
        // Start with custom entry (hand-curated metadata), then overlay GGUF-derived
        // fields from the enriched main-catalog entry.
        const combined = { ...customMatch };
        if (e.kv_ptok != null) combined.kv_ptok = e.kv_ptok;
        if (e.nonex_frac != null) combined.nonex_frac = e.nonex_frac;
        if (e.arch && e.arch !== '?') combined.arch = e.arch;
        if (e.expert_count != null) combined.expert_count = e.expert_count;
        if (e.active_experts != null) combined.active_experts = e.active_experts;
        merged.set(e.id, combined);
      } else {
        merged.set(e.id, e);
      }
    }
    // Add custom entries that have no main-catalog counterpart at all
    for (const c of custom) {
      if (!merged.has(c.id)) merged.set(c.id, c);
    }
    entries = [...merged.values()];
  }
  return entries;
}

/** Scan the model directory for downloaded GGUFs and return the set of
  * catalog IDs that appear to be already present on disk. */
export function detectInstalledModels(modelDir: string): Set<string> {
  const installed = new Set<string>();
  const diskFiles: Array<{ name: string; path: string }> = [];
  try {
    const walk = (dir: string, depth: number) => {
      if (depth < 0) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = resolve(dir, e.name);
        if (e.isDirectory()) { walk(full, depth - 1); }
        else if (e.isFile() && e.name.toLowerCase().endsWith('.gguf')) {
          diskFiles.push({ name: e.name.toLowerCase(), path: full.toLowerCase() });
        }
      }
    };
    walk(modelDir, 4);
  } catch { /* best-effort */ }

  const catalog = readCatalog();
  for (const m of catalog) {
    const fn = (m.filename ?? '').toLowerCase();
    const idStem = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Extract repo from URL to disambiguate MTP vs non-MTP (same filename, different repo)
    const repo = extractRepoFromUrl(m.download_url ?? '');
    for (const df of diskFiles) {
      const dfClean = df.name.replace(/\.gguf$/i, '').replace(/[^a-z0-9]/g, '');
      if (fn && df.name === fn) {
        // Filename match — verify repo if the path contains one
        const pathHasRepo = /unsloth\/[^/]+/.test(df.path) || /mradermacher\/[^/]+/.test(df.path);
        if (!repo || !pathHasRepo || df.path.includes(repo.toLowerCase())) { installed.add(m.id); break; }
        continue;
      }
      if (idStem.length > 6 && dfClean.includes(idStem)) {
        const pathHasRepo = /unsloth\/[^/]+/.test(df.path) || /mradermacher\/[^/]+/.test(df.path);
        if (!repo || !pathHasRepo || df.path.includes(repo.toLowerCase())) { installed.add(m.id); break; }
      }
    }
  }
  return installed;
}

/** Extract the HuggingFace repo name from a download URL. */
function extractRepoFromUrl(url: string): string | null {
  const m = url.match(/huggingface\.co\/[^/]+\/([^/]+)/i);
  return m ? m[1] ?? null : null;
}

// ── GPU probing ─────────────────────────────────────────────────────────

export function probeGpu(): GpuProbe | undefined {
  if (!existsSync(PROBE_GPU_PATH)) return undefined;
  try {
    const raw = execFileSync('bash', [PROBE_GPU_PATH], { cwd: PKG, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const parsed = JSON.parse(raw) as GpuProbe;
    if (!parsed || typeof parsed.vram_total_gb !== 'number') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function classifyFit(model: CatalogEntry, gpu: GpuProbe): FitClass {
  return classifyFitFromCatalog(model, gpu);
}

/** Catalog-aware classifier. Uses moe/arch/expert_count when available for
  * expert-offloading awareness, falling back to simple VRAM+RAM buckets. */
export function classifyFitFromCatalog(model: CatalogEntry, gpu: GpuProbe): FitClass {
  const estimate = model.size_gb;
  if (!estimate || !gpu.vram_total_gb) return 'unknown';
  const gpuBudget = Math.max(0, gpu.vram_total_gb - 2);
  const ramBudget = Math.max(0, SYSTEM_RAM_GB - 8);

  // Full GPU fit (dense or small MoE) — whole file fits
  if (estimate <= gpuBudget) return 'full-gpu';

  // MoE-aware check: can we offload experts via --cpu-moe / --n-cpu-moe?
  if (model.moe === true) {
    const nonexRatio: number = (model.active_experts != null && model.expert_count != null && model.expert_count > 0)
      ? model.active_experts / model.expert_count
      : (model.active_experts != null && model.active_experts <= 8 ? 0.10
        : (model.expert_count != null && model.expert_count >= 128 ? 0.06 : 0.10));
    const nonexGb = estimate * nonexRatio;
    // The non-expert (shared) portion stays on GPU; experts go to DRAM.
    if (nonexGb <= gpuBudget && estimate <= gpuBudget + ramBudget) {
      return 'partial-offload';
    }
    return 'too-large';
  }

  // Dense model: traditional VRAM + RAM bucket logic
  const combinedBudget = Math.max(gpuBudget, gpuBudget + ramBudget);
  return estimate <= combinedBudget ? 'partial-offload' : 'too-large';
}

/** Coarse catalog-only context recommendation.
 *
 *  This is a fast fallback that uses only file-size and VRAM totals — it
 *  does NOT account for KV cache cost, per-layer offloading, or expert
 *  placement. The arbitrary clamps (65k/32k) are placeholders.
 *
 *  @deprecated   Use the real sizing engine (sizeModelTS) whenever the GGUF
 *  is on disk.  `configureQuickstart` already prefers sizeModelTS results;
 *  this function only runs as a fallback before the sizing engine fires.
 */
export function recommendedContext(model: CatalogEntry, gpu?: GpuProbe): number {
  if (!gpu) return model.ctx;
  const fit = classifyFit(model, gpu);
  if (fit === 'full-gpu') return model.ctx;
  // Conservative clamp when we have no per-layer KV budget:
  if (fit === 'partial-offload') return Math.min(model.ctx, 65_536);
  return Math.min(model.ctx, 32_768);
}

export function fitLabel(fit: FitClass): string {
  if (fit === 'full-gpu') return 'fits GPU';
  if (fit === 'partial-offload') return 'partial offload';
  if (fit === 'too-large') return 'no fit';
  return 'fit unknown';
}

export function fmtCtx(ctx: number): string {
  return ctx >= 1024 ? `${Math.round(ctx / 1024)}k` : String(ctx);
}

// ── Catalog-level sizing estimate (no GGUF needed) ─────────────────────

/** Per-architecture KV cache bytes-per-token at q4_0 with flash-attention.
 *  This is the catalog-only fast path (no GGUF on disk); the real answer always
 *  comes from sizeModel()/analyze() once the file is downloaded.
 *
 *  These values are CALIBRATED against real GGUF metadata — each is the exact
 *  `analyze().kvPtok` the TS sizing engine computes for the catalog's actual
 *  model of that architecture (measured on-box). kvPtok scales with the layer
 *  count, so the value is tied to the catalog's representative model, not the
 *  architecture in the abstract. Suffixed keys ('gemma4:moe') are tried first
 *  (arch + :moe/:dense), then bare arch.
 *
 *  Measured (model · layers · kvPtok):
 *    qwen3moe   — Qwen3-30B-A3B        · 48L · 27648
 *    qwen35moe  — Qwen3.6-35B-A3B      · 40L · 23040
 *    qwen3next  — Qwen3-Coder-Next     · 48L ·  6912  (linear/hybrid attn → tiny KV)
 *    gemma4:moe — Gemma 4 26B-A4B      · 30L ·  5760  (SWA: only global layers grow)
 *    gemma4:dense— Gemma 4 31B         · 60L · 23040  (SWA)
 *    deepseek2  — GLM-4.7-Flash 23B    · 47L · 15228  (MLA latent KV)
 *    cohere2moe — North-Mini-Code      · 49L · 28224
 *    gpt-oss    — HyperNova 60B        · 32L · 18432  (head_dim 64)
 *    mistral3   — Devstral-2 24B       · 40L · 46080
 *    qwen35     — Qwen3.6-27B (dense)  · 64L · 73728 */
/** Per-architecture KV cache bytes-per-token at F32 (architecture-dimension).
 *  Calibrated against real GGUF analyze().kvPtok values. Apply KV_QUANT_RATIO
 *  for Q4/Q8 budget math in estimateContextFromCatalog().
 *
 *  Measured (model · layers · kvPtok F32):
 *    qwen3moe   — Qwen3-30B-A3B        · 48L · 49152
 *    qwen35moe  — Qwen3.6-35B-A3B      · 40L · 40960
 *    qwen3next  — Qwen3-Coder-Next     · 48L · 12288  (linear/hybrid attn)
 *    gemma4:moe — Gemma 4 26B-A4B      · 30L · 10240  (SWA)
 *    gemma4:dense— Gemma 4 31B         · 60L · 40960  (SWA)
 *    deepseek2  — GLM-4.7-Flash 23B    · 47L · 27072  (MLA latent KV)
 *    cohere2moe — North-Mini-Code      · 49L · 50176
 *    gpt-oss    — HyperNova 60B        · 32L · 32768
 *    mistral3   — Devstral-2 24B       · 40L · 81920
 *    qwen35     — Qwen3.6-27B (dense)  · 64L · 131072 */
const KV_PTOK_EST: Record<string, number> = {
  // ── MoE architectures (measured, F32) ──
  'qwen3moe':       49152,
  'qwen35moe':      40960,
  'qwen3next':      12288,
  'gemma4:moe':     10240,
  'deepseek2':      27072,
  'cohere2moe':     50176,
  'gpt-oss':        32768,
  // ── Dense architectures (measured, F32) ──
  'gemma4:dense':   40960,
  'qwen35':        131072,
  'mistral3':       81920,
  'mistral3:moe':   35556,
  // ── Estimates (no GGUF on hand, conservative — errs high) ──
  'gemma3n:moe':    10667,
  'glm-dsa:moe':    26667,
  'glm4:moe':       44444,
  'glm4moe:moe':    44444,
  'granitehybrid:moe': 53333,
  'llama4:moe':     71111,
  'minimax-m2:moe':  7111,
  'nemotron_h_moe:moe': 53333,
  'qwen3vlmoe:moe': 42667,
  'gemma3:dense':   35556,
  'llama:dense':   106667,
  'phi3:dense':     62222,
  'qwen3vl:dense': 124444,
  'mistral':       160000,
  'qwen2':         160000,
  'qwen3':         160000,
};

/** SWA fixed buffer cost in GB — one-time cost for sliding-window layers.
 *  Matches size-model.ts: sFixed × swaWindow added to nonexBytes.
 *  Suffixed keys like 'gemma4:moe' tried first; falls back to bare arch.
 *
 *  Sources:
 *    gemma4:dense — 50 SWA layers × 1024 window × 64kv × 128d × 2 × 0.5625
 *    gemma4:moe   — 25 SWA layers × 1024 window × 32kv × 128d × 2 × 0.5625 */
const SWA_FIXED_GB: Record<string, number> = {
  'gemma4:dense': 0.44,
  'gemma4:moe':   0.11,
  'gemma3:dense': 0.28,  // 30 dense SWA layers × 1024 window × kv_per_token × 2 × 0.5625 (estimate)
  'gemma3n:moe':  0.08,  // 15 MoE SWA layers, smaller KV heads (estimate)
};

/** Where a context number comes from — so the UI never passes off a guess as a
 *  guarantee. 'tested' = empirically probed (a real llama-server load succeeded);
 *  'calc' = KV-budget calc on this hardware, untested; 'arch-max' = clamped to
 *  the model's trained ctx (architectural ceiling), untested. The catalog path
 *  here can only ever produce 'calc' or 'arch-max'. */
export type CtxProvenance = 'tested' | 'calc' | 'arch-max';

export type ExpertStrategy = 'cpu-moe' | 'partial-ngl' | 'full-gpu' | 'none';

export type CatalogFitEstimate = {
  fit: FitClass;
  maxCtx: number;
  expertStrategy: ExpertStrategy;
  ctxLabel: string;
  provenance: CtxProvenance;
  /** True when the model nominally fits but the CPU-resident portion (offloaded
   *  experts / dense overflow) would exceed available RAM minus a safe reserve —
   *  i.e. it would only "run" via swap/mmap thrash. */
  ramTight: boolean;
  /** Fit strategy (full-gpu / hybrid / moe-cpu). */
  strategy: FitStrategy;
  /** Per-mode context estimates. Always present for balanced; speed and capacity
   *  are present when they differ from balanced. */
  modes: {
    speed?: { ctx: number; strategy: FitStrategy; ctxLabel: string; kvCacheQuant: string };
    balanced: { ctx: number; strategy: FitStrategy; ctxLabel: string; kvCacheQuant: string };
    capacity?: { ctx: number; strategy: FitStrategy; ctxLabel: string; kvCacheQuant: string };
  };
};

/** How much of the machine belongs to *everything except the model*.
 *
 *  - `headless`: an Ubuntu server running only Relay (in Docker) — no desktop,
 *    no browser. Reserve the bare minimum so models get the most RAM/VRAM.
 *  - `desktop`: a Mac mini / workstation also running apps (an IDE, a browser,
 *    OpenClaw, the window manager). Leave generous headroom so the machine stays
 *    responsive and models don't get OOM-killed by a Chrome tab.
 *
 *  Override detection with RELAY_HOST_PROFILE=headless|desktop. */
export type HostProfile = 'headless' | 'desktop';

const RESERVES: Record<HostProfile, { vramOverheadGb: number; ramReserveGb: number }> = {
  headless: { vramOverheadGb: 0.5, ramReserveGb: 2 },
  desktop:  { vramOverheadGb: 1.5, ramReserveGb: 6 },
};

export function reservesFor(profile: HostProfile): { vramOverheadGb: number; ramReserveGb: number } {
  return RESERVES[profile];
}

/** Headless server vs desktop. Honors RELAY_HOST_PROFILE, else infers: macOS and
 *  any Linux with a display server (X/Wayland) → desktop; otherwise headless. */
export function detectHostProfile(env: NodeJS.ProcessEnv = process.env): HostProfile {
  const o = (env.RELAY_HOST_PROFILE ?? '').trim().toLowerCase();
  if (o === 'headless' || o === 'server') return 'headless';
  if (o === 'desktop' || o === 'workstation') return 'desktop';
  if (process.platform === 'darwin') return 'desktop';
  if (env.DISPLAY || env.WAYLAND_DISPLAY) return 'desktop';
  return 'headless';
}

/** Inference backend. The fit is hardware-dependent: each backend reserves a
 *  different amount of VRAM for compute/graph buffers + driver allocations. */
export type FitBackend = 'cuda' | 'vulkan' | 'rocm' | 'hip' | 'metal' | 'cpu';

/** Empirical VRAM overhead (GB) for llama.cpp compute/graph buffers + driver
 *  reservations, by backend. CUDA is leanest; Vulkan/RADV and ROCm/HIP reserve
 *  more and fragment; Metal is unified-memory so the graph cost is modest. */
const BACKEND_VRAM_OVERHEAD_GB: Record<FitBackend, number> = {
  cuda: 0.6, vulkan: 1.0, rocm: 1.1, hip: 1.1, metal: 0.4, cpu: 0.2,
};

/** The backend Relay uses for a GPU vendor by default (AMD→Vulkan; rocm/hip are
 *  opt-in). Callers that know the actually-selected backend should pass it in. */
export function backendForGpu(gpu: GpuProbe): FitBackend {
  const t = (gpu.gpu_type || '').toLowerCase();
  const d = (gpu.driver || '').toLowerCase();
  if (t === 'nvidia' || d === 'cuda') return 'cuda';
  if (t === 'apple' || d === 'metal') return 'metal';
  if (t === 'amd' || t === 'vulkan' || d === 'vulkan' || d === 'rocm') return 'vulkan'; // relay default for AMD
  return gpu.vram_total_gb > 0 ? 'vulkan' : 'cpu';
}

/** Conservative KV bytes/token when we have neither a GGUF-derived value nor a
 *  calibrated arch value. Errs HIGH (predicts less context → never over-promises);
 *  the exact number arrives via download/probe or `relay catalog enrich`. */
function genericKvPtok(model: CatalogEntry): number {
  return model.moe ? 53333 : 142222;
}

/** Non-expert byte fraction by arch (1 − expert fraction), used only when the
 *  model has no GGUF-derived `nonex_frac` yet. Mirrors size-model.ts EXPERT_FRACS. */
const EXPERT_NONEX_FALLBACK: Record<string, number> = {
  'qwen35moe': 0.06, 'qwen3moe': 0.06, 'qwen3next': 0.06, 'deepseek2': 0.07,
  'gemma4': 0.09, 'cohere2moe': 0.10, 'gpt-oss': 0.08, 'gemma3n': 0.10,
  // Estimates — no GGUF on hand, conservative (lower = more experts offloaded = safer)
  'mistral3': 0.08,       // Devstral 2, Mistral 3.1 MoE — typical 6-8% shared
  'glm-dsa': 0.07,        // GLM dynamic sparse attention
  'glm4': 0.08,           // GLM-4 MoE
  'glm4moe': 0.07,        // GLM-4 MoE variant
  'granitehybrid': 0.08,  // IBM Granite hybrid
  'llama4': 0.07,         // Llama 4 MoE — llama.cpp shows ~7% non-expert
  'minimax-m2': 0.05,     // MiniMax-M2 lightning attention — very small shared fraction
  'nemotron_h_moe': 0.07, // NVIDIA Nemotron-H
  'qwen3vlmoe': 0.06,     // Same family as qwen3moe
};

/** Fraction of an MoE model's bytes that stay on the GPU (shared/attn/embeddings).
 *  Prefers the model's GGUF-derived `nonex_frac`; else the arch fallback; else a
 *  floored active/total ratio (which under-counts for high expert counts). */
function moeNonexRatio(model: CatalogEntry, arch: string): number {
  if (typeof model.nonex_frac === 'number' && model.nonex_frac > 0) return model.nonex_frac;
  if (EXPERT_NONEX_FALLBACK[arch] != null) return EXPERT_NONEX_FALLBACK[arch]!;
  const nexp = model.expert_count, nact = model.active_experts;
  if (nexp != null && nact != null && nexp > 0) return Math.max(0.06, nact / nexp);
  return 0.10;
}

/** Compute context for a given KV quant ratio within a VRAM budget.
 *  Internal helper used by estimateContextFromCatalog for each mode. */
function ctxForBudget(usableVramGb: number, modelGb: number, kvPtokF32: number, kvQuant: 'q4_0' | 'q8_0', maxCtxCap: number): number {
  const kvBudgetGb = Math.max(0, usableVramGb - modelGb) * 0.95;
  const effKv = kvPtokF32 * (KV_QUANT_RATIO[kvQuant] ?? KV_QUANT_RATIO['q4_0']!);
  if (effKv <= 0) return maxCtxCap;
  return Math.min(Math.floor(kvBudgetGb * GB / effKv), maxCtxCap);
}

type ModeEstimate = { ctx: number; strategy: FitStrategy; ctxLabel: string; kvCacheQuant: string };

function stratLabel(s: FitStrategy): string {
  if (s === 'full-gpu') return 'full GPU';
  if (s === 'moe-cpu') return 'MoE→CPU';
  return 'hybrid';
}

/** Estimate max context for a catalog entry across three modes.
 *  For MoE models, assumes --cpu-moe (all experts on CPU, only shared
 *  weights + KV + compute on GPU). For dense models that don't fit GPU, uses
 *  partial -ngl with DRAM budget.
 *
 *  Model-dependent (kv_ptok + non-expert fraction, preferably GGUF-derived) and
 *  hardware-dependent (VRAM + per-backend overhead). The exact answer always
 *  comes from sizeModel() once the file is on disk. */
export function estimateContextFromCatalog(
  model: CatalogEntry,
  gpu: GpuProbe,
  dramAvailGb?: number,
  hostProfile?: HostProfile,
  backend?: FitBackend,
): CatalogFitEstimate {
  const sizeGb = model.size_gb;
  const tvram = gpu.vram_total_gb;
  if (!sizeGb || !tvram) return {
    fit: 'unknown', maxCtx: 0, expertStrategy: 'none', ctxLabel: '?',
    provenance: 'calc', ramTight: false, strategy: 'full-gpu',
    modes: { balanced: { ctx: 0, strategy: 'full-gpu', ctxLabel: '?', kvCacheQuant: 'q4_0' } },
  };

  const { vramOverheadGb, ramReserveGb } = reservesFor(hostProfile ?? detectHostProfile());
  const backendOverheadGb = BACKEND_VRAM_OVERHEAD_GB[backend ?? backendForGpu(gpu)];
  const overheadGb = 256 / 1024 + vramOverheadGb + backendOverheadGb;
  let usableVram = Math.max(0, tvram - overheadGb);
  const usableDram = dramAvailGb ?? detectAvailableRamGb();
  const arch = model.arch ?? 'unknown';
  const moe = model.moe === true;

  const swaKey = arch + (moe ? ':moe' : ':dense');
  const swaFixed = SWA_FIXED_GB[swaKey] ?? SWA_FIXED_GB[arch] ?? 0;
  usableVram = Math.max(0, usableVram - swaFixed);

  const kvPtokF32 = model.kv_ptok ?? KV_PTOK_EST[swaKey] ?? KV_PTOK_EST[arch] ?? genericKvPtok(model);

  // ── Compute per-mode context ──
  const tryMode = (gpuModelGb: number, kvQuant: 'q4_0' | 'q8_0', strategy: FitStrategy): ModeEstimate | null => {
    const ctx = ctxForBudget(usableVram, gpuModelGb, kvPtokF32, kvQuant, model.ctx);
    if (ctx < 4096) return null;
    return { ctx, strategy, ctxLabel: fmtCtx(ctx), kvCacheQuant: kvQuant };
  };

  // Balance check
  let balancedMode: ModeEstimate | null = null;
  let speedMode: ModeEstimate | null = null;
  let capacityMode: ModeEstimate | null = null;
  let bestFit: FitClass = 'too-large';
  let bestExpertStrategy: ExpertStrategy = 'none';
  let bestStrategy: FitStrategy = 'full-gpu';
  let cpuResidentGb = 0;

  if (moe) {
    const nonexRatio = moeNonexRatio(model, arch);
    const nonexGb = sizeGb * nonexRatio;
    const expertGb = sizeGb - nonexGb;

    // Speed: full GPU only
    if (sizeGb <= usableVram) {
      const q8 = tryMode(sizeGb, 'q8_0', 'full-gpu');
      speedMode = q8 ?? tryMode(sizeGb, 'q4_0', 'full-gpu');
    }

    // Balanced: best of full-GPU (Q8 preferred) and cpu-moe (Q4)
    // Balanced: best of full-GPU (Q8 preferred) and cpu-moe (Q4)
    const fgQ8 = tryMode(sizeGb, 'q8_0', 'full-gpu');
    const fgQ4 = tryMode(sizeGb, 'q4_0', 'full-gpu');
    // Expert offload MUST fit in DRAM only (not DRAM+VRAM).  VRAM is the GPU
    // budget for non-expert weights + KV + compute buffers — it is NOT a
    // secondary RAM for CPU-resident experts.
    const moeQ8 = nonexGb <= usableVram && expertGb <= usableDram ? tryMode(nonexGb, 'q8_0', 'moe-cpu') : null;
    const moeQ4 = nonexGb <= usableVram && expertGb <= usableDram ? tryMode(nonexGb, 'q4_0', 'moe-cpu') : null;

    // Balanced: pick the config with the most context (minimizing offload tiebreaks on ctx).
    const balCands = [fgQ8, fgQ4, moeQ8, moeQ4].filter((c): c is ModeEstimate => c !== null);
    if (balCands.length > 0) {
      balancedMode = balCands.reduce((a, b) => b.ctx > a.ctx ? b : a);
    }

    // Capacity: best Q4 ctx (prefer moe-cpu for max ctx)
    const capCands = [moeQ4, fgQ4].filter((c): c is ModeEstimate => c !== null);
    capacityMode = capCands.length > 0 ? capCands.reduce((a, b) => b.ctx > a.ctx ? b : a) : null;

    if (balancedMode) {
      bestFit = balancedMode.strategy === 'full-gpu' ? 'full-gpu' : 'partial-offload';
      bestExpertStrategy = balancedMode.strategy === 'moe-cpu' ? 'cpu-moe' : 'full-gpu';
      bestStrategy = balancedMode.strategy;
      if (balancedMode.strategy === 'moe-cpu') cpuResidentGb = expertGb;
    }
  } else {
    // Dense model
    if (sizeGb <= usableVram) {
      // Full GPU
      const q8 = tryMode(sizeGb, 'q8_0', 'full-gpu');
      const q4 = tryMode(sizeGb, 'q4_0', 'full-gpu');
      speedMode = q8 ?? q4;
      balancedMode = q8 ?? q4;
      capacityMode = q4;
      if (balancedMode) { bestFit = 'full-gpu'; bestExpertStrategy = 'full-gpu'; bestStrategy = 'full-gpu'; }
    } else if (sizeGb <= usableVram + usableDram) {
      // Partial offload
      const gpuModelGb = Math.max(0, usableVram - (16384 * kvPtokF32 * KV_QUANT_RATIO['q4_0']!) / GB * 1.05);
      if (gpuModelGb > 0) {
        const hy = tryMode(gpuModelGb, 'q4_0', 'hybrid');
        balancedMode = hy;
        capacityMode = hy;
        if (hy) { bestFit = 'partial-offload'; bestExpertStrategy = 'partial-ngl'; bestStrategy = 'hybrid'; cpuResidentGb = sizeGb - gpuModelGb; }
      } else {
        const tryC = tryMode(sizeGb * 0.5, 'q4_0', 'hybrid');
        balancedMode = tryC;
        capacityMode = tryC;
        if (tryC) { bestFit = 'partial-offload'; bestExpertStrategy = 'partial-ngl'; bestStrategy = 'hybrid'; cpuResidentGb = sizeGb * 0.5; }
      }
    }
  }

  const ramTight = bestFit !== 'too-large'
    && cpuResidentGb > Math.max(0, usableDram - ramReserveGb);

  const provenance: CtxProvenance = (balancedMode && balancedMode.ctx >= model.ctx) ? 'arch-max' : 'calc';

  return {
    fit: bestFit,
    maxCtx: balancedMode?.ctx ?? 0,
    expertStrategy: bestExpertStrategy,
    ctxLabel: balancedMode?.ctxLabel ?? (bestFit === 'too-large' ? 'no fit' : '?'),
    provenance,
    ramTight,
    strategy: bestStrategy,
    modes: {
      ...(speedMode && balancedMode && (speedMode.ctx !== balancedMode.ctx || speedMode.kvCacheQuant !== balancedMode.kvCacheQuant) ? { speed: speedMode } : {}),
      balanced: balancedMode ?? { ctx: 0, strategy: 'full-gpu' as FitStrategy, ctxLabel: 'no fit', kvCacheQuant: 'q4_0' },
      ...(capacityMode && balancedMode && (capacityMode.ctx !== balancedMode.ctx || capacityMode.kvCacheQuant !== balancedMode.kvCacheQuant) ? { capacity: capacityMode } : {}),
    },
  };
}

/** Fit label for the model picker — strategy + speed + confidence.
 *
 *   ✓ 128k · full GPU · fast · verified
 *   ◌ 96k · MoE→CPU · slower · estimated
 *   ↑ 256k · hybrid · moderate · max ctx
 *   ⚠ 32k · hybrid · tight · estimated
 *   ✗ no
 *
 *  Speed: fast (full-gpu), moderate (hybrid), slower (moe-cpu), tight (ramTight).
 *  Confidence: verified (probe-cached), estimated (calc), max ctx (arch-max). */
export function buildFitLabel(est: CatalogFitEstimate, mode?: 'speed' | 'balanced' | 'capacity'): string {
  if (est.fit === 'too-large' || est.maxCtx <= 0) return '✗ no';

  // Pick the right mode ctx/strategy
  const m = mode && est.modes[mode];
  const ctxLabel = m?.ctxLabel ?? est.ctxLabel;
  const strategy: FitStrategy = m?.strategy ?? est.strategy;
  const kvQuant = m?.kvCacheQuant;

  // Prefix: ✓ (full-gpu / tested), ◌ (hybrid/moe-cpu), ↑ (capacity), ⚠ (tight)
  let prefix: string;
  if (est.provenance === 'tested') prefix = '✓';
  else if (mode === 'capacity') prefix = '↑';
  else if (est.ramTight) prefix = '⚠';
  else if (strategy === 'full-gpu') prefix = '✓';
  else prefix = '◌';

  // Speed qualifier
  let speedLabel: string;
  if (est.ramTight) speedLabel = 'tight';
  else if (strategy === 'full-gpu') speedLabel = 'fast';
  else if (strategy === 'hybrid') speedLabel = 'moderate';
  else speedLabel = 'slower';

  // Confidence
  let confLabel: string;
  if (est.provenance === 'tested') confLabel = 'verified';
  else if (est.provenance === 'arch-max') confLabel = 'max ctx';
  else confLabel = 'estimated';

  return `${prefix} ${ctxLabel} · ${stratLabel(strategy)} · ${speedLabel} · ${confLabel}`;
}

export type QuantTier = 'recommended' | 'ok' | 'not-recommended';

/** Beginner guidance for a quant level. IQ3/IQ4 (importance-matrix) are the
 *  quality-for-size sweet spot → recommended. 1-bit and 2-bit are usable but
 *  noticeably lossy → not recommended (shown, not hidden). Everything else is ok. */
export function quantTier(quant: string): QuantTier {
  const q = (quant || '').toUpperCase();
  if (/^IQ[34]/.test(q)) return 'recommended';            // IQ3*, IQ4*
  if (/^(IQ[12]|Q[12]|TQ[12])/.test(q)) return 'not-recommended'; // 1-bit / 2-bit
  return 'ok';
}

// ── System detection ────────────────────────────────────────────────────

/** Total installed RAM (MemTotal). Used for display and fallback. */
export function detectSystemRamGb(): number {
  try {
    if (process.platform === 'linux') {
      const meminfo = readFileSync('/proc/meminfo', 'utf8');
      const match = /^MemTotal:\s+(\d+)\s+kB/m.exec(meminfo);
      if (match) return Math.round(Number(match[1]) / 1024 / 1024);
    }
    if (process.platform === 'darwin') {
      const bytes = Number(execFileSync('sysctl', ['-n', 'hw.memsize'], { encoding: 'utf8' }).trim());
      if (Number.isFinite(bytes)) return Math.round(bytes / 1024 / 1024 / 1024);
    }
  } catch { /* best-effort */ }
  return 0;
}

/** RAM actually available for expert offload / KV cache.
  * mirrors scripts/size-model.py: cgroup limits → MemAvailable → fallback. */
export function detectAvailableRamGb(): number {
  // mirrors scripts/size-model.py's detect_dram_available():
  // prefer cgroup limits, then MemAvailable, fall back to MemTotal - 2GB
  try {
    // cgroup v2
    const max = readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
    if (max && max !== 'max') {
      const limit = Number(max);
      if (limit > 0) {
        let usage = 0;
        try { usage = Number(readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim()); } catch {}
        const avail = limit - usage;
        if (avail > 0) return Math.round(avail / 1024 / 1024 / 1024);
      }
    }
    // MemAvailable
    const meminfo = readFileSync('/proc/meminfo', 'utf8');
    const ma = /^MemAvailable:\s+(\d+)\s+kB/m.exec(meminfo);
    if (ma) return Math.round(Number(ma[1]) / 1024 / 1024);
  } catch {}
  // fallback: total - 2GB (conservative)
  return Math.max(0, SYSTEM_RAM_GB - 2);
}

export function detectLlamaServerPath(): string {
  const candidates = [
    process.env.RELAY_LLAMA_SERVER_PATH,
    '/usr/local/bin/llama-server',
    resolveHome('~/llama.cpp/build/bin/llama-server'),
    resolveHome('~/llama.cpp/build-vulkan/bin/llama-server'),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return 'llama-server';
}

export function detectCloudflare(): CloudflareInfo {
  const info: CloudflareInfo = { installed: false, certPresent: false, tunnels: [], serviceActive: false };
  info.installed = Boolean(commandPath('cloudflared'));
  info.certPresent = existsSync(resolve(process.env.HOME ?? '', '.cloudflared', 'cert.pem'));
  if (info.installed) {
    try {
      const v = execFileSync('cloudflared', ['--version'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] });
      info.version = v.trim().split(/\s+/)[2];
    } catch { /* ignore */ }
    try {
      const raw = execFileSync('cloudflared', ['tunnel', 'list', '--output', 'json'], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
      const parsed = JSON.parse(raw) as Array<{ id: string; name: string }>;
      if (Array.isArray(parsed)) info.tunnels = parsed.map((t) => ({ id: t.id, name: t.name }));
    } catch { /* not logged in or none */ }
  }
  try {
    const state = execFileSync('systemctl', ['is-active', 'cloudflared'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    info.serviceActive = state === 'active';
  } catch { /* inactive / not present */ }
  return info;
}

export function detectDeployment(): Deployment {
  const out: Deployment = { serviceActive: false, dockerPresent: Boolean(commandPath('docker')) };
  try {
    const state = execFileSync('systemctl', ['is-active', 'relay'], { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    out.serviceActive = state === 'active';
  } catch { /* inactive / not present */ }
  return out;
}

// ── Helpers ─────────────────────────────────────────────────────────────

export function resolveHome(inputPath: string): string {
  if (inputPath === '~') return process.env.HOME ?? inputPath;
  if (inputPath.startsWith('~/')) return resolve(process.env.HOME ?? '', inputPath.slice(2));
  return inputPath;
}

export function commandPath(command: string): string | undefined {
  try {
    return execFileSync('which', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

export function ensureApiKey(env: EnvMap): void {
  if (!env.get('API_KEY') || env.get('API_KEY') === 'change-me-in-production') {
    env.set('API_KEY', randomBytes(24).toString('hex'));
  }
}

export function shEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

// ── Start script generation ─────────────────────────────────────────────

/** Writes a start-<modelId>.sh script to the start-scripts directory.
 *
 *  When launchFlags from the sizing engine are available, they are the single
 *  source of truth for llama.cpp flags.  Otherwise a sensible fallback template
 *  is used (--flash-attn, q4_0 KV, -ngl 99).
 *
 *  NOTE on sibling generator in provision.ts: `renderStartScript` generates
 *  scripts for `relay provision --apply` with similar launchFlags support but
 *  also handles GpuConfig (multi-GPU placement), mmproj, and model-draft.
 *  The two generators are kept in sync manually — changes here should be
 *  reflected in renderStartScript and vice-versa.
 */
export function generateStartScript(input: {
  modelId: string;
  modelLabel: string;
  modelPath: string;
  llamaServerPath: string;
  ctxSize: number;
  multimodal: boolean;
  fit: FitClass;
  launchFlags?: string[];
  /** MoE expert-offload flag from the sizing engine (e.g. "--cpu-moe" or
   *  "--n-cpu-moe 17"). The TS sizer returns this *separately* from launchFlags,
   *  so without baking it in here the experts would never be offloaded at runtime
   *  (the lifecycle execs this script verbatim with only LLAMA_PORT injected). */
  expertFlag?: string;
}): string {
  mkdirSync(START_SCRIPTS_DIR, { recursive: true });
  const scriptPath = resolve(START_SCRIPTS_DIR, `start-${input.modelId}.sh`);
  const maybeVisionComment = input.multimodal ? '# Vision model: add --mmproj /path/to/mmproj.gguf before first real use.\n' : '';

  let flagsBlock: string;
  if (input.launchFlags && input.launchFlags.length > 0) {
    // Real flags from size-model.py — the single source of truth
    const lines: string[] = [
      '--model "$MODEL" \\',
      '--host 127.0.0.1 \\',
      '--port "$LLAMA_PORT" \\',
    ];
    // Re-pair flags: size-model.py emits flat [--flag, value, ...]
    let i = 0;
    while (i < input.launchFlags.length) {
      const flag = input.launchFlags[i]!;
      // Pair "flag value" for both long (--ctx-size 4096) and short (-ngl 999)
      // flags. Values here are never negative, so a leading '-' always = a flag.
      if (flag.startsWith('-') && i + 1 < input.launchFlags.length && !input.launchFlags[i + 1]!.startsWith('-')) {
        lines.push(`  ${flag} ${input.launchFlags[i + 1]} \\`);
        i += 2;
      } else {
        lines.push(`  ${flag} \\`);
        i += 1;
      }
    }
    // Bake in the MoE expert-offload flag (sizer returns it separately).
    if (input.expertFlag && !input.launchFlags.some((f) => f === '--cpu-moe' || f === '--n-cpu-moe')) {
      lines.push(`  ${input.expertFlag} \\`);
    }
    flagsBlock = lines.join('\n');
  } else {
    // Fallback template — model not yet downloaded. Uses sensible defaults.
    const maybeMoEComment = input.fit === 'partial-offload'
      ? '# Relay: after downloading, run \'relay provision --apply\' or re-run setup to tune flags\n'
      : '';
    flagsBlock = `${maybeMoEComment}  --model "$MODEL" \\
  --host 127.0.0.1 \\
  --port "$LLAMA_PORT" \\
  --ctx-size ${input.ctxSize} \\
  -ngl 99 \\
  --parallel 1 \\
  --flash-attn on \\
  --cache-type-k q4_0 \\
  --cache-type-v q4_0 \\
  --jinja`;
  }

  const script = `#!/usr/bin/env bash
set -euo pipefail

# Relay generated start script for ${input.modelLabel}
LLAMA_PORT="\${LLAMA_PORT:-8080}"
MODEL=${shEscape(input.modelPath)}
LLAMA_SERVER=${shEscape(input.llamaServerPath)}
${maybeVisionComment}
if [[ ! -f "$MODEL" ]]; then
  echo "Relay model file not found: $MODEL" >&2
  exit 1
fi

exec "$LLAMA_SERVER" \\
${flagsBlock}
`;
  writeFileSync(scriptPath, script);
  chmodSync(scriptPath, 0o755);
  return scriptPath;
}

// ── Model download ──────────────────────────────────────────────────────

export function downloadModel(model: CatalogEntry, modelDir: string): string {
  if (!model.download_url) throw new Error(`No download_url configured for ${model.id}`);
  mkdirSync(modelDir, { recursive: true });
  const filename = model.filename ?? model.download_url.split('/').pop() ?? `${model.id}.gguf`;
  const destination = resolve(modelDir, filename);
  if (existsSync(destination)) return destination;
  const downloader = commandPath('curl') ? 'curl' : commandPath('wget') ? 'wget' : undefined;
  if (!downloader) throw new Error('curl or wget is required to download models');
  if (downloader === 'curl') {
    execFileSync('curl', ['-fL', '--continue-at', '-', '-o', destination, model.download_url], { stdio: 'inherit' });
  } else {
    execFileSync('wget', ['-c', '-O', destination, model.download_url], { stdio: 'inherit' });
  }
  return destination;
}

// ── Hardware-aware sizing (pure TS, no Python dependency) ──────────────

export type SizeModelResult = {
  maxCtx: number;
  launchFlags: string[];
  expertFlag: string;
  cpuMoeLayers: number;
  headroomPct: number;
  kvGb: number;
  cacheType: string;
  modes: SizeResult['modes'];
};

/** Call the TS sizing engine against a downloaded GGUF. Returns null on failure.
 *
 *  The kvCacheQuant param is only used as a fallback for backward-compat launch
 *  flags returned in the SizeModelResult.  The modes themselves always carry
 *  their own kvCacheQuant — callers MUST use the selected mode's kvCacheQuant
 *  when generating final launch flags (configureQuickstart does this).
 */
export function sizeModelTS(ggufPath: string, vramGb: number, dramGb: number, kvCacheQuant: 'q4_0' | 'q8_0' = 'q4_0'): SizeModelResult | null {
  try {
    const { result } = sizeModel(ggufPath, Math.trunc(vramGb * GB), Math.trunc(dramGb * GB));
    if (!result.ok) return null;
    // Build backward-compat launch flags from balanced mode using the caller's
    // requested cacheType (used only by legacy callers that pre-choose a quant).
    const balMode = result.modes.balanced;
    const { launchFlags, expertFlag } = balMode
      ? buildLaunchFlags(balMode, { gpuLayers: balMode.gpuLayers })
      : { launchFlags: [] as string[], expertFlag: '' };
    return {
      maxCtx: result.bestCtx,
      launchFlags,
      expertFlag,
      cpuMoeLayers: result.cpuMoeLayers,
      headroomPct: Math.round(result.headroomPct * 100) / 100,
      kvGb: Math.round(result.kvGb * 10000) / 10000,
      cacheType: balMode?.kvCacheQuant ?? kvCacheQuant,
      modes: result.modes,
    };
  } catch {
    return null;
  }
}

// ── Config actions (pure env manipulation, no UI) ───────────────────────

export function configureQuickstart(
  env: EnvMap,
  selections: CatalogEntry[],
  modelPaths: Map<string, string>,
  llamaServerPath: string,
  modelDir: string,
  gpu?: GpuProbe,
): void {
  const sizingMode = ((env.get('RELAY_SIZING_MODE') ?? 'balanced') === 'capacity' ? 'capacity' : (env.get('RELAY_SIZING_MODE') ?? 'balanced') === 'speed' ? 'speed' : 'balanced') as 'speed' | 'balanced' | 'capacity';
  const modelEntries: Record<string, { cmd: string; ctx_size: number; multimodal: boolean; thinking_levels?: string[]; expert_flag?: string; kv_cache_type?: string; sizing_mode?: string; provenance?: string; strategy?: string }> = {};
  const defaultModel = selections[0]!;

  // Track the default model's configured ctx so UPSTREAM_CTX_SIZE matches.
  let defaultCtxSize: number | undefined;

  for (const model of selections) {
    const modelPath = modelPaths.get(model.id)!;
    let ctxSize = recommendedContext(model, gpu);
    let launchFlags: string[] | undefined;
    let expertFlag: string | undefined;
    // The actual kvCacheQuant from the selected sizing mode (not the env default).
    let modeCacheType: string | undefined;

    // If the GGUF is on disk, use the real TS sizing engine for optimal flags
    let tuned: SizeModelResult | null = null;
    if (existsSync(modelPath)) {
      const vramGb = gpu?.vram_total_gb ?? 0;
      const dramGb = Math.max(0, detectAvailableRamGb() - reservesFor(detectHostProfile()).ramReserveGb);
      tuned = sizeModelTS(modelPath, vramGb, dramGb);
      if (tuned) {
        // Use selected mode's ctx, falling back to balanced.
        const selMode = tuned.modes[sizingMode] ?? tuned.modes.balanced;
        ctxSize = selMode?.ctx ?? tuned.maxCtx;
        modeCacheType = selMode?.kvCacheQuant;

        // Build launch flags ONCE from the selected mode — using its OWN
        // kvCacheQuant.  No env-default override is passed.
        launchFlags = selMode
          ? buildLaunchFlags(selMode, { gpuLayers: selMode.gpuLayers }).launchFlags
          : tuned.launchFlags;
        expertFlag = selMode
          ? buildLaunchFlags(selMode, { gpuLayers: selMode.gpuLayers }).expertFlag
          : tuned.expertFlag;
      }
    }

    const scriptPath = generateStartScript({
      modelId: model.id,
      modelLabel: model.label,
      modelPath,
      llamaServerPath,
      ctxSize,
      multimodal: model.vision,
      fit: gpu ? classifyFit(model, gpu) : 'unknown',
      launchFlags,
      expertFlag,
    });

    // Track the default model's final ctx for UPSTREAM_CTX_SIZE.
    if (model.id === defaultModel.id) defaultCtxSize = ctxSize;

    const entry: Record<string, unknown> = {
      cmd: scriptPath,
      ctx_size: ctxSize,
      multimodal: model.vision,
      ...(model.thinking === 'on' ? { thinking_levels: ['on'] } : {}),
      ...(model.thinking === 'toggle' ? { thinking_levels: ['on', 'off'] } : {}),
    };
    if (expertFlag) entry.expert_flag = expertFlag;
    // Use the actual launched mode's kvCacheQuant, not the env default.
    entry.kv_cache_type = modeCacheType ?? tuned?.cacheType;
    entry.sizing_mode = sizingMode;
    entry.provenance = 'estimated';
    if (tuned) {
      const bal = tuned.modes.balanced;
      if (bal) entry.strategy = bal.strategy;
    }
    modelEntries[model.id] = entry as typeof modelEntries[string];
  }

  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'true');
  env.set('RELAY_SWITCH_POLICY', 'eager');
  env.set('DEFAULT_MODEL', defaultModel.id);
  // UPSTREAM_CTX_SIZE should match the configured default model's actual ctx,
  // not a generic recommendedContext that ignores sizing mode.
  env.set('UPSTREAM_CTX_SIZE', String(defaultCtxSize ?? recommendedContext(defaultModel, gpu)));
  env.set('RELAY_REPO_DIR', PKG);
  env.set('RELAY_MODEL_DIR', modelDir);
  env.set('RELAY_LLAMA_SERVER_PATH', llamaServerPath);
  env.set('RELAY_MODEL_FILE_HINT', modelPaths.get(defaultModel.id) ?? resolve(modelDir, defaultModel.filename ?? `${defaultModel.id}.gguf`));
  env.set('RELAY_SWITCH_MAX_WARM_MODELS', '1');
  ensureApiKey(env);
  env.set('RELAY_MODEL_MAP', JSON.stringify(modelEntries));
}

export function configureBYO(env: EnvMap, baseUrl: string, model: string, ctx: string): void {
  env.set('RELAY_MODE', 'gateway');
  env.set('RELAY_MODEL_LIFECYCLE_ENABLED', 'false');
  env.set('RELAY_MODEL_MAP', '{}');
  env.set('UPSTREAM_BASE_URL', baseUrl.replace(/\/+$/, ''));
  env.set('DEFAULT_MODEL', model);
  env.set('UPSTREAM_CTX_SIZE', ctx);
  ensureApiKey(env);
}

/** Known cloud providers (OpenAI-compatible endpoints). */
export const CLOUD_PROVIDERS: Record<string, { label: string; baseUrl: string; authEnv: string; ctx: number; sample: string }> = {
  gemini:    { label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', authEnv: 'GEMINI_API_KEY', ctx: 1_048_576, sample: 'gemini-2.5-pro' },
  openai:    { label: 'OpenAI',        baseUrl: 'https://api.openai.com/v1',                                authEnv: 'OPENAI_API_KEY', ctx: 128_000,   sample: 'gpt-4o' },
  anthropic: { label: 'Anthropic',     baseUrl: 'https://api.anthropic.com/v1',                             authEnv: 'ANTHROPIC_API_KEY', ctx: 200_000, sample: 'claude-sonnet-4-6' },
  deepseek:  { label: 'DeepSeek',      baseUrl: 'https://api.deepseek.com/v1',                              authEnv: 'DEEPSEEK_API_KEY', ctx: 65_536,  sample: 'deepseek-chat' },
  groq:      { label: 'Groq',          baseUrl: 'https://api.groq.com/openai/v1',                           authEnv: 'GROQ_API_KEY', ctx: 131_072,    sample: 'llama-3.3-70b-versatile' },
};

export function configureCloud(env: EnvMap, provider: string, model: string, apiKey: string): void {
  const p = CLOUD_PROVIDERS[provider] ?? CLOUD_PROVIDERS.gemini!;
  env.set('RELAY_MODE', 'cloud');
  env.set(p.authEnv, apiKey.trim());
  ensureApiKey(env);
  env.set('RELAY_CLOUD_MODELS', JSON.stringify({
    [model]: { base_url: p.baseUrl, auth_env: p.authEnv, ctx_size: p.ctx },
  }));
  env.set('DEFAULT_MODEL', model);
}

export function configureNetwork(env: EnvMap, mode: 'local' | 'expose'): void {
  if (mode === 'expose') {
    ensureApiKey(env);
    env.set('HOST', '0.0.0.0');
    env.set('TRUST_PROXY', 'true');
    if (!env.get('RELAY_ALLOWED_HOSTS')) env.set('RELAY_ALLOWED_HOSTS', '');
  } else {
    env.set('HOST', '127.0.0.1');
  }
}

// ── Model label helpers ─────────────────────────────────────────────────

// ANSI color codes (match tui theme, degrade via setup-theme.ts caps)
const QL = { red: '\x1b[31m', orange: '\x1b[38;5;208m', yellow: '\x1b[33m', paleGreen: '\x1b[38;5;113m', darkGreen: '\x1b[38;5;29m', brightBlue: '\x1b[38;5;75m', white: '\x1b[37m', bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m' };

/** Beginner-friendly quantization tier with color-coded quality scale.
 *  IQ3 = sweet spot (3-bit smart squish). IQ = importance-matrix (better at same bit width).
 *  K-quants = mixed-precision size trims in one file. */

/** Strip redundant quant suffix from a model label for display.
 *  e.g. "Gemma 4 26B Q4_K_XL" → "Gemma 4 26B", "Qwen 3.6 Q4" → "Qwen 3.6". */
export function stripQuantForDisplay(label: string, quant: string): string {
  const q = quant.toUpperCase();
  const qSpaced = q.replace(/_/g, ' ');
  const suffixes = [` ${qSpaced}`, ` ${q}`];
  const abbr = q.match(/^(Q\d|IQ\d|TQ\d)/i)?.[0];
  if (abbr && abbr !== q && abbr !== qSpaced) suffixes.push(` ${abbr}`);
  for (const suffix of suffixes) {
    if (label.toUpperCase().endsWith(suffix.toUpperCase())) return label.slice(0, -suffix.length);
  }
  return label;
}

export function quantQuality(quant: string): string {
  const q = quant.toLowerCase();
  const isIQ = q.startsWith('iq');
  const star = (isIQ || q.includes('q3')) ? ` ${QL.brightBlue}★${QL.reset}` : '';
  const rec = (isIQ || q.includes('q3')) ? ` ${QL.brightBlue}recommended${QL.reset}` : '';

  if (q.includes('tq1')) return `${QL.orange}TQ1 (experimental)${QL.reset}`;
  if (q.includes('q1') && !q.includes('tq1')) return `${QL.red}Q1 (minimal)${QL.reset}`;

  // IQ quants — superior quality at same bit level, get special treatment
  if (q.includes('iq2')) return `${QL.yellow}IQ2 (2-bit, lossy) ★ better than Q2${QL.reset}`;
  if (q.includes('iq3')) return `${QL.paleGreen}IQ3 (3-bit, sweet spot) ★ recommended${QL.reset}`;
  if (q.includes('iq4')) return `${QL.darkGreen}IQ4 (4-bit, near-lossless) ★ premium${QL.reset}`;

  // Standard K-quants
  if (q.includes('q2')) return `${QL.orange}Q2 (2-bit, lossy)${QL.reset}`;
  if (q.includes('q3')) return `${QL.paleGreen}Q3 (3-bit, good)${QL.reset}`;
  if (q.includes('q4')) return `${QL.darkGreen}Q4 (4-bit, near-lossless)${QL.reset}`;
  if (q.includes('q5') || q.includes('q6')) return `${QL.white}Q5/Q6 (high precision)${QL.reset}`;
  if (q.includes('q7') || q.includes('q8') || q.includes('f16')) return `${QL.white}Q8/F16 (native precision)${QL.reset}`;
  return `${QL.dim}${q.toUpperCase()}${QL.reset}`;
}

export function modelCapabilities(model: CatalogEntry): string {
  const tags: string[] = [];
  if (model.vision) tags.push('vision');
  if (model.thinking !== 'off') tags.push('thinking');
  return tags.join(' · ');
}

export function fitIcon(fit: FitClass): { icon: string; color: string } {
  if (fit === 'full-gpu') return { icon: '✓', color: '\x1b[32m' };
  if (fit === 'partial-offload') return { icon: '⚠', color: '\x1b[33m' };
  if (fit === 'too-large') return { icon: '✗', color: '\x1b[31m' };
  return { icon: '○', color: '\x1b[2m' };
}
