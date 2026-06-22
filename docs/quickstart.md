# Quickstart

## Install

```bash
git clone https://github.com/achuthanmukundan00/relay
cd relay
npm install
```

## Setup

```bash
# Interactive TUI
node --experimental-strip-types src/main.ts setup
# or
relay setup
```

The wizard auto-detects your hardware and has three modes:

| Mode | What it does |
|---|---|
| **Local** | Finds your GGUF files, sizes them, generates start scripts with optimal GPU/CPU flags, writes `.env` |
| **Cloud** | Configures relay to proxy OpenAI, Anthropic, DeepSeek, Groq, or Gemini — no local GPU needed |
| **BYO** | Point relay at an existing Ollama or llama.cpp server |

Arrow keys to navigate, Enter to pick. The model picker shows fit labels (✓ fits / ⚠ tight / ✗ no), marks downloaded models with ●, and groups by architecture (MoE vs Dense).

## Headless Provision

```bash
# Regenerate start scripts for all downloaded GGUFs (no prompts)
relay provision --apply

# Show what would change
relay provision
```

## Start Relay

```bash
# Docker (recommended for Linux with GPU)
docker compose up -d

# Bare metal
npm start
```

## Verify

```bash
# Health check
curl http://127.0.0.1:1234/health

# List models
curl http://127.0.0.1:1234/v1/models

# HTML dashboard
open http://127.0.0.1:1234

# Test completion
curl -X POST http://127.0.0.1:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.6-35b-a3b","messages":[{"role":"user","content":"Say OK"}],"max_tokens":10}'
```

## Point Your Agent Here

Add a relay provider to `~/.hamr/agent/models.json`:

```json
{
  "providers": {
    "relay": {
      "baseUrl": "http://127.0.0.1:1234/v1",
      "api": "openai-completions",
      "apiKey": "<your-api-key>"
    }
  }
}
```

For other clients:

```
Base URL: http://127.0.0.1:1234/v1
API Key:  (copy from relay setup → Config → View API key)
```

Works with opencode, Cursor, Claude Code, Continue, Aider, and any OpenAI/Anthropic-compatible client.

## Next

- [Configuration reference](configuration.md) — every env var
- [Setup wizard details](model-setup.md) — TUI screens, sizing engine, API key management
- [Model lifecycle](lazy-llm-lifecycle.md) — auto start/stop, session-aware context
- [Public deployment](deploy-public.md) — HTTPS, Cloudflare Tunnel, sharing
- [API compatibility](api-compatibility.md) — endpoint reference
