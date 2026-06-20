# Configuration

Relay is configured via environment variables, typically in a `.env` file.
The setup wizard writes this for you. Run `python3 scripts/setup-tui.py --auto`
to regenerate it anytime.

## Core

| Variable | Default | Description |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `1234` | Bind port |
| `UPSTREAM_BASE_URL` | `http://127.0.0.1:8080/v1` | Default upstream when lifecycle is disabled |
| `DEFAULT_MODEL` | (empty) | Fallback model when client omits model name |
| `REQUEST_TIMEOUT_SECONDS` | `600` | Upstream request timeout in seconds |
| `MAX_REQUEST_BODY_BYTES` | `1048576` | Request body size limit |
| `MAX_UPSTREAM_RESPONSE_BYTES` | `16777216` | Upstream response body limit |
| `API_KEY` | (empty) | If set, require Bearer or x-api-key on all requests |

## Operating Mode

| Variable | Default | Description |
|---|---|---|
| `RELAY_MODE` | `gateway` | `gateway` (manage local models) or `cloud` (proxy to external APIs) |

### Gateway Mode

Gateway mode manages local llama.cpp models with auto lifecycle. Unknown models can be forwarded to a cloud fallback.

| Variable | Default | Description |
|---|---|---|
| `RELAY_CLOUD_FALLBACK_URL` | (empty) | Forward unknown models to this URL (e.g. `http://relay-cloud:1235/v1`) |

### Cloud Mode

Cloud mode proxies to external APIs. No local GPU or llama.cpp needed.

| Variable | Default | Description |
|---|---|---|
| `RELAY_CLOUD_MODELS` | (empty) | JSON map of model name → `{base_url, auth_env, ctx_size}` |

Cloud model entry format:

```json
{
  "deepseek-chat": {
    "base_url": "https://api.deepseek.com/v1",
    "auth_env": "DEEPSEEK_API_KEY",
    "ctx_size": 131072
  }
}
```

Environment variables referenced by `auth_env` must be set in `.env` (e.g. `DEEPSEEK_API_KEY=sk-...`).

## Model Lifecycle

Enabled when `RELAY_MODEL_LIFECYCLE_ENABLED=true`. Models start on first request and unload after idle timeout.

| Variable | Default | Description |
|---|---|---|
| `RELAY_MODEL_LIFECYCLE_ENABLED` | `false` | Enable auto start/stop/switch of local models |
| `RELAY_MODEL_MAP` | (empty) | JSON: model name → start config |
| `RELAY_SWITCH_POLICY` | `eager` | Only `eager` supported (kill old, start new) |
| `RELAY_MODEL_PORT_BASE` | `8081` | Starting port for dynamic model allocation |
| `RELAY_MODEL_IDLE_SHUTDOWN_MS` | `3600000` | Idle timeout before unloading (1 hour) |
| `RELAY_MODEL_START_TIMEOUT_MS` | `120000` | Max time to wait for model health check |
| `RELAY_SWITCH_MAX_WARM_MODELS` | `2` | Max concurrent model processes |
| `RELAY_SERIALIZE_REQUESTS` | `false` | Queue requests one-at-a-time (FCFS, prevents thrash) |
| `RELAY_LIFECYCLE_RING_BUFFER_BYTES` | `65536` | Process stdout/stderr ring buffer size |
| `RELAY_LIFECYCLE_SHUTDOWN_CONFIRM_TIMEOUT_MS` | `10000` | Max time to wait for health to go red after shutdown |
| `RELAY_LIFECYCLE_CIRCUIT_BREAKER_THRESHOLD` | `3` | Consecutive failures before circuit breaker trips |
| `RELAY_LIFECYCLE_CIRCUIT_BREAKER_WINDOW_MS` | `300000` | Window for counting failures |
| `RELAY_LIFECYCLE_CIRCUIT_BREAKER_COOLDOWN_MS` | `120000` | Cooldown before retrying a tripped model |

### RELAY_MODEL_MAP Format

JSON object mapping model names to start configurations. The setup wizard generates this.

Each entry:
- `cmd` (required) — shell script to start the model (must accept `LLAMA_PORT` env var)
- `ctx_size` (required) — context window size, exposed via `/v1/models`
- `timeout_sec` (optional) — startup timeout override
- `multimodal` (optional) — `true` if model supports vision
- `port` (optional) — fixed port (auto-allocated if unset)
- `thinking_levels` (optional) — `["on"]` or `["on","off"]` for thinking-capable models
- `health_url` (optional) — override health check URL

Example:

```json
{
  "qwen3.6-35b-a3b": {
    "cmd": "/relay/start-scripts/start-qwen3.6-35b-a3b.sh",
    "ctx_size": 262144
  },
  "gemma-4-26b": {
    "cmd": "/relay/start-scripts/start-gemma-4-26b.sh",
    "ctx_size": 131072,
    "multimodal": true,
    "thinking_levels": ["on", "off"]
  }
}
```

### Session-Aware Context

Send a `session-id` header with requests. When the session ID changes, Relay restarts
the model to clear its KV cache. This prevents conversation state from leaking between
different users or projects sharing a relay instance.

```
curl -H "session-id: project-alpha" http://127.0.0.1:1234/v1/chat/completions ...
```

Headers checked (first match wins): `session-id`, `session_id`, `x-session-affinity`, `x-client-request-id`.

## Compatibility

| Variable | Default | Description |
|---|---|---|
| `RELAY_MODEL_PROFILE` | `generic` | Model family profile for sampling defaults |
| `RELAY_UNKNOWN_FIELD_POLICY` | `pass_through` | `pass_through`, `strip` (with warning), or `reject` |
| `RELAY_STRICT_COMPAT` | `false` | Reject non-standard requests |
| `RELAY_WARN_ON_STRIPPED_FIELDS` | `true` | Log warnings when fields are stripped |
| `RELAY_REASONING_MODE` | `off` | `off`, `preserve`, or `auto` for reasoning/thinking fields |
| `RELAY_TOOL_MODE` | `auto` | Tool call handling mode |
| `RELAY_THINKING_SUPPORTED` | `false` | Declare thinking capability to clients |
| `RELAY_THINKING_LEVELS` | `on,off` | Available thinking levels (comma-separated) |
| `UPSTREAM_VISION_OK` | `false` | Declare vision/multimodal capability |

## Observability

| Variable | Default | Description |
|---|---|---|
| `RELAY_OBSERVABILITY_ENABLED` | `true` | Enable `/relay/*` endpoints |
| `RELAY_OBSERVABILITY_CAPTURE_BODY` | `false` | Capture request/response bodies |
| `RELAY_REQUEST_HISTORY_LIMIT` | `100` | Max recent requests tracked |
| `RELAY_LOG_PROMPTS` | `false` | Log prompt bodies (security risk) |
| `RELAY_EXPOSE_UPSTREAM_ERRORS` | `true` | Include upstream error details in responses |
| `LOG_LEVEL` | `info` | `silent`, `error`, `warn`, `info`, `debug` |

## Security

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGIN` | (empty) | Allowed CORS origin |
| `RATE_LIMIT_AUTH_MAX` | `20` | Max requests per window per key |
| `RATE_LIMIT_AUTH_WINDOW_SECONDS` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_RELAY_POST_MAX` | `50` | Rate limit for `/relay/*` POST endpoints |
| `RATE_LIMIT_RELAY_POST_WINDOW_MS` | `60000` | Window for relay endpoints |
| `RELAY_ALLOWED_HOSTS` | (empty) | Allowed host header values |

Rate limiting is per-key (each API token gets its own bucket). Falls back to IP-based limiting when no token is present.

## Startup

| Variable | Default | Description |
|---|---|---|
| `RELAY_PROBE_ON_STARTUP` | `true` | Probe upstream during startup |
| `RELAY_STRICT_STARTUP` | `false` | Exit if probe fails |
| `RELAY_PROBE_TIMEOUT_MS` | `3000` | Startup probe timeout |

## Sampling Defaults

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_TEMPERATURE` | (empty) | Default temperature |
| `DEFAULT_TOP_P` | (empty) | Default top_p |
| `DEFAULT_TOP_K` | (empty) | Default top_k |
| `DEFAULT_MIN_P` | (empty) | Default min_p |
| `DEFAULT_PRESENCE_PENALTY` | (empty) | Default presence_penalty |
| `DEFAULT_REPETITION_PENALTY` | (empty) | Default repetition_penalty |
