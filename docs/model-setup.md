# Setup Wizard

Relay includes an interactive terminal UI (TUI) for guided setup, plus a headless provision command for scripts and agents.

## Interactive Setup

```bash
relay setup
# or
node --experimental-strip-types src/main.ts setup
```

Arrow keys to navigate, Enter to pick. The wizard:

1. **Detects your hardware** — GPU vendor, VRAM, driver, system RAM
2. **Presents three modes**: local model (quickstart), cloud API proxy, or BYO (point at existing server)
3. **For local mode**: shows the model catalog filtered by lane (Coding, General, Reasoning, Vision, MoE, Dense), with fit estimates per model. Pick a model, pick a quant — Relay sizes it for your hardware.
4. **For cloud**: select a provider (OpenAI, Anthropic, DeepSeek, Groq, Gemini) and enter your API key
5. **For BYO**: provide your existing server URL and model name
6. **Configures networking**: localhost-only (safe, use Cloudflare Tunnel for WAN) or bind all interfaces (LAN + Docker)
7. **Writes** `.env` and generates model start scripts

### Model Picker

The model picker shows every model in the catalog with:

- **Fit label** — ✓ fits / ⚠ tight / ✗ no fit, based on your VRAM and the model's quant
- **IQ badge** (★) — importance-matrix quants (better quality at same file size)
- **Download marker** — ● on disk / ○ needs download
- **MoE vs Dense** grouping — MoE models offload experts to system RAM via `--cpu-moe`
- **Lane filters** — Coding, General, Reasoning, Vision, Long Context, MoE, Dense

The fit estimate accounts for your GPU backend (CUDA ~0.6GB overhead, Vulkan ~1GB), host profile (headless server vs desktop), and whether the model is MoE or dense.

### API Key Management

The Config screen (→ Config in the main menu) shows:

- **View API key** — displays the full key and a copy-paste `models.json` block for hamr
- **Rotate API key** — generates a new random key, invalidates the old one immediately

For hamr agents, add this to `~/.hamr/agent/models.json`:

```json
{
  "providers": {
    "relay": {
      "baseUrl": "http://127.0.0.1:1234/v1",
      "api": "openai-completions",
      "apiKey": "<your-key>"
    }
  }
}
```

Or use hamr's `/login → Use a custom/self-hosted endpoint` flow.

## Headless Provision

```bash
# Regenerate start scripts for all downloaded GGUFs
relay provision

# Apply changes (writes scripts, stages .env)
relay provision --apply

# Show plan without applying
relay provision --dry-run
```

The provision command:

1. Scans your model directory for GGUF files
2. Runs the pure-TypeScript sizing engine on each one
3. Generates start scripts with optimal flags (GPU layers, KV cache type, MoE offloading, `--jinja`)
4. Updates `RELAY_MODEL_MAP` in `.env`

## The Sizing Engine

The sizing engine (`src/sizing/size-model.ts`) reads a GGUF file and computes the maximum safe context size for your specific hardware. The setup wizard and provision command call this automatically. It produces:

- `maxCtx` — maximum safe context window size
- `launchFlags` — optimal llama-server flags (GPU layers, KV cache type, `--jinja`)
- `expertFlag` — MoE expert offloading flag (`--cpu-moe` or `--n-cpu-moe N`)
- `headroomPct` — VRAM safety margin percentage
- `kvGb` — KV cache memory estimate

For catalog-only estimates (no GGUF on disk yet), per-architecture KV bytes-per-token values provide a fast approximation. Once the GGUF is downloaded, provision re-sizes with real header data (kv_ptok, nonex_frac).

## Regenerating Configs

After adding new GGUF files to your models directory:

```bash
# Regenerate start scripts and model map
relay provision --apply

# Restart if running in Docker
docker compose restart

# Or re-run the full setup wizard
relay setup
```

Your model files are never touched. Only `.env` and `start-scripts/` are regenerated.

## Other TUI Screens

| Screen | What it does |
|--------|-------------|
| Models | Catalog browser — download, delete, or probe (test-launch) models |
| GPU runtime | Check or build llama.cpp for your GPU backend (Vulkan, CUDA, Metal) |
| Docker | Build image, start/stop container, view logs |
| Tunnel | Cloudflare Tunnel — quick (anonymous URL) or named (your domain) |
| Config | Edit `.env` — bind address, model map, API key, lifecycle settings |
| Sampling | Set temperature, top_p, penalties |
| Logs | Tail the relay log file |
| Doctor | Preflight checks — GPU, llama-server, model files, port binding, API compat |
