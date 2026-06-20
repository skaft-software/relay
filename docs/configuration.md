# Configuration

Relay reads environment variables from process env (and commonly from `.env`).

## Core Variables

| Variable | Default | Notes |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `1234` | Bind port |
| `UPSTREAM_BASE_URL` | `http://127.0.0.1:8080/v1` | Upstream API root |
| `UPSTREAM_CTX_SIZE` | _(empty)_ | Running upstream context size exposed to clients |
| `DEFAULT_MODEL` | _(empty)_ | Fallback model |
| `REQUEST_TIMEOUT_SECONDS` | `600` | Upstream timeout |
| `MAX_REQUEST_BODY_BYTES` | `1048576` | Body size limit |
| `API_KEY` | _(empty)_ | If set, require auth key |

## Model Lifecycle (Lazy LLM)

Relay can manage multiple models on a single GPU, starting them on-demand and shutting them down when idle.

| Variable | Default | Notes |
|---|---|---|
| `RELAY_MODEL_LIFECYCLE_ENABLED` | `false` | Enable lazy model start/stop |
| `RELAY_MODEL_MAP` | _(empty)_ | JSON map of model names to start configs |
| `RELAY_MODEL_PORT_BASE` | `8081` | Starting port for dynamic allocation |
| `RELAY_MODEL_IDLE_SHUTDOWN_MS` | `600000` | Idle timeout before shutdown (10 min default) |
| `RELAY_SWITCH_POLICY` | `eager` | `eager` (kill old) or `graceful` (keep warm) |
| `RELAY_SWITCH_MAX_WARM_MODELS` | `2` | Max concurrent models kept warm |

### RELAY_MODEL_MAP Format

```json
RELAY_MODEL_MAP='{
  "apodex-2b": {
    "cmd": "/home/user/start-llama-apodex-2b.sh",
    "ctx_size": 262144
  },
  "gemma-4-e4b": {
    "cmd": "/home/user/start-llama-gemma-4-e4b.sh",
    "ctx_size": 78000,
    "multimodal": true
  }
}'
```

Each entry:

| Field | Required | Notes |
|---|---|---|
| `cmd` | ✓ | Shell command or script to start the model |
| `ctx_size` | | Context size (overrides `UPSTREAM_CTX_SIZE` for this model) |
| `multimodal` | | `true` if vision/audio-capable |
| `port` | | Fixed port (auto-allocated if unset) |
| `timeout_sec` | | Startup timeout override |
| `thinking_levels` | | Array of supported thinking levels `["on","off"]` |

The setup TUI generates these entries automatically when relay is detected. See [Model Setup](/model-setup).

## Compatibility Tuning

| Variable | Default | Notes |
|---|---|---|
| `RELAY_MODEL_PROFILE` | `generic` | `generic`, `qwen`, `deepseek`, `gemma`, `mistral`, `llama`, `kimi` |
| `RELAY_UNKNOWN_FIELD_POLICY` | `pass_through` | `pass_through`, `strip`, `reject` |
| `RELAY_STRICT_COMPAT` | `false` | Strict API compatibility mode |
| `RELAY_REASONING_MODE` | `off` | `off`, `raw`, `parsed`, `preserve` |
| `RELAY_TOOL_MODE` | `auto` | `auto`, `native`, `generic`, `off` |
| `RELAY_THINKING_SUPPORTED` | `false` | Enable thinking/reasoning support |
| `UPSTREAM_VISION_OK` | `false` | Global vision capability flag |

## Observability

| Variable | Default | Notes |
|---|---|---|
| `RELAY_OBSERVABILITY_ENABLED` | `true` | Enable `/relay/*` debug endpoints |
| `RELAY_LOG_PROMPTS` | `false` | Log full prompt bodies |
| `RELAY_LOG_LEVEL` | `info` | Log level |
| `RELAY_REQUEST_HISTORY_LIMIT` | `100` | Max stored request records |

## Rate Limiting

| Variable | Default | Notes |
|---|---|---|
| `RATE_LIMIT_AUTH_MAX` | `20` | Max auth requests per window |
| `RATE_LIMIT_AUTH_WINDOW_SECONDS` | `60` | Auth rate window |
| `RATE_LIMIT_RELAY_POST_MAX` | `50` | Max POST requests per window |
| `RATE_LIMIT_RELAY_POST_WINDOW_SECONDS` | `60` | POST rate window |

## Startup And Logging

| Variable | Default | Notes |
|---|---|---|
| `RELAY_PROBE_ON_STARTUP` | `true` | Probe upstream during startup |
| `RELAY_STRICT_STARTUP` | `false` | Exit if probe fails |
| `RELAY_PROBE_TIMEOUT_MS` | `3000` | Probe timeout |

## Advanced

| Variable | Default | Notes |
|---|---|---|
| `RELAY_SERIALIZE_REQUESTS` | `true` | Queue simultaneous requests sequentially |
| `RELAY_CORS_ORIGIN` | _(empty)_ | CORS origin header |
| `RELAY_EXPOSE_UPSTREAM_ERRORS` | `false` | Pass upstream errors to clients |
| `TRUST_PROXY` | `false` | Trust X-Forwarded-For headers |
| `RELAY_PREFIX_CACHE_MAX_TOKENS` | `1000000` | Prefix cache size |
| `RELAY_SWITCH_PREWARM` | `true` | Pre-warm prompt cache on model switch |
