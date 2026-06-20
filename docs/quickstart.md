# Quickstart

## One-Liner Install

```bash
curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/scripts/install.sh | bash
```

The installer checks for Node.js, downloads Relay, and launches the setup wizard.

## Setup Wizard

The wizard auto-detects your hardware and has three modes:

| Mode | What it does |
|---|---|
| **Local** | Finds your GGUF files, sizes them, generates start scripts with optimal GPU/CPU flags, writes `.env` |
| **Cloud** | Configures relay to proxy OpenAI, Anthropic, DeepSeek, or Groq — no local GPU needed |
| **BYO** | Point relay at an existing Ollama or llama.cpp server |

### Interactive (TUI)

```bash
python3 scripts/setup-tui.py
```

Arrow keys to navigate, Enter to pick. Shows your hardware, GPU/VRAM, and model catalog with fit markers.

### Headless (CLI)

```bash
# Auto-detect everything, no questions
python3 scripts/setup-tui.py --auto

# Cloud mode
python3 scripts/setup-tui.py --auto --mode cloud

# Custom model directory
python3 scripts/setup-tui.py --auto --models-dir /opt/models

# Print catalog and exit
python3 scripts/setup-tui.py --list

# Show all options
python3 scripts/setup-tui.py --help
```

Agents and scripts use `--auto`. Humans use the interactive TUI.

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

```
Base URL: http://127.0.0.1:1234/v1
API Key:  (leave blank unless you set API_KEY in .env)
```

Works with opencode, Cursor, Claude Code, Continue, and any OpenAI/Anthropic-compatible client.

## Next

- [Configuration reference](configuration.md) — every env var
- [Model lifecycle](lazy-llm-lifecycle.md) — auto start/stop, session-aware context
- [Public deployment](deploy-public.md) — HTTPS, Cloudflare Tunnel, sharing
- [API compatibility](api-compatibility.md) — endpoint reference
