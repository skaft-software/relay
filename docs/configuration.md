# Configuration

Relay is configured via environment variables, typically in a .env file.

## Core

| Variable | Default | Description |
|---|---|---|
| HOST | 127.0.0.1 | Bind address |
| PORT | 1234 | Bind port |
| UPSTREAM_BASE_URL | http://127.0.0.1:8080/v1 | Default upstream API root |
| UPSTREAM_CTX_SIZE | (empty) | Running upstream context size, exposed via /v1/models |
| DEFAULT_MODEL | (empty) | Fallback model when client omits model |
| REQUEST_TIMEOUT_SECONDS | 600 | Upstream request timeout |
| MAX_REQUEST_BODY_BYTES | 1048576 | Request body size limit |
| API_KEY | (empty) | If set, require this key for all requests |

## Model Lifecycle

| Variable | Default | Description |
|---|---|---|
| RELAY_MODEL_LIFECYCLE_ENABLED | false | Enable lazy model loading, switching, and idle shutdown |
| RELAY_MODEL_MAP | (empty) | JSON map: model name to start config (see below) |
| RELAY_SWITCH_POLICY | eager | graceful (needs 2x VRAM) or eager (kill old first) |
| RELAY_MODEL_PORT_BASE | 8081 | Starting port for dynamic model allocation |
| RELAY_MODEL_IDLE_SHUTDOWN_MS | 3600000 | Idle timeout before unloading (1 hour) |
| RELAY_MODEL_START_TIMEOUT_MS | 300000 | Max time to wait for model to become healthy |
| RELAY_SWITCH_PREWARM | true | Pre-fill KV cache on model switch |
| RELAY_SWITCH_MAX_WARM_MODELS | 2 | Max concurrent model processes kept warm |
| RELAY_PREFIX_CACHE_MAX_ENTRIES | 50 | Max cached conversation prefixes |
| RELAY_PREFIX_CACHE_MAX_TOKENS | 1000000 | Max combined tokens in prefix cache |
| RELAY_LIFECYCLE_RING_BUFFER_BYTES | 65536 | Process stdout/stderr ring buffer size |

### RELAY_MODEL_MAP Format

JSON object mapping model names to their start configurations:



Each model entry:
- cmd — shell script to start the model (must accept LLAMA_PORT env var)
- ctx_size — context window size
- timeout_sec (optional) — startup timeout override
- multimodal (optional) — true if model supports vision
- port (optional) — fixed port override
- switchGraceMs (optional) — grace period before killing old instance

## Compatibility

| Variable | Default | Description |
|---|---|---|
| RELAY_MODEL_PROFILE | qwen | Model family profile for defaults |
| RELAY_FIELD_POLICY | pass_through | How unknown fields are handled |
| RELAY_UNKNOWN_FIELD_POLICY | pass_through | Alias for RELAY_FIELD_POLICY |
| RELAY_STRICT_COMPAT | false | Reject non-standard requests |
| RELAY_WARN_ON_STRIPPED_FIELDS | true | Log warnings when fields are stripped |
| RELAY_REASONING_MODE | preserve | How reasoning/thinking fields are handled |
| RELAY_TOOL_MODE | auto | Tool call handling mode |

## Startup

| Variable | Default | Description |
|---|---|---|
| RELAY_PROBE_ON_STARTUP | true | Probe upstream during startup |
| RELAY_STRICT_STARTUP | false | Exit if probe fails |
| RELAY_PROBE_TIMEOUT_MS | 3000 | Startup probe timeout |
| RELAY_OBSERVABILITY_ENABLED | true | Enable /relay/* endpoints |
| RELAY_REQUEST_HISTORY_LIMIT | 100 | Max recent requests tracked |
| RELAY_LOG_PROMPTS | false | Log prompt bodies |
| RELAY_EXPOSE_UPSTREAM_ERRORS | false | Include upstream errors in responses |
| LOG_LEVEL | info | Log level |

## Security

| Variable | Default | Description |
|---|---|---|
| CORS_ORIGIN | (empty) | Allowed CORS origin |
| RATE_LIMIT_AUTH_MAX | 20 | Max requests per window |
| RATE_LIMIT_AUTH_WINDOW_SECONDS | 60 | Rate limit window |
| RELAY_ALLOWED_HOSTS | (empty) | Allowed host header values |

## Sampling Defaults

| Variable | Default | Description |
|---|---|---|
| DEFAULT_TEMPERATURE | 0.15 | Default temperature |
| DEFAULT_TOP_P | (empty) | Default top_p |
| DEFAULT_TOP_K | (empty) | Default top_k |
| DEFAULT_MIN_P | 0.01 | Default min_p |
