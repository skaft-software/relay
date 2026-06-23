/**
 * Dev harness: assert the TS sizing port matches the Python oracle's golden
 * numbers on real GGUFs. Run on a box that has the model files.
 * (Promoted to tests/sizing.test.ts once green.)
 */
import { existsSync, readFileSync } from 'node:fs';
import { readGguf } from '../src/sizing/gguf.ts';
import { analyze, compute, readMeta, GB } from '../src/sizing/size-model.ts';

const PATHS: Record<string, string> = {
  'apodex-1.0-4b-sft-q8_0.gguf': '/home/achu/models/apodex/apodex-1.0-4b-sft-q8_0.gguf',
  'GLM-4.7-Flash-REAP-23B-A3B-UD-Q4_K_XL.gguf': '/home/achu/models/unsloth/GLM-4.7-Flash-REAP-23B-A3B-UD-Q4_K_XL.gguf',
  'gemma-4-E4B-it-Q4_K_M.gguf': '/home/achu/models/unsloth_gemma-4-E4B-it-GGUF/gemma-4-E4B-it-Q4_K_M.gguf',
  'Qwen3.6-27B-UD-Q2_K_XL.gguf': '/home/achu/models/unsloth/Qwen3.6-27B-UD-Q2_K_XL.gguf',
};

const golden = JSON.parse(readFileSync(new URL('./fixtures/sizing-golden.json', import.meta.url), 'utf8')) as any[];
let fails = 0;
const near = (got: number, want: number, tol: number) => Math.abs(got - want) <= tol;

for (const m of golden) {
  if (!m.meta) continue;
  const path = PATHS[m.path];
  if (!path || !existsSync(path)) { console.log('SKIP (no file):', m.path); continue; }

  const meta = readMeta(readGguf(path));
  const ta = analyze(meta);

  const exact: Array<[string, unknown, unknown]> = [
    ['arch', meta.arch, m.meta.arch],
    ['nl', meta.nl, m.meta.nl],
    ['nexp', meta.nexp, m.meta.nexp],
    ['nact', meta.nact, m.meta.nact],
    ['train_ctx', meta.trainCtx, m.meta.train_ctx],
    ['fsize', meta.fsize, m.meta.fsize],
    ['nonex', ta.nonex, m.analyze.nonex],
    ['exp', ta.exp, m.analyze.exp],
    ['n_kv', ta.nKv, m.analyze.n_kv],
    ['n_cache', ta.nCache, m.analyze.n_cache],
    ['kv_ptok_f32', Math.round(ta.kvPtok), Math.round(m.analyze.kv_ptok_f32)],
  ];
  for (const [name, got, want] of exact) {
    if (got !== want) { fails++; console.log(`FAIL ${m.path} ${name}: got ${got} want ${want}`); }
  }


  for (const cs of m.cases) {
    const dram = cs.vram_gb === 24 ? 64 : 32;
    const r = compute(cs.vram_gb * GB, dram * GB, meta, ta);
    if (r.bestCtx !== cs.best_ctx) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} best_ctx: ${r.bestCtx} vs ${cs.best_ctx}`); }
    if (r.cpuMoeLayers !== cs.n_cpu_moe) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} n_cpu_moe: ${r.cpuMoeLayers} vs ${cs.n_cpu_moe}`); }
    if ((r.allExpertsCpu ? 1 : 0) !== (cs.cpu_moe ? 1 : 0)) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} cpu_moe: ${r.allExpertsCpu} vs ${cs.cpu_moe}`); }
    if (!near(r.headroomPct, cs.headroom_pct, 0.02)) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} headroom_pct: ${r.headroomPct} vs ${cs.headroom_pct}`); }
    if (!near(r.kvGb, cs.kv_gb, 0.002)) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} kv_gb: ${r.kvGb} vs ${cs.kv_gb}`); }
    if (!near(r.expGpuGb, cs.exp_gpu, 0.002)) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} exp_gpu: ${r.expGpuGb} vs ${cs.exp_gpu}`); }
    if (!near(r.expCpuGb, cs.exp_cpu, 0.002)) { fails++; console.log(`FAIL ${m.path}@${cs.vram_gb} exp_cpu: ${r.expCpuGb} vs ${cs.exp_cpu}`); }
  }
  console.log('checked:', m.path);
}
console.log(fails === 0 ? 'ALL MATCH ✓' : `${fails} MISMATCHES ✗`);
process.exit(fails === 0 ? 0 : 1);
