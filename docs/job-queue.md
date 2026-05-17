# Relay Job Queue

Relay owns LLM request brokering for local llama.cpp-style upstreams. It
exposes a minimal, serialized job queue that agent runtimes (Synax, Super,
AutoCareer, etc.) can submit work to instead of hammering the upstream
directly. Existing OpenAI- and Anthropic-compatible HTTP routes keep working
exactly as before; the queue is an additional surface, not a replacement.

## Why Relay owns this

- A single local GPU can only run one llama.cpp request at a time efficiently.
- Agent runtimes can issue many concurrent requests; without serialization
  they thrash the upstream and produce timeouts.
- Relay is the only component already sitting in the request path. It is the
  natural place to enforce queueing, expose health, and (optionally) manage
  GPU lifecycle.
- Putting this in Relay keeps agent runtimes free of model-server plumbing.

## Endpoints

- `POST /relay/jobs` — submit a job (returns `202` with a snapshot)
- `GET /relay/jobs` — list known jobs (most recent retained, bounded)
- `GET /relay/jobs/:id` — get a single job snapshot
- `DELETE /relay/jobs/:id` — cancel a queued job (best-effort)
- `GET /relay/status` — combined queue + lifecycle status
- `GET /relay/lifecycle` — lifecycle status only

If `API_KEY` is set, all `/relay/*` endpoints require the same bearer/x-api-key
authentication as the rest of Relay.

## Submitting a job

```json
POST /relay/jobs
{
  "source": "synax",
  "kind": "openai.chat",
  "priority": "normal",
  "request": {
    "model": "local-model",
    "messages": [{ "role": "user", "content": "Hello" }]
  },
  "timeoutMs": 600000
}
```

Supported `kind` values:

- `openai.chat` (default) — routed through the existing `/v1/chat/completions`
  pipeline including normalization, profiles, and tool repair.
- `anthropic.messages` — routed through the existing `/v1/messages` pipeline.

`stream` is accepted on the submission body but the queue itself returns the
final assembled response. For true streaming clients, continue to use
`/v1/chat/completions` or `/v1/messages` directly — those paths still call the
lifecycle hooks (so idle shutdown still works) and remain behavior-compatible
with the existing API.

## Snapshot shape

```jsonc
{
  "id": "…uuid…",
  "source": "synax",
  "kind": "openai.chat",
  "priority": "normal",
  "stream": false,
  "status": "queued" | "running" | "completed" | "failed" | "cancelled" | "timeout",
  "createdAt": "2026-05-17T…Z",
  "startedAt": "…",
  "finishedAt": "…",
  "response": { /* upstream payload when completed */ },
  "error":    { "code": "…", "message": "…", "upstreamStatus": 503 }
}
```

## Status / counts

`GET /relay/status` returns:

```jsonc
{
  "queue": {
    "pending": 0,        // queued, not yet running
    "active": 0,         // currently running (0 or 1 today)
    "completedRecent": 0,// completed in the last 5 minutes
    "failedRecent": 0    // failed or timed out in the last 5 minutes
  },
  "lifecycle": { /* see docs/lazy-llm-lifecycle.md */ }
}
```

## Concurrency model

- Exactly one job runs at a time. Additional submissions queue and are drained
  in priority order (`high` > `normal` > `low`), then FIFO.
- Each job has a timeout (`timeoutMs`, default 10 minutes). When it elapses,
  Relay aborts the upstream request and marks the job `timeout`.
- The queue prunes finished entries beyond `MAX_STORE_ENTRIES` to avoid
  unbounded memory growth.

## What Relay does *not* do

Relay is not an agent runtime. It does not implement task planning, memory,
tool dispatch, Super logic, AutoCareer logic, or Synax orchestration. Those
runtimes are expected to call Relay just like any other OpenAI/Anthropic-
compatible gateway, with the option of using the queue when they need
serialization and lifecycle.
