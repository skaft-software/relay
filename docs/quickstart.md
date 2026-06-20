# Quickstart

Get Relay running with a local model in **one command**.

## 1. Run the Setup TUI

```bash
git clone https://github.com/achuthanmukundan00/relay.git
cd relay
python3 scripts/setup-tui.py
```

The TUI detects your GPU, shows curated models that fit your VRAM, downloads the GGUF, computes optimal `--ctx-size` and expert offloading for your hardware, and generates a start script. If relay is already installed, it offers to register the model automatically.

**No flags. No math. Just pick a model.**

![Setup TUI showing model picker with GPU detection](/relay/setup-tui.png)

## 2. Start The Model

```bash
bash ~/start-llama-<model>.sh
```

This launches `llama-server` with optimal settings for your specific GPU — context size, expert offloading, KV cache quantization, all pre-computed.

## 3. Start Relay

```bash
cp .env.example .env
npm install
npm run dev
```

Relay starts on `http://127.0.0.1:1234`.

## 4. Verify

```bash
curl http://127.0.0.1:1234/health
# {"status":"ok"}

curl http://127.0.0.1:1234/v1/models
# {"data":[{"id":"your-model","object":"model"}]}
```

## 5. Use It

```bash
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{
    "model": "local-model",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 32
  }'
```

Connect any OpenAI-compatible client (Cline, Codex, Synax) to `http://127.0.0.1:1234/v1`.

---

## What just happened?

The setup TUI does all of this automatically:

| Step | What it does |
|------|-------------|
| Hardware detection | Reads VRAM via `nvidia-smi` or `rocm-smi`, DRAM from `/proc/meminfo` or cgroups |
| Model catalog | Curated GGUF models from unsloth, pre-sized for common GPUs |
| Download | Resumable download from HuggingFace |
| Sizing engine | Parses GGUF tensor shapes, computes per-token KV cost, scans expert offload levels, enforces 5% VRAM headroom minimum |
| Start script | Writes ready-to-run `start-llama-*.sh` with all flags |

## Scripting (non-interactive)

```bash
# List available models
python3 scripts/setup-tui.py --list

# Setup a specific model without the TUI
python3 scripts/setup-tui.py --no-tui --model apodex-2b

# With conservative memory margins (1.5x safety)
python3 scripts/setup-tui.py --no-tui --model gemma-4-e4b --safe
```

## Docker

```bash
# After setup, generate a docker run command
python3 scripts/size-model.py ~/models/model.gguf --docker

# Or for NVIDIA specifically
python3 scripts/size-model.py ~/models/model.gguf --docker --image ghcr.io/ggml-org/llama.cpp:full-cuda
```

## Manual Setup (no TUI)

If you already have a GGUF, just size it:

```bash
python3 scripts/size-model.py /path/to/model.gguf --write-script
bash ~/start-llama-<model>.sh
```

See [Model Setup](/model-setup) for the full sizing engine documentation.
