# Changelog

## v0.3.1 - 2026-06-29

### Security

- **General rate limiting for unauthenticated mode** — when no `API_KEY` is set, requests are now capped at 100/min/IP. Previously, unauthenticated instances had zero rate limiting.
- **Cloud fallback forwards auth headers** — `forwardToCloud()` now forwards incoming `Authorization` and `X-Api-Key` headers to the cloud fallback URL. Previously they were silently dropped, making authenticated cloud fallback unusable.
- **Shell metacharacter stripping in argv `${MODEL}`** — model names substituted into `modelStartArgv` arrays now have shell metacharacters (`;`, `|`, `` ` ``, `$()`, etc.) replaced. Shell-interpolated `${MODEL}` in `cmd` was already sanitized.
- **Model name length cap** — model names exceeding 512 characters are rejected with 400 before reaching shell interpolation or URL construction.
- **Mutex abort listener cleanup** — queued request waiters now properly remove their abort signal listeners when dequeued, preventing memory leaks under high concurrency with client disconnects.
- **Port allocation exhaustion guard** — `allocatePort()` now throws if `nextPort > 65530`, preventing invalid port numbers.
- **Idempotency key map hard cap** — the idempotency key cache is now capped at 10,000 entries with LRU eviction, preventing unbounded memory growth under adversarial key churn.
- **`MAX_STORE_BYTES` validated as positive integer** — the store byte cap now rejects floats and negative values. Added to `.env.example`.
- **Improved Content-Type error message** — non-JSON Content-Type rejections now include the actual received type.

### Fixed

- Sizing engine: three-mode dispatch (`speed`/`balanced`/`capacity`) now correctly applies to the selected mode rather than always using balanced.
- Provisioning: cross-vendor multi-GPU detection with per-model GPU flags; `--list-devices` parsing for Vulkan/ROCm/CUDA.
- Dockerfile: uses `node --env-file` instead of fragile shell sourcing.
- `/v1/models` now only advertises provisioned models that have a start script AND whose GGUF is still on disk.
- Auto-discovered models no longer mutate the shared `config.modelEntries` with untyped runtime fields (`__ggufPath` is now typed).

### Changed

- Sizing engine overhaul: F32 KV cache calibration, GGUF metadata enrichment, MoE expert-layer byte splitting.
- Setup TUI: download, probe, quant picker, tunnel/docker/start screens, BYO/cloud config.
- SSE parser: CRLF (`\r\n\r\n`) frame separator support; upstream stream cancellation propagation on client disconnect.
- Provisioning: `relay provision` now generates multi-GPU layer-split flags by default when multiple GPUs are detected.
- New tests: catalog-fit, provision GPU placement, upstream cancellation on disconnect, model discovery filtering.
- Removed 4 stale hang-test fixtures.

## v0.3.0 - 2026-06-22

### Added

- **GGUF sizing engine (TypeScript)** — `src/sizing/` reads GGUF metadata in pure Node (no Python/gguf dependency), analyzes expert vs. non-expert byte splits per architecture (qwen35moe, deepseek2/MLA, cohere2moe, gemma4/SWA), and computes optimal `n_cpu_moe` offload with 5% VRAM headroom, so a 14 GB MoE model can run on an 8 GB card. The Python `scripts/size-model.py` is retained as the differential-test oracle only.
- **Catalog sizing** — KV-per-token estimates, backend detection, host profiles, and fit labels; `scripts/build-catalog.py` enriches the model catalog from GGUF metadata.
- **Interactive setup TUI** (`relay setup`) — event-driven terminal UI (`src/tui/`, `src/setup.ts`) with hardware detection, model download, probe, quant picker, and tunnel/docker/start screens, plus BYO-endpoint and cloud configuration. Terminal-capability detection degrades gracefully: truecolor→256→16→none and Unicode→ASCII, with `--ascii` / `--no-color` / `--plain` overrides.
- **New CLI subcommands** — `relay doctor` (hardware + network diagnostics, `--json`), `relay provision` (host bootstrap; dry-run by default, mutations gated behind `--apply` which stages scripts/`.env` and leaves the live service untouched), `relay llama` (detect/build llama.cpp for the detected GPU backend), `relay docker`, `relay models`, `relay tunnel` (Cloudflare), `relay probe`, and `relay catalog`. `relay help` now prints usage.
- **MoE expert offload** — `expert_flag` added to the model config schema.
- **Anthropic lifecycle integration** — `/v1/messages` ensures the target model is available before proxying.

### Changed

- Tool requests with non-function tools are now rejected with an explicit `unsupported` error instead of being silently dropped.
- Dynamic per-model upstream routing: the chat handler resolves and forwards the per-model upstream URL.
- `tsconfig` target bumped to ES2024 (regex `/v` flag support).
- Documentation: landing page rewrite, light/dark mode, and updated configuration / model-setup / quickstart guides.

### Removed

- Stale Python TUI, legacy installers, and superseded test scripts.

### Known issues

- **Prefix-cache pre-warming was dropped** in the lifecycle refactor. Model switching still works (eager kill-old → start-new) but no longer pre-fills the KV cache on switch, so the first request after a switch pays full prompt-processing latency. Re-introduction is tracked; the `model-switch` test covers the current switching behavior.

## v0.2.2 - 2026-06-16

### Added

- Qwen3.6-27B and Gemma-4-31B dense models (UD-Q2_K_XL) added to the model catalog.

## v0.2.1 - 2026-06-16

### Added

- **Per-model thinking levels** — `ModelEntry.thinking_levels` advertises model-specific levels (e.g. `["low","med","high","xhigh"]` for North/Cohere, `["on","off"]` for Qwen/Gemma). Exposed in `/v1/models` meta and capabilities.
- **Per-model context sizes** — `ModelEntry.ctx_size` reported in `/v1/models` meta, overrides global `UPSTREAM_CTX_SIZE`.
- **Per-model multimodal flag** — `ModelEntry.multimodal` controls vision support per model in `/v1/models` and capabilities.
- **Dynamic upstream routing** — chat handler passes per-model upstream URL to `upstreamFetch`, fixing model switching routing.
- **Stale upstream detection** — probes and kills leftover servers on cold start before spawning new model.
- **LLAMA_PORT env passing** — scripts use `${LLAMA_PORT:-8080}` instead of `${PORT}` to avoid collision with Relay's `PORT`.

### Changed

- Start scripts: port placeholder changed from `${PORT}` to `${LLAMA_PORT}` to prevent env collision.
- `getUpstreamUrl` routes to process port as soon as process exists (not just when healthy).
- Dockerfile: added `render` group (991) for Vulkan GPU access inside container.
- Docs: `lazy-llm-lifecycle.md` updated for v2 model switching with `RELAY_MODEL_MAP`.

### Fixed

- 401 errors from `API_KEY` being set unexpectedly.
- Model switch hanging due to `PORT=1234` leaking into child scripts.
- Dynamic upstream URL computed but never passed to `upstreamFetch`.
- `startAndWait` removed in v2 refactor but still called in legacy path.

## v0.2.0 - 2026-06-16

### Added

- **Docker-first deployment** — one-line install via curl | sh. Docker Compose with host networking and GPU passthrough.
- **Model lifecycle v2** — multi-model support with graceful switching, per-model port allocation, and idle shutdown.
- **Prefix-cache pre-warming** — cached conversation prefixes pre-fill the KV cache on model switch for instant first-token latency.
- **Orphan cleanup** — stale llama-server processes from previous Relay instances are killed on startup and before port binding.
- **Upstream URL routing** — dynamic per-model upstream URLs so each model gets its own dedicated port.
- **Graceful switching** — new model starts and warms up before old model is killed. Configurable switch policy (graceful/eager).
-  endpoint — live lifecycle state, active models, queue depth.

### Changed

- Deployment: Docker Compose is now the primary recommended method. Bare metal and systemd remain supported as secondary options.
- Lifecycle: model processes are spawned on dedicated ports (8081+) instead of sharing the upstream port.
- Config:  JSON format expanded with per-model ports, timeouts, and multimodal flags.
- README: rewritten for Docker-first install with one-liner.

### Fixed

- Duplicate model instances on Relay restart — detached child processes now cleaned up.
- Port collisions when switching models rapidly — allocatePort kills occupants before binding.

## v0.1.4 - 2026-05-12

### Added

- Thinking/brainstorming level metadata exposed via OpenAI-compatible x-relay-* headers and Anthropic thinking field passthrough sizing.
- Three.js animated protocol bridge on landing page visualizing the fallback pipeline.

### Changed

- Security hardening pass: request body size limits, depth-aware recursion guards, signal propagation, CORS allow-list tightening, host validation, and auth header stripping.
- JSON parsing now repairs lone UTF-16 surrogates before attempting deserialization (surrogate-safe parseJson).
- Anthropic max_tokens budget now accounts for thinking token reservation; hard errors surface cleanly instead of silent truncation.
- Post-hardening tidy: off-by-one depth bounds corrected, record deduplication fixed, and upstream forwarding stabilized.

### Fixed

- Allowed hosts validation edge case.
- Parsing failures from surrogate code points injected by certain tokenizers.

### Security

- Hardened against DoS vectors via configurable payload limits, recursion depth guards, and origin scoping.
- Auth secrets no longer leak through error paths or CORS headers.

## v0.1.3 - 2026-05-11

### Changed

- Anthropic Messages: thinking field is now stripped with a warning instead of passed through.

### Removed

- RELAY_THINKING_SUPPORTED and RELAY_THINKING_LEVELS environment variables — superseded by the field-policy strip.

### Fixed

- .gitignore regression that stopped ignoring top-level node_modules/.
- Removed dead delete chat.thinking in Anthropic request conversion.

## v0.1.1 - 2026-05-02

### Added

- Canonical smoke command: ./scripts/smoke-local-openai.sh
- Public compatibility matrix in README
- Benchmarks surfaced in README
- Explicit what Relay is / is not positioning

### Changed

- Release positioning tightened around local-first compatibility
- Recommended setup path clarified: primary systemd/local, Docker as secondary
