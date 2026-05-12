# Changelog

## v0.1.4 - 2026-05-12

### Added

- Thinking/brainstorming level metadata exposed via OpenAI-compatible `x-relay-*` headers and Anthropic thinking field passthrough sizing.
- Three.js animated protocol bridge on landing page visualizing the fallback pipeline.

### Changed

- Security hardening pass: request body size limits, depth-aware recursion guards, signal propagation, CORS allow-list tightening, host validation, and auth header stripping.
- JSON parsing now repairs lone UTF-16 surrogates before attempting deserialization (surrogate-safe `parseJson`).
- Anthropic `max_tokens` budget now accounts for thinking token reservation; hard errors surface cleanly instead of silent truncation.
- Post-hardening tidy: off-by-one depth bounds corrected, record deduplication fixed, and upstream forwarding stabilized.

### Fixed

- Allowed hosts validation edge case.
- Parsing failures from surrogate code points injected by certain tokenizers.

### Security

- Hardened against DoS vectors via configurable payload limits, recursion depth guards, and origin scoping.
- Auth secrets no longer leak through error paths or CORS headers.

## Unreleased

## v0.1.3 - 2026-05-11

### Changed

- Anthropic Messages: `thinking` field is now stripped with a warning instead of passed through, since upstream llama.cpp backends do not support Anthropic's native thinking extension.

### Removed

- `RELAY_THINKING_SUPPORTED` and `RELAY_THINKING_LEVELS` environment variables — superseded by the field-policy strip.

### Fixed

- `.gitignore` regression that stopped ignoring top-level `node_modules/`.
- Removed dead `delete chat.thinking` in Anthropic request conversion (field policy already strips it).

## v0.1.1 - 2026-05-02

### Added

- Canonical smoke command: `./scripts/smoke-local-openai.sh`
- Public compatibility matrix in README
- Benchmarks surfaced in README
- Explicit "what Relay is / is not" positioning

### Changed

- Release positioning tightened around local-first compatibility (not agent/runtime orchestration)
- Recommended setup path clarified: primary systemd/local, Docker as secondary

### Notes

- This release is intentionally focused on predictability and compatibility clarity, not feature expansion.
