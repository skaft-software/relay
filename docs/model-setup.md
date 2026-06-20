# Setup Wizard

Relay includes an interactive setup wizard and a headless CLI mode for agents and scripts.

## Interactive (TUI)

```bash
python3 scripts/setup-tui.py
```

Arrow keys to navigate, Enter to pick. The wizard:

1. Auto-detects your GPU, VRAM, and RAM
2. Shows supported modes: local models, cloud API proxy, or BYO (existing server)
3. For local: finds your GGUF files, sizes them, generates start scripts with optimal flags
4. For cloud: configures OpenAI, Anthropic, DeepSeek, or Groq as upstreams
5. Writes `.env` and `docker-compose.yml`

## Headless (CLI)

```bash
# Auto-detect everything, no questions — re-run anytime to regenerate configs
python3 scripts/setup-tui.py --auto

# Cloud mode
python3 scripts/setup-tui.py --auto --mode cloud

# Custom model directory
python3 scripts/setup-tui.py --auto --models-dir /opt/models

# Print model catalog and exit
python3 scripts/setup-tui.py --list

# Show all options
python3 scripts/setup-tui.py --help
```

The `--auto` flag does the full local setup silently: detect hardware → find llama.cpp → size every GGUF → generate start scripts → write `.env` and `docker-compose.yml`. Start scripts go to `~/.relay/start-scripts/` (or the repo's `start-scripts/` if run from inside a relay checkout).

## The Sizing Engine

`size-model.py` reads a GGUF file and computes the maximum safe context size for your specific hardware. The wizard calls this automatically. You can also run it standalone:

```bash
python3 scripts/size-model.py /path/to/model.gguf --json
```

Output includes:

- `max_ctx` — maximum safe context window size
- `launch_flags` — optimal llama-server flags (GPU layers, KV cache type, MoE offloading, `--jinja`)
- `expert_flag` — MoE expert offloading flag (e.g. `--n-cpu-moe 25`)
- `headroom_gb` — VRAM safety margin
- `kv_gb` — KV cache memory estimate
- `cache_type_k` / `cache_type_v` — recommended KV cache quantization

## Regenerating Configs

After adding new GGUF files to your models directory:

```bash
# Backup existing config
cp .env .env.bak

# Regenerate everything
python3 scripts/setup-tui.py --auto

# Restart
docker compose restart
```

Your model files are never touched. Only `.env`, `docker-compose.yml`, and `start-scripts/` are regenerated.
