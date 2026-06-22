# Relay — Codebase Map & Issue List

Deep dive of `/home/achu/relay`. Goal: orient before cleanup.

## What relay is

A local-LLLM gateway. One process sits between coding agents (OpenAI / Anthropic
clients) and local llama.cpp model servers. It:

- Translates between protocols (OpenAI chat, OpenAI `/responses`, Anthropic
  messages) via a canonical intermediate form.
- Lazily starts/stops/switches model processes on dedicated ports (8081+).
- Optionally proxies "unknown" models to a cloud fallback.
- Exposes observability + a job queue.

Two modes: `gateway` (manages local llama.cpp) and `cloud` (pure proxy).

## Process layout at runtime

```
client (OpenAI/Anthropic)
  → src/server.ts            HTTP, auth, rate-limit, mutex, routing
  → src/jobs.ts              LlmJobQueue (FCFS, priority, idempotency, TTL)
  → src/lifecycle.ts         ensureModelAvailable → spawn start-*.sh on port
  → src/upstream/llama.ts    forward to http://127.0.0.1:<port>/v1
  → canonical pipeline       src/internal/{canonical,response,sampling}
                              + src/normalize/{messages,tools,stream}
```

`server.ts` creates the `ModelLifecycle`, the `LlmJobQueue` (whose processor
calls `lifecycle.ensureModelAvailable` then `createChatCompletion`), and a
`RequestMutex` when `RELAY_SERIALIZE_REQUESTS=true`. Direct endpoint callers
also pass through `withMutex`. Streaming responses wrap the body so the mutex
is released on stream end (this is the streaming bug noted in HANDOFF-models.md
item 7 — needs reproduction).

## Model lifecycle (src/lifecycle.ts, 1076 lines)

Two code paths, both in the same class:

- **Legacy path** — `llamaStartCommand` / `modelStartArgv` + `llamaStopCommand`.
  Single process, probe `upstreamBaseUrl`. `startAndWait`, `attemptShutdown`,
  `confirmShutdown`. Used when no `RELAY_MODEL_MAP`.
- **v2 path** — `RELAY_MODEL_MAP` entries each with a `cmd` script that accepts
  `LLAMA_PORT`. `ensureModelWithSwitching` → `eagerSwitch`: kill all running,
  allocate port, `startModelProcess`, `waitForHealthy` (polls `/health`).
  Per-model `activeProcesses` Map, idle shutdown per-model, circuit breaker
  per-model.

Eager switch is the only policy (`graceful` throws in `readSwitchPolicy`).
`RELAY_SWITCH_MAX_WARM_MODELS` is read but unused — switching always kills all
processes first (`killAllProcesses`).

Kill escalation: SIGTERM → `fuser -k -TERM <port>/tcp` → `fuser -k -KILL` →
`process.kill(-pid, SIGKILL)`. Orphan cleanup on startup via `fuser -k` across
`[portBase-1, portBase+10)`. Linux-only.

## Provisioning brain (src/provision.ts, 960 lines)

Headless/agent planner: `relay provision [--apply]`.

1. `resolveLayout` — `~/.relay/{models,start-scripts,logs}`, `RELAY_MODEL_DIR`
   override.
2. `detectLlamaServer` — env > convention paths > `which`. Infers backend
   (cuda/vulkan/hip/metal) from path or `--list-devices`.
3. `detectHardware` — `nvidia-smi` → `rocm-smi` → `vulkaninfo` heaps → none.
4. `scanModels` — walks models dir (depth 4), groups shards, pairs `mmproj` /
   `draft` companions by shared prefix ≥12 chars. `isMoe()` is a *filename
   regex* (`a\d+b|moe|next|...`).
5. `fitModel` — the **coarse** 3-bucket classifier (see Issues).
6. `sizeModelWithPython` — calls `scripts/size-model.py --json` for the **real**
   solver. Used per-model in `generateMap` for models not already in the
   existing map.
7. `renderStartScript` — if `launchFlags` from size-model.py present, uses them;
   otherwise falls back to the hardcoded `q4_0 / -ngl 999` template.
8. `reconcileMap` — preserves existing entries' tuning (merge), adds new, keeps
   off-disk entries. `applyProvision` writes scripts + stages `.env.new` (never
   touches live service — cutover is manual).

## Setup wizard (src/setup.ts 1014 lines + src/setup-logic.ts 441 lines)

Interactive TUI (`npm run setup`). `setup-logic.ts` is the pure-function layer
(config, catalog, GPU probe, fit, script gen). `setup.ts` is the event-driven
TUI built on `src/tui/`.

- Reads `docs/model-catalog.json` (24 models now, each with `size_gb`, `ctx`,
  `quant`, `lane`, `vision`, `thinking`, `download_url`, `filename`).
- Probes GPU via `scripts/probe-gpu.sh`.
- Model picker: filters out `too-large` via `classifyFit`, shows ✓/⚠/✗ via
  `fitIcon`.
- `configureQuickstart` writes `.env` + `generateStartScript` per selected
  model. **This path uses the coarse classifier and a hardcoded `-ngl 35` for
  partial — it never calls size-model.py.**

## The real sizing engine (scripts/size-model.py, 1200 lines)

Opens the GGUF via `gguf.GGUFReader`, walks tensors:

- Splits into `nonex` (shared/dense) vs `exp` (expert pool).
- Computes `kv_ptok` per-layer, arch-aware: `deepseek2` MLA, `qwen3next`/`gemma4`
  fused, SWA split for gemma4 (sliding window fixed cost vs global growing).
- `compute()`: budget = VRAM − safety − compute − overhead%. Tries full-GPU,
  then `-ngl o` partial scan (offloads `o` layers' experts to CPU, checks DRAM
  + headroom), then `--cpu-moe`. Picks max-ctx config meeting min headroom %.
- Emits `launch_flags` (the single source of truth for the start script),
  `expert_flag`, `headroom_pct`, `kv_gb`, `max_overhead_pct`, sensitivity table.
- Also has `--verify` (launches llama-server briefly, samples VRAM),
  `--docker`/`--compose`/`--systemd`, `--write-script`, `--safe`/`--conservative`.

Tests: `tests/test_sizing.py` (7 tests, all pass) covers `build_result` for
full-GPU / partial / cpu-moe / n_cpu_moe==nl edge cases.

## Tests

- TS: `node --test tests/*.test.ts` → 260 pass. Heavy on protocol parity
  (`tests/fixtures/baseline/*`), job-queue lifecycle, streaming SSE, tools.
- Python: `pytest tests/` → 7 pass (only `test_sizing.py`; conftest loads
  `size-model.py` via importlib since hyphens block normal import).
- Deleted python tests in working tree: `test_catalog.py`, `test_provision.py`,
  `test_tui_*.py` — the old python TUI was removed; only size-model tests
  remain.

## The .env / config

`src/config.ts` (508 lines) is the single source of truth. `loadConfig` reads
~50 env vars. `validateConfig` does cross-field checks (0.0.0.0 without API
key, port conflicts, lifecycle without start cmd, etc). `ModelEntry` is the
shape of each `RELAY_MODEL_MAP` value: `cmd`, `ctx_size`, `port`, `multimodal`,
`thinking_levels`, `timeout_sec`, `health_url` (deprecated — lifecycle always
probes `http://127.0.0.1:<port>/health`).

## Catalog vs disk vs map — three sources of model truth

1. `docs/model-catalog.json` — curated download catalog (24 entries). The
   wizard's model picker. Has `size_gb`, `ctx`, `quant`, `lane`, `vision`,
   `thinking`, `download_url`. **No `moe`/`arch`/`expert_count` field.**
2. Disk scan (`provision.ts:scanModels`) — walks `~/models`, infers `moe` from
   filename regex, pairs companions. Used by `relay provision`.
3. `RELAY_MODEL_MAP` in `.env` — the live config the lifecycle reads. Generated
   by either the wizard (`configureQuickstart`) or provision
   (`applyProvision`).

These three don't share a schema or a model ID namespace. E.g. catalog has
`qwen3-6-35b` / `qwen3.6-35b-a3b-mtp` while HANDOFF-models.md references
`qwen36-q3` start scripts. `MODEL_VRAM_ESTIMATES` in setup-logic.ts is a fourth
hand-maintained table that duplicates catalog `size_gb`.

---

# Issues to fix

## A. Fit logic — the thing you noticed (HIGH)

Three independent fit classifiers, none consistent:

1. `src/setup-logic.ts:164` `classifyFit` — whole-file-size buckets. Used by
   the **wizard icons + filtering** and by `configureQuickstart` (which
   generates the actual start scripts). No MoE awareness.
2. `src/provision.ts:386` `fitModel` — same buckets + a crude
   `--n-cpu-moe` heuristic proportional to overflow. Used by `relay provision`
   dry-run display.
3. `scripts/size-model.py:compute` — the real solver. Only called from
   `provision.ts:sizeModelWithPython` (in `generateMap`, for new models only)
   and from the shell installers (`setup-model.sh`, `verify-runtime.sh`).

**The wizard never calls size-model.py.** Its generated start scripts use
`recommendedContext()` (a clamp) and a hardcoded `-ngl 35` for partial. MoE
models that would run great via `--cpu-moe` get either marked "too big"
(filtered out) or get a useless `-ngl 35` script with no expert offload.

Fix direction: make `classifyFit`/`fitIcon` reflect whether size-model.py
finds a viable config (full-GPU / partial-with-expert-offload / too-large),
and make `configureQuickstart` call `sizeModelWithPython` for the real flags.
Catalog needs `moe` + arch hints so the wizard can do a fast label without
spawning python per row, or we accept the python call (it's fast enough —
reads GGUF headers only).

## B. Catalog has no MoE/arch metadata (HIGH, blocks A)

`docs/model-catalog.json` entries have no `moe`, `arch`, `expert_count`, or
`active_experts`. The only MoE signal anywhere is `provision.ts:isMoe()` — a
filename regex (`a\d+b|moe|next|...`). size-model.py reads these from the GGUF
at runtime. For the wizard to label rows without downloading, the catalog
needs the fields. 24 entries — tractable to annotate by hand against the
GGUF reader output or the model cards.

## C. `MODEL_VRAM_ESTIMATES` duplicates catalog `size_gb` (MED)

`src/setup-logic.ts:60` is a 25-entry hand-maintained GB table. The catalog
already has `size_gb` for every entry (and is the source of truth for
downloads). `classifyFit` falls back to the table when `model.size_gb` is
missing — but catalog entries always have it. The table is dead weight and
will drift (some entries already mismatch the catalog, e.g. `gemma-4-26b`
is 14 in both but `qwen3.6-35b-a3b` is 8 in the table vs 8 in catalog — ok,
but `qwen3-coder-next` is 18 table vs 18 catalog; `qwen3-next-80b` 25/25.
They happen to match now, but two sources is a bug waiting to happen).

Remove the table; require `size_gb` in catalog.

## D. `recommendedContext` is a noop (MED)

`src/setup-logic.ts:173`:
```ts
if (fit === 'partial-offload') return Math.min(model.ctx, model.ctx >= 98_304 ? 65_536 : model.ctx);
```
The `else` branch (`model.ctx < 98304`) returns `Math.min(model.ctx, model.ctx)`
== `model.ctx`. So for partial it only clamps 98k+→65k; everything else is
unchanged. The `too-large` branch clamps to 32k. These are arbitrary numbers
unrelated to actual KV cost. size-model.py computes the real max ctx per
hardware. This function should either call the solver or be deleted in favor
of solver output.

## E. `generateStartScript` hardcoded `-ngl 35` (MED)

`src/setup-logic.ts:296`: `const gpuLayers = input.fit === 'partial-offload' ? 35 : 99;`
`-ngl 35` is a guess. For MoE with `--cpu-moe`, you want `-ngl 99` (all layers
on GPU, experts on CPU). For dense partial, the right `-ngl` depends on the
layer count and overflow. size-model.py emits the right flags. The wizard
path should use them.

## F. Two start-script generators (MED)

- `src/setup-logic.ts:generateStartScript` (wizard) — minimal, no q4_0 KV, no
  flash-attn, no `--jinja`... actually it has `--jinja` and `--parallel 1`
  but no `--flash-attn`, no `--cache-type-k/v q4_0`. Hardcoded `-ngl`.
- `src/provision.ts:renderStartScript` (provision) — uses size-model.py
  `launchFlags` when available, falls back to a template that *does* include
  `--flash-attn on`, `--cache-type-k/v q4_0`. Also adds `--mmproj` for vision
  and `--model-draft` for speculative.

The wizard's scripts are strictly worse. They'll OOM faster (no q4_0 KV) and
run slower (no flash-attn). Consolidate on `renderStartScript`.

## G. `RELAY_SWITCH_MAX_WARM_MODELS` unused (MED)

`config.ts` reads it, `lifecycle.ts` imports `switchMaxWarmModels` nowhere.
`eagerSwitch` always `killAllProcesses()`. Either implement warm-keeping
(keep N models loaded, LRU-evict) or remove the config and document
single-model-at-a-time. The lifecycle doc says "Max concurrent model
processes" — misleading.

## H. `health_url` deprecated but still in schema/docs (LOW)

`ModelEntry.health_url` is parsed but "not consulted by the lifecycle"
(per the comment). Still documented in `configuration.md`. Remove or
re-implement per-model health URL.

## I. `isMoe()` filename regex is fragile (MED)

`provision.ts:isMoe()` matches `next`, `30b`, `35b`, `80b` as MoE. This
would misclassify a dense 30B as MoE. The catalog should carry `moe: bool`
(and ideally `arch`/`expert_count`) so this guesswork goes away.

## J. Streaming mutex release (MED, from HANDOFF item 7)

`server.ts:withMutex` wraps the stream body and releases on `done`/`cancel`.
HANDOFF-models.md item 7 suspects it releases immediately for
`x-relay-loading` responses, letting a second stream trigger a model switch
mid-stream on a single GPU. Needs reproduction — the code *looks* correct
(release only in the readable's finally/cancel), but the loading-event
injection path may bypass it. Worth a focused test.

## K. Stale/deleted files in working tree (LOW)

`git status` shows deleted `install.sh`, `scripts/catalog.sh`,
`scripts/setup-tui.py`, `scripts/smoke-local-openai.sh`, and 5 python tests.
These are uncommitted deletions. Either commit the cleanup or restore. The
old python TUI is gone (good — there's a TS TUI now), but the deletions
should be committed.

## L. SECURITY: committed API key (HIGH, from HANDOFF)

HANDOFF-models.md item 8: "DEEPSEEK_API_KEY is committed in ~/relay/.env".
`.env` is in the working tree (modified in `git status`). Verify `.env` is
gitignored and the key is rotated if it was ever pushed.

## M. Two installers (MED, from HANDOFF item 8)

`install.sh` (deleted) vs `scripts/install.sh` (modified) — conflicting
compose/service names per HANDOFF. Also placeholder repo URLs
(`skaft` / `your-org` / `achuthanmukundan00`). And stale systemd relics
(`deploy/`, `install-systemd.sh`, `docs/deploy-systemd.md`) for the old
bare-node path. Needs reconciliation.

## N. size-model.py hardcoded paths (LOW)

`verify_model` and `generate_systemd_unit` hardcode
`/home/achu/llama.cpp/build-vulkan/bin/llama-server` and `User=achu`. Fine
for this box, breaks portability. Should use `detectLlamaServer`-style
resolution or accept `--llama-server` flag.

---

# Suggested fix order

1. **L** (security) — verify/rotate key, confirm .env gitignored.
2. **B** — annotate catalog with `moe`/`arch`/`expert_count`/`active_experts`.
3. **A + C + D + E + F** — collapse the fit logic to one path that calls
   size-model.py; delete `MODEL_VRAM_ESTIMATES`, `recommendedContext`'s
   clamps, the hardcoded `-ngl 35`; make the wizard use
   `renderStartScript` + `sizeModelWithPython`.
4. **I** — replace `isMoe()` regex with catalog field.
5. **G** — decide warm-models policy; remove or implement.
6. **J** — reproduce + fix streaming mutex.
7. **H, K, M, N** — cleanup.
