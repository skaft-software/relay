/**
 * Model sizing — a faithful TypeScript port of scripts/size-model.py.
 *
 * Given a GGUF and a hardware budget (VRAM + spare DRAM), it works out the best
 * expert-offload configuration and the maximum context that fits with a safety
 * headroom. This is the heart of relay: "fits" is not "weights ≤ VRAM" — MoE
 * models keep only attention + active params on the GPU and stream experts from
 * RAM (`--n-cpu-moe N` / `--cpu-moe`), so a 14 GB model can run on an 8 GB card.
 *
 * Three-mode sizing: compute() now returns speed / balanced / capacity strategies
 * from a single sweep. The caller picks the winner per objective:
 *   speed    → max ctx with zero offload, Q8 KV preferred
 *   balanced → max ctx minimizing offload (backward-compat default)
 *   capacity → absolute max ctx, Q4 KV forced
 *
 * The Python script in scripts/ is retained as the differential-test oracle:
 * tests/sizing.test.ts asserts this port reproduces its numbers on real GGUFs.
 */
import { readGguf, type GgufModel, type MetaValue, type TensorInfo } from './gguf.ts';

export const GB = 1073741824;
const MB = 1048576;
const SAFETY_MARGIN_MB = 256;
const COMPUTE_BUFS_MB = 1024;
const EMPIRICAL_OVERHEAD_PCT = 5;
export const DEFAULT_HEADROOM_PCT = 5;

/** KV quant byte ratio (fraction of F32 element size). */
export const KV_QUANT_RATIO: Record<string, number> = {
  q4_0: 0.5625,
  q8_0: 1.0,
};

/** Expert byte fraction by architecture, used only when tensor names don't tag experts. */
const EXPERT_FRACS: Record<string, number> = {
  qwen35moe: 0.94, qwen3moe: 0.94, qwen3next: 0.94,
  deepseek2: 0.85, gemma4: 0.91, cohere2moe: 0.90,
};

/** Tensor-name patterns that identify per-expert (offloadable) weights. */
const EXPERT_PATTERNS = [
  '_exps.', 'ffn_gate_inp.', 'ffn_gate_exps.',
  'ffn_down_exps.', 'ffn_up_exps.',
];

/** Tensor-name patterns that identify the shared expert — a per-token dense layer
 *  that must stay on GPU for DeepSeek architectures (MLA: latent attention). */
const SHARED_EXPERT_PATTERNS = [
  '_shexp.', 'ffn_gate_inp_shexp.', 'ffn_gate_shexp.',
  'ffn_down_shexp.', 'ffn_up_shexp.',
];

/** Architectures whose shared expert is per-token dense and must stay on GPU. */
const SHARED_EXPERT_ARCHS = new Set(['deepseek2']);

export type FitStrategy = 'full-gpu' | 'hybrid' | 'moe-cpu';

export interface Meta {
  arch: string;
  nl: number;
  /** attention.head_count_kv — scalar, or per-layer array (Gemma SWA). */
  nkv: number | number[] | undefined;
  kl: number | undefined;
  emb: number;
  nexp: number;
  nact: number;
  trainCtx: number;
  swaWindow: number | undefined;
  swaPattern: number[] | undefined;
  fsize: number;
  tensors: TensorInfo[];
}

export interface Analysis {
  nonex: number;
  exp: number;
  /** F32 architecture-dimension bytes-per-token (before quantization). */
  kvPtok: number;
  nKv: number;
  nCache: number;
  fsize: number;
}

export interface SizedMode {
  strategy: FitStrategy;
  ctx: number;
  cpuMoeLayers: number;
  allExpertsCpu: boolean;
  kvCacheQuant: 'q4_0' | 'q8_0';
  /** -ngl layer count for dense models that fully fit GPU; undefined for
   *  partial-offload / moe-cpu where a real gpuLayers cannot be computed
   *  from sizing alone (the engine only budgets the non-expert portion). */
  gpuLayers?: number;
  headroomPct: number;
  headroomGb: number;
  kvGb: number;
  expGpuGb: number;
  expCpuGb: number;
  nonexGb: number;
}

export interface SizeResult {
  ok: boolean;
  error?: string;
  /** @deprecated Use modes.balanced.ctx instead. Kept for backward compat. */
  bestCtx: number;
  /** @deprecated Use modes.balanced.cpuMoeLayers instead. */
  cpuMoeLayers: number;
  /** @deprecated Use modes.balanced.allExpertsCpu instead. */
  allExpertsCpu: boolean;
  headroomPct: number;
  headroomGb: number;
  kvGb: number;
  expGpuGb: number;
  expCpuGb: number;
  nonexGb: number;
  /** Three-mode sizing: speed / balanced / capacity. null = no viable config. */
  modes: Record<'speed' | 'balanced' | 'capacity', SizedMode | null>;
}

function asNum(v: MetaValue | undefined): number {
  return typeof v === 'number' ? v : typeof v === 'bigint' ? Number(v) : 0;
}

export function readMeta(m: GgufModel): Meta {
  const arch = String(m.get('general.architecture') ?? '?');
  let emb = asNum(m.get('embedding_length'));
  if (emb === 0) emb = asNum(m.get(`${arch}.embedding_length`));

  const nkvRaw = m.get('attention.head_count_kv');
  const klRaw = m.get('attention.key_length');
  const swaWin = m.get('attention.sliding_window');
  const swaPat = m.get('attention.sliding_window_pattern');

  return {
    arch,
    nl: asNum(m.get('block_count')),
    nkv: Array.isArray(nkvRaw) ? (nkvRaw as number[]) : nkvRaw === undefined ? undefined : asNum(nkvRaw),
    kl: klRaw === undefined ? undefined : asNum(klRaw),
    emb,
    nexp: asNum(m.get('expert_count')),
    nact: asNum(m.get('expert_used_count')),
    trainCtx: asNum(m.get('context_length')),
    swaWindow: swaWin === undefined ? undefined : asNum(swaWin),
    swaPattern: Array.isArray(swaPat) ? (swaPat as number[]) : undefined,
    fsize: m.fileSize,
    tensors: m.tensors,
  };
}

export function analyze(meta: Meta): Analysis {
  const { arch, nl, nkv, kl, fsize } = meta;
  const moe = meta.nexp > 0;
  const kvPerLayer = new Array<number>(nl).fill(0);
  let expEls = 0;
  let nonexEls = 0;

  for (const t of meta.tensors) {
    const tn = t.name;
    let els = 1;
    for (const dim of t.dims) els *= dim;
    const sd = t.dims;
    const last = sd[sd.length - 1] ?? 0;

    // ── KV per layer (F32 architecture-dimension bytes, no quantization) ──
    if (tn.startsWith('blk.') && tn.endsWith('.weight')) {
      const ln = parseInt(tn.split('.')[1] ?? '', 10);
      if (Number.isInteger(ln) && ln >= 0 && ln < nl) {
        if (arch === 'deepseek2') {
          if (tn.includes('attn_kv_a_mqa')) kvPerLayer[ln]! += last;
        } else if (arch === 'qwen3next' || arch === 'gemma4') {
          if (tn.includes('attn_k.')) kvPerLayer[ln]! += 2 * last;
        } else {
          if (tn.includes('attn_k.') && !tn.includes('norm')) {
            kvPerLayer[ln]! += 2 * last;
          } else if (tn.includes('attn_qkv.')) {
            const kd = typeof nkv === 'number' && nkv > 0 && kl ? nkv * kl : 512;
            kvPerLayer[ln]! += 2 * kd;
          }
        }
      }
    }

    // ── Expert vs non-expert (shared expert stays GPU for DeepSeek) ──
    if (SHARED_EXPERT_ARCHS.has(arch) && SHARED_EXPERT_PATTERNS.some((p) => tn.includes(p))) {
      // DeepSeek shared expert: per-token dense, must stay on GPU → nonexEls
      nonexEls += els;
    } else if (EXPERT_PATTERNS.some((p) => tn.includes(p))) {
      expEls += els;
    } else {
      nonexEls += els;
    }
  }

  const total = expEls + nonexEls;
  let nonexBytes: number;
  let expBytes: number;
  if (moe && expEls === 0) {
    const frac = EXPERT_FRACS[arch] ?? 0.9;
    expBytes = Math.trunc(fsize * frac);
    nonexBytes = fsize - expBytes;
  } else if (total > 0) {
    nonexBytes = Math.trunc(fsize * (nonexEls / total));
    expBytes = fsize - nonexBytes;
  } else {
    nonexBytes = fsize;
    expBytes = 0;
  }

  let kvPtok = kvPerLayer.reduce((a, b) => a + b, 0);
  const nKv = kvPerLayer.filter((v) => v > 0).length;
  let nCache = nKv;

  // SWA split (Gemma4): sliding layers are fixed-cost; global layers grow with context.
  if (arch === 'gemma4' && Array.isArray(nkv)) {
    const win = meta.swaWindow ? meta.swaWindow : 1024;
    const swaPat = meta.swaPattern;
    let gPtok = 0;
    let sFixed = 0;
    const lim = Math.min(nl, nkv.length);
    for (let i = 0; i < lim; i++) {
      const nv = nkv[i]!;
      const isSwa = Array.isArray(swaPat) && i < swaPat.length ? Boolean(swaPat[i]) : nv > 2;
      if (isSwa) sFixed += kvPerLayer[i]!;
      else gPtok += kvPerLayer[i]!;
    }
    nonexBytes += Math.trunc(sFixed * win);
    kvPtok = gPtok;
    nCache = nkv.filter((v) => v <= 2).length;
  }

  return { nonex: nonexBytes, exp: expBytes, kvPtok, nKv, nCache, fsize };
}

function fail(error: string): SizeResult {
  return {
    ok: false, error,
    bestCtx: 0, cpuMoeLayers: 0, allExpertsCpu: false,
    headroomPct: 0, headroomGb: 0, kvGb: 0,
    expGpuGb: 0, expCpuGb: 0, nonexGb: 0,
    modes: { speed: null, balanced: null, capacity: null },
  };
}

/** Sweep all offload configs for a given KV quant, returning the best find
 *  for each offload class (full-gpu, hybrid, moe-cpu). Used internally by
 *  compute() to derive the three modes from a single evaluation pass. */
function sweepModes(
  budget: number,
  base: number,
  exp: number,
  epl: number,
  kvp: number,
  tctx: number,
  nl: number,
  dramFree: number,
  draft: number,
  minHeadroomPct: number,
): {
  speedCtx: number; speedNcmoe: number; speedCpumoe: boolean; speedEg: number; speedEc: number;
  bestCtx: number; bestNcmoe: number; bestCpumoe: boolean; bestEg: number; bestEc: number;
  maxCtx: number; maxNcmoe: number; maxCpumoe: boolean; maxEg: number; maxEc: number;
} {
  const tryCfg = (offloaded: number, forceCpu: boolean): [number, number, number] => {
    const eg = forceCpu ? 0 : Math.max(0, exp - offloaded * epl);
    const ec = exp - eg;
    const ka = budget - base - Math.trunc(eg);
    if (ka <= 4096 || kvp <= 0) return [0, eg, ec];
    return [Math.min(Math.trunc(ka / kvp), tctx), eg, ec];
  };

  // ── Full GPU (speed objective) ──
  const [sCtx, sEg, sEc] = tryCfg(0, false);
  let speedCtx = sCtx, speedNcmoe = 0, speedCpumoe = false, speedEg = sEg, speedEc = sEc;

  // ── Best overall (balanced objective) — sweep all ──
  let bestCtx = sCtx, bestNcmoe = 0, bestCpumoe = false, bestEg = sEg, bestEc = sEc;

  for (let o = 1; o <= nl; o++) {
    const [ctx, eg, ec] = tryCfg(o, false);
    if (ctx <= 0) continue;
    if (Math.trunc(ec) + draft + 2 * GB > dramFree) break;
    if (ctx > bestCtx) { bestCtx = ctx; bestNcmoe = o; bestEg = eg; bestEc = ec; }
  }

  // --cpu-moe
  const [mcCtx, mcEg, mcEc] = tryCfg(0, true);
  if (mcCtx > 0 && Math.trunc(mcEc) + draft + 2 * GB <= dramFree && mcCtx > bestCtx) {
    bestCtx = mcCtx; bestNcmoe = 0; bestCpumoe = true; bestEg = mcEg; bestEc = mcEc;
  }

  // ── Absolute max ctx (capacity objective) — force --cpu-moe for max ctx ──
  let maxCtx = mcCtx, maxNcmoe = 0, maxCpumoe = true, maxEg = mcEg, maxEc = mcEc;

  // Headroom enforcement (applies to balanced and capacity)
  const enforceHeadroom = (inCtx: number, inNcmoe: number, inCpumoe: boolean, inEg: number, inEc: number): [number, number, boolean, number, number] => {
    const minHrBytes = Math.trunc((budget * minHeadroomPct) / 100);
    const hrBytes = budget - base - Math.trunc(inEg) - draft - Math.trunc(kvp * inCtx);
    if (hrBytes >= minHrBytes) return [inCtx, inNcmoe, inCpumoe, inEg, inEc];

    // Try higher offload
    for (let o = inNcmoe + 1; o <= nl; o++) {
      const [ctxS, egS, ecS] = tryCfg(o, false);
      if (ctxS <= 0) continue;
      const hrS = budget - base - Math.trunc(egS) - draft - Math.trunc(kvp * ctxS);
      if (hrS >= minHrBytes && Math.trunc(ecS) + draft + 2 * GB <= dramFree) {
        return [ctxS, o, false, egS, ecS];
      }
    }
    // Try --cpu-moe
    {
      const [ctxS, egS, ecS] = tryCfg(0, true);
      if (ctxS > 0) {
        const hrS = budget - base - draft - Math.trunc(kvp * ctxS);
        if (hrS >= minHrBytes && Math.trunc(ecS) + draft + 2 * GB <= dramFree) {
          return [ctxS, 0, true, egS, ecS];
        }
      }
    }
    // Reduce ctx to meet headroom
    const kvAvail = Math.max(0, budget - base - Math.trunc(inEg) - draft - minHrBytes);
    const safeCtx = kvp > 0 ? Math.min(Math.trunc(kvAvail / kvp), tctx) : 0;
    if (safeCtx > 4096) return [safeCtx, inNcmoe, inCpumoe, inEg, inEc];
    return [inCtx, inNcmoe, inCpumoe, inEg, inEc];
  };

  [bestCtx, bestNcmoe, bestCpumoe, bestEg, bestEc] =
    enforceHeadroom(bestCtx, bestNcmoe, bestCpumoe, bestEg, bestEc);
  [maxCtx, maxNcmoe, maxCpumoe, maxEg, maxEc] =
    enforceHeadroom(maxCtx, maxNcmoe, maxCpumoe, maxEg, maxEc);

  return {
    speedCtx, speedNcmoe, speedCpumoe, speedEg, speedEc,
    bestCtx, bestNcmoe, bestCpumoe, bestEg, bestEc,
    maxCtx, maxNcmoe, maxCpumoe, maxEg, maxEc,
  };
}

function toMode(
  kvCacheQuant: 'q4_0' | 'q8_0',
  ctx: number, ncmoe: number, cpumoe: boolean, eg: number, ec: number,
  budget: number, base: number, kvp: number, draft: number, nonexGb: number, nl: number,
): SizedMode | null {
  if (ctx <= 4096) return null;
  let strategy: FitStrategy;
  if (cpumoe) strategy = 'moe-cpu';
  else if (ncmoe > 0) strategy = 'hybrid';
  else strategy = 'full-gpu';

  const headroomGb = budget / GB - base / GB - eg / GB - draft / GB - (kvp * ctx) / GB;
  const headroomPct = budget > 0 ? (headroomGb / (budget / GB)) * 100 : 0;

  // Dense full-gpu: every layer fits, so gpuLayers = nl.
  // Hybrid or moe-cpu: we cannot compute a reliable layer count from sizing
  // alone (the engine only knows nonex bytes, not per-layer weights), so omit
  // gpuLayers to prevent false "partial offload" claims with -ngl 999.
  const gpuLayers: number | undefined =
    strategy === 'full-gpu' ? nl : undefined;

  return {
    strategy,
    ctx,
    cpuMoeLayers: cpumoe ? 0 : ncmoe,
    allExpertsCpu: cpumoe,
    kvCacheQuant,
    gpuLayers,
    headroomPct,
    headroomGb,
    kvGb: (kvp * ctx) / GB,
    expGpuGb: eg / GB,
    expCpuGb: ec / GB,
    nonexGb,
  };
}

export function compute(
  vram: number,
  dramFree: number,
  meta: Meta,
  ta: Analysis,
  draft = 0,
  safetyFactor = 1.0,
  minHeadroomPct = DEFAULT_HEADROOM_PCT,
): SizeResult {
  const sm = Math.trunc(SAFETY_MARGIN_MB * safetyFactor);
  const cb = Math.trunc(COMPUTE_BUFS_MB * safetyFactor);
  const overheadPct = EMPIRICAL_OVERHEAD_PCT * safetyFactor;
  const budget = vram - (sm + cb) * MB;
  if (budget < 0) return fail('VRAM budget negative');

  const base = Math.trunc((ta.nonex + draft) * (1 + overheadPct / 100));
  if (base >= budget) return fail('Base footprint exceeds VRAM');

  const exp = ta.exp;
  const tctx = meta.trainCtx;
  const nl = meta.nl;
  const epl = nl > 0 ? exp / nl : exp;

  // ── Sweep Q8 (preferred for speed/balanced) ──
  const kvpQ8 = ta.kvPtok * KV_QUANT_RATIO['q8_0']!;
  const q8 = sweepModes(budget, base, exp, epl, kvpQ8 <= 0 && ta.nKv > 0 ? 0.001 : kvpQ8, tctx, nl, dramFree, draft, minHeadroomPct);

  // ── Sweep Q4 (fallback for speed, default for capacity) ──
  const kvpQ4 = ta.kvPtok * KV_QUANT_RATIO['q4_0']!;
  const q4 = sweepModes(budget, base, exp, epl, kvpQ4 <= 0 && ta.nKv > 0 ? 0.001 : kvpQ4, tctx, nl, dramFree, draft, minHeadroomPct);

  const nonexGb = ta.nonex / GB;

  // ── Derive three modes ──
  // speed: Q8 full-GPU if it fits; else Q4 full-GPU.
  let speedMode = toMode('q8_0', q8.speedCtx, 0, false, q8.speedEg, q8.speedEc, budget, base, kvpQ8, draft, nonexGb, nl);
  if (!speedMode) {
    speedMode = toMode('q4_0', q4.speedCtx, 0, false, q4.speedEg, q4.speedEc, budget, base, kvpQ4, draft, nonexGb, nl);
  }

  // balanced: default Q8_0 for better context accuracy. Fall back to Q4_0 if Q8_0 does not fit.
  let balancedMode = toMode('q8_0', q8.bestCtx, q8.bestNcmoe, q8.bestCpumoe, q8.bestEg, q8.bestEc, budget, base, kvpQ8, draft, nonexGb, nl);
  if (!balancedMode) {
    const alt = toMode('q4_0', q4.bestCtx, q4.bestNcmoe, q4.bestCpumoe, q4.bestEg, q4.bestEc, budget, base, kvpQ4, draft, nonexGb, nl);
    if (alt) balancedMode = alt;
  }

  // capacity: best Q4 overall (forced Q4).
  const capacityMode = toMode('q4_0', q4.maxCtx, q4.maxNcmoe, q4.maxCpumoe, q4.maxEg, q4.maxEc, budget, base, kvpQ4, draft, nonexGb, nl);

  const modes: SizeResult['modes'] = { speed: speedMode, balanced: balancedMode, capacity: capacityMode };

  if (!balancedMode || balancedMode.ctx <= 4096) {
    return fail('Cannot fit model — no room for KV cache');
  }

  // Fill backward-compat flat fields from balanced
  return {
    ok: true,
    bestCtx: balancedMode.ctx,
    cpuMoeLayers: balancedMode.cpuMoeLayers,
    allExpertsCpu: balancedMode.allExpertsCpu,
    headroomPct: balancedMode.headroomPct,
    headroomGb: balancedMode.headroomGb,
    kvGb: balancedMode.kvGb,
    expGpuGb: balancedMode.expGpuGb,
    expCpuGb: balancedMode.expCpuGb,
    nonexGb: balancedMode.nonexGb,
    modes,
  };
}

/** Read a GGUF and size it for the given hardware budget (bytes). */
export function sizeModel(path: string, vramBytes: number, dramBytes: number): { meta: Meta; analysis: Analysis; result: SizeResult } {
  const meta = readMeta(readGguf(path));
  const analysis = analyze(meta);
  const result = compute(vramBytes, dramBytes, meta, analysis);
  return { meta, analysis, result };
}

/** Build launch flags from a sized mode.
 *
 *  Source-of-truth invariant: the mode's kvCacheQuant is always used for
 *  --cache-type-k/v — no external override is accepted.  Callers must not
 *  pre-compute flags with a mismatched cache type.
 *
 *  Dense full-gpu modes carry a real gpuLayers (== nl) → emitted as -ngl.
 *  Hybrid / moe-cpu modes have gpuLayers === undefined — we emit the mode's
 *  ctx but never pretend at -ngl 999 for a model that doesn't fully fit GPU.
 *
 *  Returns flat [flag, value, flag, value, ...] for use by generateStartScript.
 */
export function buildLaunchFlags(
  mode: SizedMode,
  opts?: { parallel?: number; flashAttn?: string; gpuLayers?: number },
): { launchFlags: string[]; expertFlag: string } {
  const parallel = opts?.parallel ?? 1;
  const flashAttn = opts?.flashAttn ?? "on";

  // Use the mode's own kvCacheQuant — never override from caller.
  const cacheType = mode.kvCacheQuant;

  // gpuLayers: prefer caller override (for backward compat with provision.ts
  // which may have user-set gpuLayers), else the mode's own computed value,
  // else 999 for full-gpu (all layers fit), else undefined for partial.
  let ng = opts?.gpuLayers;
  if (ng === undefined) ng = mode.gpuLayers;
  if (ng === undefined && mode.strategy === 'full-gpu') ng = 999;
  // For non-full-gpu modes with no gpuLayers, omit -ngl to avoid false claims.
  // (The lifecycle / probe will handle partial offload at runtime.)

  const flags: string[] = [
    "--ctx-size", String(mode.ctx),
    ...(ng !== undefined ? ["-ngl", String(ng)] : []),
    "--parallel", String(parallel),
    "--flash-attn", flashAttn,
    "--cache-type-k", cacheType,
    "--cache-type-v", cacheType,
    "--jinja",
  ];

  let expertFlag = "";
  if (mode.allExpertsCpu) {
    expertFlag = "--cpu-moe";
  } else if (mode.cpuMoeLayers > 0) {
    expertFlag = `--n-cpu-moe ${mode.cpuMoeLayers}`;
  }

  return { launchFlags: flags, expertFlag };
}
