# API Compatibility

Relay targets practical compatibility for local model servers, not full vendor parity.

## Endpoints

### Core

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | HTML status dashboard (model table, queue, lifecycle) |
| `GET` | `/health` | JSON health check (`{"ok":true}`) |

### OpenAI-compatible

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/models` | List available models with context sizes |
| `GET` | `/v1/models/:model` | Get single model metadata |
| `POST` | `/v1/chat/completions` | Chat completions (streaming + non-streaming) |
| `POST` | `/v1/completions` | Legacy completions shim |
| `POST` | `/v1/responses` | OpenAI Responses API |
| `GET` | `/v1/responses/:id` | Get stored response |
| `DELETE` | `/v1/responses/:id` | Delete stored response |
| `POST` | `/v1/embeddings` | Embeddings normalization |
| `POST` | `/v1/rerank` | Rerank normalization |
| `POST` | `/rerank` | Rerank (alt path) |

### Anthropic-compatible

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/messages` | Anthropic Messages API |
| `POST` | `/v1/messages/count_tokens` | Anthropic token counting |

### Observability

| Method | Path | Description |
|---|---|---|
| `GET` | `/relay/status` | Full lifecycle + queue JSON |
| `GET` | `/relay/metrics` | Request counts, latencies, error rates |
| `GET` | `/relay/jobs` | Job queue state |
| `GET` | `/relay/lifecycle` | Per-model lifecycle details |
| `GET` | `/relay/stats` | Request history |
| `GET` | `/relay/requests` | Recent request details |
| `GET` | `/relay/requests/:id` | Single request detail |
| `GET` | `/relay/capabilities` | Capability registry |
| `POST` | `/relay/capabilities/refresh` | Refresh capabilities |

## `/v1/responses` Streaming SSE Lifecycle

The streaming responses endpoint emits the full OpenAI Responses SSE event sequence:

```
response.created → response.in_progress
  → response.output_item.added     (message or function_call)
    → response.content_part.added   (message only)
    → response.output_text.delta    (× N, message only)
    → response.function_call_arguments.delta (× N, tool calls)
    → response.content_part.done    (message only)
    → response.function_call_arguments.done (tool calls)
  → response.output_item.done
→ response.completed   (or response.failed on error)
```

### Conversation Continuation

`/v1/responses` supports `previous_response_id`. Relay stores the full chat message history for each response. When a follow-up request references a previous response, Relay reconstructs the conversation context:

```json
{
  "model": "qwen3.6-35b-a3b",
  "input": "what about Tokyo?",
  "previous_response_id": "resp_abc123..."
}
```

### Tool Calls

Both streaming and non-streaming responses support function tool calls. Non-function tools (web search, file search, code interpreter) are silently stripped since llama.cpp backends don't support them.

### Reasoning/Thinking Models

Models that emit `reasoning_content` (e.g. DeepSeek, Qwen thinking variants) have their reasoning buffered and surfaced as output text when no regular content is generated.

## Behavior Notes

- Unknown/hosted-only fields are governed by `RELAY_UNKNOWN_FIELD_POLICY`
- Streaming output is normalized to protocol-appropriate SSE
- Tool calls are normalized across OpenAI and Anthropic shapes
- Error responses use provider-native error shapes (OpenAI or Anthropic)
- Field policies apply per-endpoint: `pass_through`, `strip` (with warning), or `reject`

## Non-Goals

- Hosted assistants/threads/runs orchestration
- Realtime APIs
- Image/audio/file generation APIs
- Full vendor control-plane semantics
- Batch endpoints
