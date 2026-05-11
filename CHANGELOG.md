# Changelog

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
