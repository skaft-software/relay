# Model Setup

Relay includes a sizing engine (`size-model.py`) that computes optimal llama.cpp flags for any GGUF model on your specific hardware. It eliminates the guesswork around `--ctx-size`, `--n-cpu-moe`, and VRAM budgeting.

## Quick Start

```bash
# Interactive TUI (recommended)
python3 scripts/setup-tui.py

# Or script it
python3 scripts/setup-tui.py --no-tui --model apodex-2b
```

## The Sizing Engine

`size-model.py` reads a GGUF file and computes the maximum safe context size for your GPU.

```bash
python3 scripts/size-model.py /path/to/model.gguf
```

### What it does

1. **Reads GGUF metadata**: architecture, layer count, tensor shapes, expert configuration
2. **Computes per-token KV cost**: parses `attn_k.weight` and `attn_v.weight` tensors (or fused `attn_qkv.weight`), applies q4_0 ratio (0.5625 bytes/element)
3. **Splits expert vs non-expert weights**: counts `_exps.`, `_shexp.` tensors or uses architecture-specific fractions (90-94% for MoE)
4. **Scans offload levels**: tries `n_cpu_moe` from 0→n_layers, picks the one that maximizes context while keeping VRAM headroom ≥5%
5. **Handles architecture quirks**: Gemma4 sliding window, DeepSeek MLA compressed latents, Qwen3.5 linear attention intervals
6. **Checks DRAM**: ensures offloaded experts + draft model fit in available system RAM

### Output

```
─── RESULT ───
  max_ctx=202752  (train_ctx=202752)
  experts: --n-cpu-moe 7

  VRAM: budget=15.2  nonex=1.0  exp_gpu=10.4  KV=2.9GB
  headroom=+0.9GB (5.5%)

  ── Overhead tolerance ──
  Extra %  Result ctx  Status
       5%      202752  ✓ OK
      10%      189355  ⚠ LOW
      15%      135825  ⚠ LOW
      20%       82295  ⚠ LOW
      25%       28765  ⚠ LOW
  Max overhead before degraded: ~8%
```

### Safety Modes

| Flag | Safety margin | Compute buffers | Overhead | Headroom |
|------|--------------|-----------------|----------|----------|
| (default) | 256 MB | 500 MB | 5% | 5% |
| `--conservative` | 384 MB | 750 MB | 7.5% | 5% |
| `--safe` | 512 MB | 1000 MB | 10% | 5% |

The solver **enforces** minimum headroom. If the best-ctx config has <5% headroom, it automatically increases expert offloading or reduces context.

### Sensitivity Analysis

The overhead tolerance table shows exactly how much unexpected memory overhead your config can absorb before degrading. "Max overhead before degraded" is the key number — if it's under 5%, the config is tight and you should use `--conservative` or `--safe`.

## Architecture Support

| Architecture | KV style | Expert detection | Notes |
|-------------|----------|-----------------|-------|
| `deepseek2` (GLM-4.7) | MLA compressed latent | ✓ | Single `attn_kv_a_mqa` per layer |
| `qwen3moe` / `qwen35moe` | Standard GQA | ✓ | Fused QKV or split K/V |
| `qwen3next` | Hybrid (12/48 layers) | ✓ | Only 12 sink layers cache full KV |
| `gemma4` | SWA + global | ✓ | 5/6 layers sliding window (fixed cost), 1/6 global (growing) |
| `mistral3` / `cohere2moe` | Standard GQA | ✓ | Split K and V tensors |
| Dense models | Standard | N/A | All weights non-expert |

## Runtime Verification

After sizing, verify the model actually fits:

```bash
./scripts/verify-runtime.sh /path/to/model.gguf --ctx-size 202752 --n-cpu-moe 7
```

This launches the model, fills KV cache incrementally, monitors VRAM via `rocm-smi`/`nvidia-smi`, and reports peak usage vs prediction.

## Relay Integration

When relay is installed (systemd or `/opt/relay`), the setup TUI detects it and offers to register the model automatically:

```
Relay found: /etc/relay/relay.env (needs sudo)
Register Apodex 2B with relay? [y/N]
```

If relay's env file is writable, it appends the model to `RELAY_MODEL_MAP` automatically. Otherwise it prints the exact `sudo tee -a` command.

### Model Map Entry

```bash
RELAY_MODEL_MAP='{"apodex-2b": {"cmd":"/home/user/start-llama-apodex-2b.sh","ctx_size":262144}}'
```

See [Lazy LLM Lifecycle](/lazy-llm-lifecycle) and [Configuration](/configuration) for the full relay model switching setup.

## Docker Output

```bash
python3 scripts/size-model.py model.gguf --docker
# docker run -d --name llama-server \
#   --device /dev/kfd --device /dev/dri \
#   -v /path/to/models:/models:ro \
#   -p 8080:8080 \
#   ghcr.io/ggml-org/llama.cpp:full \
#   --model /models/model.gguf \
#   --ctx-size 202752 \
#   -ngl 999 --parallel 1 --flash-attn on \
#   --cache-type-k q4_0 --cache-type-v q4_0 \
#   --n-cpu-moe 7
```

Docker output auto-detects AMD (`--device /dev/kfd --device /dev/dri`) vs NVIDIA (`--gpus all`) and selects the correct image tag.

## Manual VRAM/DRAM Override

For containers or headless servers where GPU tools aren't available:

```bash
python3 scripts/size-model.py model.gguf --vram 16 --dram 32 --conservative --docker
```
