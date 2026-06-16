# Changelog

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
