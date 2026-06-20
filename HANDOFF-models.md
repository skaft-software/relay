# Relay model-install handoff (2026-06-18)

## Mission
Install a large model set on temper-inference (this box), then make relay
usable/installable/friendly cross-platform. This doc covers state + remaining work.

## Box / access
- Host: ssh temper-inference (already authenticated). User achu.
- GPU: AMD Radeon RX 9070 XT, Navi 48 RDNA4, **16304 MB VRAM (~15.9GB usable)**, Vulkan (radv).
- RAM: 32GB. Budget for partial offload = **~48GB combined**.
- llama.cpp: ~/llama.cpp/build-vulkan/bin/llama-server, build 9634. `--jinja` default-on.
  Has `-ncmoe N`/`--cpu-moe` (offload MoE experts to CPU) and `-ngl` partial.
- relay: ~/relay (docker compose: relay-gateway-1 host-net+pid:host, relay-cloud-1).
  systemd `relay.service` = oneshot `docker compose up -d` on boot ONLY.
- Models: ~/models/unsloth/<RepoName>/<file>.gguf. 449GB free.
- Templates: ~/templates/{qwen3.6,gemma,devstral,north}/chat_template.jinja
- Start scripts: ~/start-llama-*.sh, mounted RO into container via docker-compose.yml,
  referenced by RELAY_MODEL_MAP in ~/relay/.env. Each takes ${LLAMA_PORT}.

## DOWNLOADS IN PROGRESS (background, nohup)
- HF throttles anonymous connections after ~1GB. Workaround: chunked parallel
  range downloader. Scripts: ~/models/dl_chunked.sh (batch1) + dl_chunked2.sh (batch2,
  waits for batch1). Log: ~/models/download.log. ~19MB/s aggregate, ~4-5h total.
- Resumable + idempotent (skip-if-complete). To re-run: `nohup bash ~/models/dl_chunked.sh &`
- Verify completion: each file logs "OK". Confirm final size == HF x-linked-size.
  Leftover .parts_* dirs = incomplete; re-run downloader to finish.

### Batch1 (>=23B, ~134GB) -> ~/models/unsloth/<repo>/
qwen3-coder-30b-1m: UD-IQ3_XXS(12.9G primary), Q3_K_M(13.7G), UD-Q4_K_XL(16.5G)
qwen3-30b-thinking-2507: UD-IQ3_XXS(12G)
qwen3.6-35b-a3b: UD-Q3_K_M(15.5G)   [UD-IQ3_XXS already on disk]
glm-4.7-flash-reap-23b: UD-IQ3_XXS(9.4G), Q4_K_M(13.1G)
qwen3-next-80b-instruct: UD-IQ2_XXS(24.4G) [experiment, -cmoe]
qwen3-coder-next: UD-TQ1_0(17.6G) [experiment, 1-bit]

### Batch2 (experimental 2-bit long-ctx + 4-bit short-ctx, ~131GB)
gemma-4-26B-A4B-it NON-QAT: UD-Q2_K_XL(9.8G)+UD-Q4_K_XL(15.8G)+mmproj-F16(vision)
qwen3.6-35b-a3b: UD-Q2_K_XL(11.5G)+UD-Q4_K_XL(20.8G)
glm-4.7-flash-reap: UD-Q2_K_XL(8.4G)+UD-Q4_K_XL(13.3G)
qwen3-coder-next: UD-IQ2_XXS(21.7G) [2-bit]
mradermacher/HyperNova-60B: Q2_K(28.7G) [DENSE merge, -ngl partial NOT -cmoe, slow]

## START SCRIPTS WRITTEN (params = unsloth/Qwen-official, verified)
Qwen3-Coder(Instruct): temp .7 top_p .8 top_k 20 rep 1.05, no thinking
Qwen3-Thinking-2507: temp .6 top_p .95 top_k 20 min_p 0, --reasoning on
Qwen3.6-35B: temp 1.0 top_p .95 top_k 64, qwen3.6 template
GLM-4.7-Flash: temp .7 top_p 1.0 rep 1.0
Files: ~/start-llama-{qwen3coder,qwen3coder-q3,qwen3coder-q4,qwen3-thinking,
qwen36-q3,glm47-iq3,glm47-q4km,qwen3next-80b,qwen3coder-next}.sh (batch1)
+ {gemma26-nonqat-q2,gemma26-nonqat-q4,qwen36-q2,qwen36-q4,glm47-q2,glm47-q4xl,
qwen3coder-next-iq2,hypernova-60b-q2}.sh (batch2)
NOTE: partial-offload -ncmoe/-ngl values in experiment scripts are GUESSES; TUNE after load.

## REMAINING WORK
1. VERIFY downloads complete (download.log all OK, no .parts_* left).
2. CTX + q4_0 KV SIZING (critical: never OOM/thrash; worst case = slow/dumb).
   Method per model: stop relay default to free VRAM (docker compose stop, or use a
   spare port), run the start script with intended --ctx-size, watch
   /sys/class/drm/card1/device/mem_info_vram_used and llama-server's KV cache log line.
   Ensure weights+q4_0KV+compute <= 15.9GB (full offload) or fits 48GB combined (partial).
   Lower --ctx-size until it fits with headroom. ALL KV already q4_0 (-ctk/-ctv q4_0).
   MoE A3B models have tiny KV -> 98K-131K fine. Watch gemma (big KV/tok) + dense HyperNova.
3. SYNC ctx: start-script --ctx-size MUST equal RELAY_MODEL_MAP ctx_size for that key.
4. WIRE: add ~/start-llama-*.sh volume mounts to ~/relay/docker-compose.yml; add entries
   to RELAY_MODEL_MAP in ~/relay/.env {key:{cmd,health_url,timeout_sec,ctx_size,multimodal}}.
   Pick clean client-facing keys. Set multimodal:true for gemma/devstral (vision).
   Thinking: RELAY_THINKING_LEVELS=on,off advertised globally; thinking models =
   qwen3-thinking (always on). docker compose up -d to apply (lazy, safe).
5. SMOKE TEST each via relay: curl 127.0.0.1:1234/v1/chat/completions (model switch +
   short completion + stream). Confirm relay /v1/models + /relay/capabilities advertise
   correct ctx/thinking.
6. DELIVERABLE: rundown table - key | advertised ctx | thinking on/off | multimodal |
   KV quant(q4_0) | start script | quant | VRAM/offload profile | relay advertises.
7. MINOR: streaming:true bug. Suspect server.ts withMutex (~line 216) releases mutex
   immediately for x-relay-loading responses -> streaming reqs not serialized -> a 2nd
   stream can trigger model switch mid-stream on single GPU. Reproduce before fixing.
   streamWithModelLoading also emits raw `: comment` heartbeats + non-OpenAI error frames.
8. BIG TASK: cross-platform (AMD+NVIDIA+Apple) friendly installer + branded VitePress
   docs + model-download TUI driven by a catalog (the YAML the user pasted = source of
   truth; tag each model vram_est/ctx/backends/vision/mtp). scripts/probe-gpu.sh already
   does GPU+VRAM detect + VRAM-based suggestions. Reconcile the TWO installers
   (install.sh vs scripts/install.sh - conflicting compose/service names). Fix placeholder
   repo URLs (skaft / your-org / achuthanmukundan00). Stale systemd relics
   (deploy/, install-systemd.sh, docs/deploy-systemd.md) = old bare-node path, candidates
   to delete. SECURITY: DEEPSEEK_API_KEY is committed in ~/relay/.env.

## Catalog filter for THIS box: only >=23B params installed here (8GB CUDA box gets the
## <23B set later). 16GB+32GB. LFM2.5-8B URL 404 (and <23B) - skipped.
