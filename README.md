# Relay

[![License](https://img.shields.io/github/license/skaft/relay)](https://github.com/skaft/relay/blob/main/LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/skaft/relay)](https://github.com/skaft/relay/releases/latest)

Relay is a lightweight, agent-focused gateway that makes local LLM servers look like hosted OpenAI- and Anthropic-style APIs. It sits between clients and local upstream model servers (like llama.cpp), normalizes request/response shapes, and manages model lifecycles.

## One-Line Install



This clones Relay, builds the Docker image, and starts the gateway. Requires Docker and curl. Works on macOS and Linux.

## Why Relay

Local model servers are fast and private, but agent clients expect hosted API contracts. Relay closes that gap and adds production features:

- **Model lifecycle** — start, stop, and switch models on demand. No manual port management.
- **Graceful switching** — new model warms up before old one shuts down. No dropped requests.
- **Prefix-cache pre-warming** — cached conversation prefixes pre-fill the KV cache for instant first-token latency.
- **Orphan cleanup** — stale model processes from previous sessions are killed on startup.
- **Multi-model** — multiple models can run simultaneously (with enough VRAM).

## Key Capabilities

- OpenAI-compatible: chat/completions, completions, responses, embeddings, models
- Anthropic-compatible: messages, count_tokens
- Streaming SSE normalization and repair
- Request/response canonicalization
- Observability: /health, /relay/capabilities, /relay/stats, /relay/status
- Configurable field policies (strip, warn, pass-through, error)

## Quickstart (Docker)



## Configuration

| Variable | Default | Description |
|---|---|---|
| HOST | 127.0.0.1 | Bind address |
| PORT | 1234 | Bind port |
| UPSTREAM_BASE_URL | http://127.0.0.1:8080/v1 | Upstream API root |
| RELAY_MODEL_LIFECYCLE_ENABLED | false | Enable lazy model loading |
| RELAY_MODEL_MAP | (empty) | JSON: model names to start configs |
| RELAY_SWITCH_POLICY | eager | graceful (needs 2x VRAM) or eager |
| RELAY_MODEL_PORT_BASE | 8081 | Starting port for model allocation |
| RELAY_MODEL_IDLE_SHUTDOWN_MS | 3600000 | Idle timeout (1 hour) |

See docs/configuration.md for full reference.

## Example



## Docs

- [Configuration](docs/configuration.md)
- [API Compatibility](docs/api-compatibility.md)
- [Architecture](docs/architecture.md)
- [Model Lifecycle](docs/lazy-llm-lifecycle.md)
- [Deployment](docs/deploy-systemd.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

[Apache License 2.0](LICENSE) (c) 2026 Achuthan Mukundan
