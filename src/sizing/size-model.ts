/**
 * Model sizing — a faithful TypeScript port of scripts/size-model.py.
 *
 * Given a GGUF and a hardware budget (VRAM + spare DRAM), it works out the best
 * expert-offload configuration and the maximum context that fits with a safety
 * headroom. This is the heart of relay: "fits" is not "weights ≤ VRAM" — MoE
 * models keep only attention + active params on the GPU and stream experts from
 * RAM (`--n-cpu-moe N` / `--cpu-moe`), so a 14 GB model can run on an 8 GB card.
 *
 * The Python script in scripts/ is retained as the differential-test oracle:
 * tests/sizing.test.ts asserts this port reproduces its numbers on real GGUFs.
 */
import { readGguf, type GgufModel, type MetaValue, type TensorInfo } from './gguf.ts';

export const GB = 1073741824;
const MB = 1048576;
const KV_Q4_RATIO = 0.5625;
const SAFETY_MARGIN_MB = 256;
const COMPUTE_BUFS_MB = 500;
const EMPIRICAL_OVERHEAD_PCT = 5;
export const DEFAULT_HEADROOM_PCT = 5;

/** Expert byte fraction by architecture, used only when tensor names don't tag experts. */
const EXPERT_FRACS: Record<string, number> = {
  qwen35moe: 0.94, qwen3moe: 0.94, qwen3next: 0.94,
  deepseek2: 0.93, gemma4: 0.91, cohere2moe: 0.90,
};

const EXPERT_PATTERNS = [
  '_exps.', '_shexp.', 'ffn_gate_inp.', 'ffn_gate_inp_shexp.',
  'ffn_gate_exps.', 'ffn_gate_shexp.', 'ffn_down_exps.', 'ffn_down_shexp.',
  'ffn_up_exps.', 'ffn_up_shexp.',
];

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
  kvPtok: number;
  nKv: number;
  nCache: number;
  fsize: number;
}

export interface SizeResult {
  ok: boolean;
  error?: string;
  bestCtx: number;
  nCpuMoe: number;
  cpuMoe: boolean;
  headroomPct: number;
  headroomGb: number;
  kvGb: number;
  expGpuGb: number;
  expCpuGb: number;
  nonexGb: number;
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

    // ── KV per layer (q4_0) ──
    if (tn.startsWith('blk.') && tn.endsWith('.weight')) {
      const ln = parseInt(tn.split('.')[1] ?? '', 10);
      if (Number.isInteger(ln) && ln >= 0 && ln < nl) {
        if (arch === 'deepseek2') {
          if (tn.includes('attn_kv_a_mqa')) kvPerLayer[ln]! += last * KV_Q4_RATIO;
        } else if (arch === 'qwen3next' || arch === 'gemma4') {
          if (tn.includes('attn_k.')) kvPerLayer[ln]! += 2 * last * KV_Q4_RATIO;
        } else {
          if (tn.includes('attn_k.') && !tn.includes('norm')) {
            kvPerLayer[ln]! += 2 * last * KV_Q4_RATIO;
          } else if (tn.includes('attn_qkv.')) {
            const kd = typeof nkv === 'number' && nkv > 0 && kl ? nkv * kl : 512;
            kvPerLayer[ln]! += 2 * kd * KV_Q4_RATIO;
          }
        }
      }
    }

    // ── Expert vs non-expert ──
    if (EXPERT_PATTERNS.some((p) => tn.includes(p))) expEls += els;
    else nonexEls += els;
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
  return { ok: false, error, bestCtx: 0, nCpuMoe: 0, cpuMoe: false, headroomPct: 0, headroomGb: 0, kvGb: 0, expGpuGb: 0, expCpuGb: 0, nonexGb: 0 };
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
  let kvp = ta.kvPtok;
  if (kvp <= 0 && ta.nKv > 0) kvp = 0.001;

  let bestCtx = 0;
  let bestNcmoe = 0;
  let bestCpumoe = false;
  let bestEg = 0;
  let bestEc = 0;

  const tryCfg = (offloaded: number, forceCpu: boolean): [number, number, number] => {
    const eg = forceCpu ? 0 : Math.max(0, exp - offloaded * epl);
    const ec = exp - eg;
    const ka = budget - base - Math.trunc(eg);
    if (ka <= 4096 || kvp <= 0) return [0, eg, ec];
    return [Math.min(Math.trunc(ka / kvp), tctx), eg, ec];
  };

  // Full GPU
  {
    const [ctx, eg, ec] = tryCfg(0, false);
    if (ctx > 0) { bestCtx = ctx; bestEg = eg; bestEc = ec; }
  }
  // Partial offload scan (even a full-GPU fit may not be the best context)
  for (let o = 1; o <= nl; o++) {
    const [ctx, eg, ec] = tryCfg(o, false);
    if (ctx <= 0) continue;
    if (Math.trunc(ec) + draft + 2 * GB > dramFree) break;
    if (ctx > bestCtx) { bestCtx = ctx; bestNcmoe = o; bestEg = eg; bestEc = ec; }
  }
  // --cpu-moe (all experts on CPU)
  {
    const [ctx, eg, ec] = tryCfg(0, true);
    if (ctx > 0 && Math.trunc(ec) + draft + 2 * GB <= dramFree && ctx > bestCtx) {
      bestCtx = ctx; bestNcmoe = 0; bestCpumoe = true; bestEg = eg; bestEc = ec;
    }
  }

  if (bestCtx <= 4096) return fail('Cannot fit model — no room for KV cache');

  // Enforce minimum headroom: trade context for safety if needed.
  const minHrBytes = Math.trunc((budget * minHeadroomPct) / 100);
  const bestHrBytes = budget - base - Math.trunc(bestEg) - draft - Math.trunc(kvp * bestCtx);
  if (bestHrBytes < minHrBytes) {
    let safeFound = false;
    for (let o = bestNcmoe + 1; o <= nl; o++) {
      const [ctxS, egS, ecS] = tryCfg(o, false);
      if (ctxS <= 0) continue;
      const hrS = budget - base - Math.trunc(egS) - draft - Math.trunc(kvp * ctxS);
      if (hrS >= minHrBytes && Math.trunc(ecS) + draft + 2 * GB <= dramFree) {
        bestCtx = ctxS; bestNcmoe = o; bestEg = egS; bestEc = ecS; safeFound = true; break;
      }
    }
    if (!safeFound) {
      const [ctxS, egS, ecS] = tryCfg(0, true);
      if (ctxS > 0) {
        const hrS = budget - base - draft - Math.trunc(kvp * ctxS);
        if (hrS >= minHrBytes && Math.trunc(ecS) + draft + 2 * GB <= dramFree) {
          bestCtx = ctxS; bestNcmoe = 0; bestCpumoe = true; bestEg = egS; bestEc = ecS; safeFound = true;
        }
      }
    }
    if (!safeFound) {
      const kvAvail = Math.max(0, budget - base - Math.trunc(bestEg) - draft - minHrBytes);
      const safeCtx = kvp > 0 ? Math.min(Math.trunc(kvAvail / kvp), tctx) : 0;
      if (safeCtx > 4096) bestCtx = safeCtx;
    }
  }

  const headroomGb = budget / GB - base / GB - bestEg / GB - draft / GB - (kvp * bestCtx) / GB;
  const headroomPct = budget > 0 ? (headroomGb / (budget / GB)) * 100 : 0;

  return {
    ok: true,
    bestCtx,
    nCpuMoe: bestNcmoe,
    cpuMoe: bestCpumoe,
    headroomPct,
    headroomGb,
    kvGb: (kvp * bestCtx) / GB,
    expGpuGb: bestEg / GB,
    expCpuGb: bestEc / GB,
    nonexGb: ta.nonex / GB,
  };
}

/** Read a GGUF and size it for the given hardware budget (bytes). */
export function sizeModel(path: string, vramBytes: number, dramBytes: number): { meta: Meta; analysis: Analysis; result: SizeResult } {
  const meta = readMeta(readGguf(path));
  const analysis = analyze(meta);
  const result = compute(vramBytes, dramBytes, meta, analysis);
  return { meta, analysis, result };
}
