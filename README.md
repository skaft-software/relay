# Relay

[![License](https://img.shields.io/github/license/achuthanmukundan00/relay)](https://github.com/achuthanmukundan00/relay/blob/main/LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/achuthanmukundan00/relay)](https://github.com/achuthanmukundan00/relay/releases/latest)

A lightweight, agent-focused gateway that makes local LLM servers look like hosted OpenAI / Anthropic APIs. Sits between your coding agent (opencode, Cursor, etc.) and llama.cpp, normalizes request/response shapes, and manages model lifecycles.

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/scripts/install.sh | bash
```

That's it. The installer checks for Node.js, downloads Relay, and launches the setup wizard. The wizard auto-detects your hardware, helps you pick a model (or set up cloud providers like OpenAI/DeepSeek), and writes your config.

Once setup finishes, start Relay:

```bash
# Docker (recommended for Linux with GPU)
docker compose up -d

# Or bare metal
npm start
```

Your endpoint: `http://127.0.0.1:1234/v1`. Open the dashboard at `http://127.0.0.1:1234`.

## Why Relay

Local model servers are fast and private, but agent clients expect hosted API contracts. Relay closes that gap:

- **OpenAI-compatible**: chat/completions, completions, responses, embeddings, models
- **Anthropic-compatible**: messages, count_tokens
- **Auto model lifecycle** — starts, stops, and switches models on demand. No manual port management.
- **Session-aware** — resumes context on the same session, clears it on new sessions.
- **Streaming SSE normalization** — repairs and normalizes streaming responses.
- **Observability dashboard** — health, metrics, request history, model lifecycle status at `/relay/status`.
- **Cloud fallback** — forward unknown models to Gemini, DeepSeek, etc.
- **Two operating modes** — gateway (manage local models) or cloud (proxy to external APIs)
- **One-liner install** — `curl \| bash` then `python3 scripts/setup-tui.py --auto`

## Configuration

See [docs/configuration.md](docs/configuration.md) for the full reference. Key variables:

| Variable | Default | Description |
|---|---|---|
| `RELAY_MODEL_MAP` | (empty) | JSON map of model names to generated start commands |
| `RELAY_MODEL_LIFECYCLE_ENABLED` | `false` | Auto-start/stop models on demand |
| `RELAY_MODE` | `gateway` | `gateway` (local models) or `cloud` (proxy to external APIs) |
| `RELAY_CLOUD_FALLBACK_URL` | (none) | Gateway mode: forward unknown models here |
| `RELAY_CLOUD_MODELS` | (none) | Cloud mode: JSON map of model → `{base_url, auth_env, ctx_size}` |

## Docs

- [Configuration](docs/configuration.md)
- [API Compatibility](docs/api-compatibility.md)
- [Architecture](docs/architecture.md)
- [Model Lifecycle](docs/lazy-llm-lifecycle.md)
- [Public Deployment](docs/deploy-public.md)
- [Deployment](docs/deploy-systemd.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

[Apache License 2.0](LICENSE) (c) 2026 Achuthan Mukundan
