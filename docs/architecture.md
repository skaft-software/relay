# Architecture

Relay is a protocol adapter that sits between agent clients and local LLM servers.

## Two Operating Modes

| Mode | Description |
|---|---|
| **Gateway** | Manages local llama.cpp models. Auto lifecycle: start, stop, switch. Forwards unknown models to cloud fallback if configured. |
| **Cloud** | Proxies to external APIs (OpenAI, Anthropic, DeepSeek, Groq). No local GPU needed. Per-model base URL and auth. |

## Request Flow

```text
Client (OpenAI/Anthropic)
  → endpoint parser + auth + field policy
  → canonical request (provider-agnostic intermediate form)
  → upstream OpenAI-compatible chat request
  → canonical response / stream events
  → client protocol response (shape-matched to inbound protocol)
```

## Canonical Pipeline

Relay normalizes everything through a provider-neutral canonical form:

- Request model: `src/internal/canonical.ts`
- Protocol converters: `src/internal/openai-chat.ts`, `src/internal/openai-responses.ts`, `src/internal/anthropic-messages.ts`
- Response model: `src/internal/response.ts`
- Shared sampling logic: `src/internal/sampling.ts`

## Streaming

- OpenAI chat streams emit repaired `[DONE]` terminators
- Responses streams emit the full SSE event lifecycle (output_item, content_part, text_delta, function_call_arguments, completed)
- Anthropic streams emit message_start, content_block, message_delta, message_stop events
- Missing terminators are repaired; duplicates are collapsed

## Auto Model Lifecycle

When enabled, Relay manages model processes:

- Spawns model servers on dedicated ports (8081+)
- Routes requests to the correct port via `getUpstreamUrl()`
- Kills old models when switching (eager switching)
- Clears KV cache on session change
- Cleans orphan processes from previous instances on startup

## Observability

When `RELAY_OBSERVABILITY_ENABLED=true`:

- `GET /` — HTML dark-theme dashboard with model table, queue cards, lifecycle state
- `GET /health` — JSON liveness check
- `GET /relay/status` — full lifecycle + queue status
- `GET /relay/metrics` — request counts, latencies, error rates
- `GET /relay/jobs` — job queue state
- `GET /relay/lifecycle` — per-model process details
- `GET /relay/stats` — request history
- `GET /relay/capabilities` — capability matrix

All sensitive values (API keys, auth headers) are redacted in logs and observability output.

## Response Store

The `/v1/responses` endpoint stores completed responses in an in-memory store with:

- Full chat message history for `previous_response_id` conversation continuation
- TTL-based expiry (`COMPLETION_TTL_SECONDS`)
- Memory-bound eviction (`maxStoreEntries`, `maxStoreBytes`)

## Key Modules

| Module | Purpose |
|---|---|
| `src/server.ts` | HTTP server, routing, auth, rate limiting, mutex, cloud fallback |
| `src/config.ts` | Environment variable loading and validation |
| `src/auth.ts` | API key validation, per-key rate limiting (`KeyRateLimiter`) |
| `src/lifecycle.ts` | Model process management (start, stop, switch, probe, idle shutdown) |
| `src/openai/responses.ts` | `/v1/responses` handler, streaming SSE lifecycle, `ResponseStore` |
| `src/openai/chat.ts` | `/v1/chat/completions` handler |
| `src/internal/openai-responses.ts` | Responses → canonical conversion, tool normalization |
| `src/upstream/llama.ts` | Upstream HTTP client with auth header injection |
| `src/normalize/` | Message, tool, and stream normalization |
