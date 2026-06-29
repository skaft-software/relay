/**
 * Model sizing — TypeScript sizing engine, evolved from scripts/size-model.py.
 *
 * Given a GGUF and a hardware budget (VRAM + spare DRAM), it works out the best
 * expert-offload configuration and the maximum context that fits with a safety
 * headroom. This is the heart of relay: "fits" is not "weights ≤ VRAM" — MoE
 * models keep only attention + active params on the GPU and stream experts from
 * RAM (`--n-cpu-moe N` / `--cpu-moe`), so a 14 GB model can run on an 8 GB card.
 *
 * Three-mode sizing: compute() returns speed / balanced / capacity strategies.
 * The caller picks the winner per objective:
 *   speed    → fastest full-GPU config that still leaves headroom
 *   balanced → long context with double-digit headroom and a performance floor
 *   capacity → longest stable context, Q4 KV forced, more CPU offload allowed
 *
 * The Python script in scripts/ is retained as a standalone diagnostic, but
 * Relay setup/provision use this TS engine as the source of truth.
 */
import { readGguf, type GgufModel, type MetaValue, type TensorInfo } from './gguf.ts';

export const GB = 1073741824;
const MB = 1048576;
const SAFETY_MARGIN_MB = 256;
const COMPUTE_BUFS_MB = 1024;
const EMPIRICAL_OVERHEAD_PCT = 5;
const CPU_OFFLOAD_DRAM_RESERVE_BYTES = 2 * GB;
const MOE_PROMPT_BATCH_EXTRA_BYTES = 512 * MB;
const MIN_USEFUL_CTX = 4096;
const BALANCED_MOE_MIN_EXPERT_GPU_FRAC = 0.30;
const BALANCED_DENSE_MIN_GPU_LAYER_FRAC = 0.55;
export const DEFAULT_HEADROOM_PCT = 12;

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
  /** GPU-resident non-expert/static bytes for MoE; total bytes for dense. */
  nonex: number;
  /** Offloadable expert bytes for MoE models. Zero for dense models. */
  exp: number;
  /** F32 architecture-dimension bytes-per-token (before quantization). */
  kvPtok: number;
  nKv: number;
  nCache: number;
  fsize: number;
  /** Per-transformer-block bytes from GGUF tensor payloads (weights only). */
  layerBytes?: number[];
  /** Per-block expert bytes (MoE only). */
  expertLayerBytes?: number[];
  /** Bytes outside transformer blocks, plus fixed SWA KV, that cannot be moved by -ngl. */
  nonLayerBytes?: number;
}

export interface SizedMode {
  strategy: FitStrategy;
  ctx: number;
  cpuMoeLayers: number;
  allExpertsCpu: boolean;
  kvCacheQuant: 'q4_0' | 'q8_0';
  /** -ngl layer count. Dense hybrid modes carry a real partial layer count;
   *  MoE expert-offload modes use 999 so non-expert layers stay on GPU while
   *  --n-cpu-moe/--cpu-moe moves only experts. */
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
  const layerVals = new Array<number>(nl).fill(0);
  const expertLayerVals = new Array<number>(nl).fill(0);
  let expVal = 0;
  let nonexVal = 0;
  let totalVal = 0;
  const hasTensorBytes = meta.tensors.length > 0 && meta.tensors.every((t) => typeof t.bytes === 'number');

  for (const t of meta.tensors) {
    const tn = t.name;
    let els = 1;
    for (const dim of t.dims) els *= dim;
    const val = hasTensorBytes ? (t.bytes ?? 0) : els;
    totalVal += val;
    const sd = t.dims;
    const last = sd[sd.length - 1] ?? 0;
    const blkMatch = /^blk\.(\d+)\./.exec(tn);
    const ln = blkMatch ? Number(blkMatch[1]) : -1;

    // ── KV per layer (F32 architecture-dimension bytes, no quantization) ──
    if (tn.startsWith('blk.') && tn.endsWith('.weight')) {
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
    const isSharedExpert = SHARED_EXPERT_ARCHS.has(arch) && SHARED_EXPERT_PATTERNS.some((p) => tn.includes(p));
    const isExpert = !isSharedExpert && EXPERT_PATTERNS.some((p) => tn.includes(p));
    if (isExpert) {
      expVal += val;
      if (ln >= 0 && ln < nl) expertLayerVals[ln]! += val;
    } else {
      nonexVal += val;
    }
    if (ln >= 0 && ln < nl) layerVals[ln]! += val;
  }

  let nonexBytes: number;
  let expBytes: number;
  let layerBytes: number[];
  let expertLayerBytes: number[];
  if (hasTensorBytes) {
    nonexBytes = Math.trunc(nonexVal);
    expBytes = Math.trunc(expVal);
    layerBytes = layerVals.map((v) => Math.trunc(v));
    expertLayerBytes = expertLayerVals.map((v) => Math.trunc(v));
  } else {
    const total = expVal + nonexVal;
    if (moe && expVal === 0) {
      const frac = EXPERT_FRACS[arch] ?? 0.9;
      expBytes = Math.trunc(fsize * frac);
      nonexBytes = fsize - expBytes;
    } else if (total > 0) {
      nonexBytes = Math.trunc(fsize * (nonexVal / total));
      expBytes = fsize - nonexBytes;
    } else {
      nonexBytes = fsize;
      expBytes = 0;
    }
    const layerTotal = layerVals.reduce((a, b) => a + b, 0);
    layerBytes = layerVals.map((v) => layerTotal > 0 ? Math.trunc((nonexBytes + expBytes) * (v / layerTotal)) : 0);
    const expertTotal = expertLayerVals.reduce((a, b) => a + b, 0);
    expertLayerBytes = expertLayerVals.map((v) => expertTotal > 0 ? Math.trunc(expBytes * (v / expertTotal)) : 0);
  }

  let kvPtok = kvPerLayer.reduce((a, b) => a + b, 0);
  const nKv = kvPerLayer.filter((v) => v > 0).length;
  let nCache = nKv;
  let fixedSwaBytes = 0;

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
    fixedSwaBytes = Math.trunc(sFixed * win);
    nonexBytes += fixedSwaBytes;
    kvPtok = gPtok;
    nCache = nkv.filter((v) => v <= 2).length;
  }

  const nonLayerBytes = Math.max(0, nonexBytes + expBytes - layerBytes.reduce((a, b) => a + b, 0));
  return { nonex: nonexBytes, exp: expBytes, kvPtok, nKv, nCache, fsize, layerBytes, expertLayerBytes, nonLayerBytes };
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

type SizingCandidate = {
  kvCacheQuant: 'q4_0' | 'q8_0';
  kvp: number;
  ctxMax: number;
  strategy: FitStrategy;
  cpuMoeLayers: number;
  allExpertsCpu: boolean;
  gpuLayers?: number;
  staticGpuBytes: number;
  nonexGpuBytes: number;
  expGpuBytes: number;
  expCpuBytes: number;
  denseCpuBytes: number;
};

function kvBytesPerToken(ta: Analysis, kvCacheQuant: 'q4_0' | 'q8_0'): number {
  const kvp = ta.kvPtok * KV_QUANT_RATIO[kvCacheQuant]!;
  return kvp <= 0 && ta.nKv > 0 ? 0.001 : kvp;
}

function stableCtx(
  budget: number,
  staticGpuBytes: number,
  kvp: number,
  trainCtx: number,
  minHeadroomPct: number,
): number {
  if (kvp <= 0) return trainCtx;
  const minHeadroomBytes = Math.trunc((budget * minHeadroomPct) / 100);
  const kvAvail = budget - staticGpuBytes - minHeadroomBytes;
  if (kvAvail <= 0) return 0;
  return Math.min(Math.trunc(kvAvail / kvp), trainCtx);
}

function candidateToMode(c: SizingCandidate, budget: number, ctx?: number): SizedMode | null {
  const useCtx = Math.min(ctx ?? c.ctxMax, c.ctxMax);
  if (useCtx <= MIN_USEFUL_CTX) return null;
  const headroomGb = (budget - c.staticGpuBytes - c.kvp * useCtx) / GB;
  const headroomPct = budget > 0 ? (headroomGb / (budget / GB)) * 100 : 0;
  return {
    strategy: c.strategy,
    ctx: useCtx,
    cpuMoeLayers: c.allExpertsCpu ? 0 : c.cpuMoeLayers,
    allExpertsCpu: c.allExpertsCpu,
    kvCacheQuant: c.kvCacheQuant,
    gpuLayers: c.gpuLayers,
    headroomPct,
    headroomGb,
    kvGb: (c.kvp * useCtx) / GB,
    expGpuGb: c.expGpuBytes / GB,
    expCpuGb: c.expCpuBytes / GB,
    nonexGb: c.nonexGpuBytes / GB,
  };
}

function modeTargets(trainCtx: number, moe: boolean): number[] {
  const tiers = moe
    ? [524288, 393216, 262144, 196608, 131072, 98304, 65536, 49152, 32768, 16384, 8192]
    : [131072, 98304, 65536, 49152, 32768, 16384, 8192];
  const cap = trainCtx > 0 ? trainCtx : 32768;
  return tiers.filter((t) => t <= cap);
}

function pickHighestCtx(cands: SizingCandidate[], budget: number, quant?: 'q4_0' | 'q8_0'): SizedMode | null {
  const filtered = quant ? cands.filter((c) => c.kvCacheQuant === quant) : cands;
  const best = filtered
    .filter((c) => c.ctxMax > MIN_USEFUL_CTX)
    .sort((a, b) => b.ctxMax - a.ctxMax || (b.gpuLayers ?? 0) - (a.gpuLayers ?? 0) || b.expGpuBytes - a.expGpuBytes)[0];
  return best ? candidateToMode(best, budget) : null;
}

function finalizeModes(modes: SizeResult['modes']): SizeResult {
  const balancedMode = modes.balanced;
  if (!balancedMode || balancedMode.ctx <= MIN_USEFUL_CTX) {
    return fail('Cannot fit model — no room for KV cache');
  }
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

function layerPrefixBytes(layerBytes: number[], nl: number): number[] {
  const out = new Array<number>(nl + 1).fill(0);
  for (let i = 0; i < nl; i++) out[i + 1] = out[i]! + (layerBytes[i] ?? 0);
  return out;
}

function denseLayerPlan(ta: Analysis, nl: number): { fixedBytes: number; layerBytes: number[] } {
  const layerBytes = (ta.layerBytes && ta.layerBytes.length >= nl && ta.layerBytes.some((v) => v > 0))
    ? ta.layerBytes.slice(0, nl)
    : new Array<number>(nl).fill((ta.nonex * 0.85) / Math.max(1, nl));
  const layerTotal = layerBytes.reduce((a, b) => a + b, 0);
  const fixedBytes = Math.max(0, ta.nonLayerBytes ?? (ta.nonex - layerTotal));
  return { fixedBytes, layerBytes };
}

function computeDense(
  budget: number,
  dramFree: number,
  meta: Meta,
  ta: Analysis,
  draft: number,
  overheadFactor: number,
  minHeadroomPct: number,
): SizeResult {
  const nl = Math.max(1, meta.nl);
  const { fixedBytes, layerBytes } = denseLayerPlan(ta, nl);
  const prefix = layerPrefixBytes(layerBytes, nl);
  const layerTotal = prefix[nl]!;
  const cands: SizingCandidate[] = [];

  for (const kvCacheQuant of ['q8_0', 'q4_0'] as const) {
    const kvp = kvBytesPerToken(ta, kvCacheQuant);
    for (let gpuLayers = 0; gpuLayers <= nl; gpuLayers++) {
      const gpuLayerBytes = prefix[gpuLayers]!;
      const denseCpuBytes = Math.max(0, layerTotal - gpuLayerBytes);
      if (denseCpuBytes + draft + CPU_OFFLOAD_DRAM_RESERVE_BYTES > dramFree) continue;
      const rawGpuBytes = fixedBytes + gpuLayerBytes;
      const staticGpuBytes = Math.trunc((rawGpuBytes + draft) * overheadFactor);
      const ctxMax = stableCtx(budget, staticGpuBytes, kvp, meta.trainCtx, minHeadroomPct);
      if (ctxMax <= MIN_USEFUL_CTX) continue;
      cands.push({
        kvCacheQuant,
        kvp,
        ctxMax,
        strategy: gpuLayers >= nl ? 'full-gpu' : 'hybrid',
        cpuMoeLayers: 0,
        allExpertsCpu: false,
        gpuLayers,
        staticGpuBytes,
        nonexGpuBytes: rawGpuBytes,
        expGpuBytes: 0,
        expCpuBytes: 0,
        denseCpuBytes,
      });
    }
  }

  const speed = cands.find((c) => c.kvCacheQuant === 'q8_0' && c.gpuLayers === nl)
    ?? cands.find((c) => c.kvCacheQuant === 'q4_0' && c.gpuLayers === nl);
  const speedMode = speed ? candidateToMode(speed, budget) : null;

  let balancedMode: SizedMode | null = null;
  for (const target of modeTargets(meta.trainCtx, false)) {
    const eligible = cands
      .filter((c) => c.ctxMax >= target && ((c.gpuLayers ?? 0) / nl) >= BALANCED_DENSE_MIN_GPU_LAYER_FRAC)
      .sort((a, b) => (b.gpuLayers ?? 0) - (a.gpuLayers ?? 0) || (a.kvCacheQuant === 'q8_0' ? -1 : 1));
    const best = eligible[0];
    if (best) {
      balancedMode = candidateToMode(best, budget, best.strategy === 'full-gpu' ? best.ctxMax : target);
      break;
    }
  }
  balancedMode ??= pickHighestCtx(cands, budget, 'q4_0') ?? pickHighestCtx(cands, budget);

  const capacityMode = pickHighestCtx(cands, budget, 'q4_0') ?? pickHighestCtx(cands, budget);
  return finalizeModes({ speed: speedMode, balanced: balancedMode, capacity: capacityMode });
}

function computeMoe(
  budget: number,
  dramFree: number,
  meta: Meta,
  ta: Analysis,
  draft: number,
  overheadFactor: number,
  minHeadroomPct: number,
): SizeResult {
  const nl = Math.max(1, meta.nl);
  const exp = ta.exp;
  const epl = exp / nl;
  const cands: SizingCandidate[] = [];

  for (const kvCacheQuant of ['q8_0', 'q4_0'] as const) {
    const kvp = kvBytesPerToken(ta, kvCacheQuant);
    for (let cpuLayers = 0; cpuLayers <= nl; cpuLayers++) {
      const expCpuBytes = Math.min(exp, cpuLayers * epl);
      const expGpuBytes = Math.max(0, exp - expCpuBytes);
      if (expCpuBytes + draft + CPU_OFFLOAD_DRAM_RESERVE_BYTES > dramFree) continue;
      const rawGpuBytes = ta.nonex + expGpuBytes;
      const staticGpuBytes = Math.trunc((rawGpuBytes + draft) * overheadFactor) + MOE_PROMPT_BATCH_EXTRA_BYTES;
      const ctxMax = stableCtx(budget, staticGpuBytes, kvp, meta.trainCtx, minHeadroomPct);
      if (ctxMax <= MIN_USEFUL_CTX) continue;
      const allExpertsCpu = cpuLayers >= nl || expGpuBytes <= 1;
      cands.push({
        kvCacheQuant,
        kvp,
        ctxMax,
        strategy: allExpertsCpu ? 'moe-cpu' : cpuLayers > 0 ? 'hybrid' : 'full-gpu',
        cpuMoeLayers: allExpertsCpu ? 0 : cpuLayers,
        allExpertsCpu,
        // Keep all non-expert transformer layers on GPU. Expert placement is
        // controlled independently by --n-cpu-moe / --cpu-moe.
        gpuLayers: cpuLayers > 0 || allExpertsCpu ? 999 : nl,
        staticGpuBytes,
        nonexGpuBytes: ta.nonex,
        expGpuBytes,
        expCpuBytes,
        denseCpuBytes: 0,
      });
    }
  }

  const speed = cands.find((c) => c.kvCacheQuant === 'q8_0' && c.cpuMoeLayers === 0 && !c.allExpertsCpu)
    ?? cands.find((c) => c.kvCacheQuant === 'q4_0' && c.cpuMoeLayers === 0 && !c.allExpertsCpu);
  const speedMode = speed ? candidateToMode(speed, budget) : null;

  let balancedMode: SizedMode | null = null;
  for (const target of modeTargets(meta.trainCtx, true)) {
    const eligible = cands
      .filter((c) => c.ctxMax >= target)
      .filter((c) => c.strategy === 'full-gpu' || (exp > 0 && c.expGpuBytes / exp >= BALANCED_MOE_MIN_EXPERT_GPU_FRAC))
      .sort((a, b) => b.expGpuBytes - a.expGpuBytes || (a.kvCacheQuant === 'q8_0' ? -1 : 1));
    const best = eligible[0];
    if (best) {
      balancedMode = candidateToMode(best, budget, best.strategy === 'full-gpu' ? best.ctxMax : target);
      break;
    }
  }
  balancedMode ??= pickHighestCtx(cands, budget, 'q4_0') ?? pickHighestCtx(cands, budget);

  const capacityMode = pickHighestCtx(cands, budget, 'q4_0') ?? pickHighestCtx(cands, budget);
  return finalizeModes({ speed: speedMode, balanced: balancedMode, capacity: capacityMode });
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
  const overheadFactor = 1 + overheadPct / 100;
  const budget = vram - (sm + cb) * MB;
  if (budget < 0) return fail('VRAM budget negative');
  if (ta.nonex <= 0 && ta.exp <= 0) return fail('Model footprint is empty');

  if (meta.nexp > 0 && ta.exp > 0) {
    return computeMoe(budget, dramFree, meta, ta, draft, overheadFactor, minHeadroomPct);
  }
  return computeDense(budget, dramFree, meta, ta, draft, overheadFactor, minHeadroomPct);
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

  const moeCpuOffload = mode.allExpertsCpu || mode.cpuMoeLayers > 0;
  const flags: string[] = [
    "--ctx-size", String(mode.ctx),
    ...(ng !== undefined ? ["-ngl", String(ng)] : []),
    "--parallel", String(parallel),
    ...(moeCpuOffload ? ["-b", "4096", "-ub", "4096"] : []),
    "--flash-attn", flashAttn,
    "--cache-type-k", cacheType,
    "--cache-type-v", cacheType,
    "--fit", "off",
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
