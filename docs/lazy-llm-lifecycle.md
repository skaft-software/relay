# Lazy LLM Lifecycle

Relay can optionally manage the lifecycle of the local llama.cpp upstream
process so a model does not have to be resident in GPU memory 24/7. This is
useful when several runtimes (Synax, Super, AutoCareer, …) share one GPU and
only need the model intermittently.

Lifecycle management is **disabled by default**. Default behavior is
unchanged: Relay assumes the upstream is already running. The lifecycle path
only activates when `RELAY_MODEL_LIFECYCLE_ENABLED=true` is set.

## Why Relay owns this

Relay is the single gateway in front of the upstream. It already knows when a
request arrives and when one finishes. That makes it the natural place to:

1. Start the upstream on demand when a request needs it.
2. Track active jobs and pending queue depth.
3. Stop the upstream after an idle window with no new work.

Pushing this responsibility into individual agents would mean every runtime
needs to know how to spawn llama-server, hold a lock against the GPU, and
coordinate shutdown — a much larger surface to get right.

## Surface

The lifecycle module (`src/lifecycle.ts`) exposes:

- `ensureModelAvailable()` — probe the upstream; if disabled, return its
  current reachability. If enabled and unreachable, run the start command and
  wait for the health URL until `RELAY_MODEL_START_TIMEOUT_MS` elapses.
- `markJobEnqueued()` — called by the job queue when a job is accepted.
  Cancels any pending idle-shutdown timer immediately.
- `markJobStarted(job)` — increments active count, cancels idle shutdown.
- `markJobFinished(job)` — decrements active count, resets idle timestamp.
- `maybeShutdownWhenIdle()` — schedules a deferred shutdown if everything is
  idle and a shutdown command is configured. The shutdown is cancelled if any
  new job arrives before it fires.
- `getLifecycleStatus()` — diagnostic snapshot exposed at `/relay/lifecycle`
  and embedded in `/relay/status`.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `RELAY_MODEL_LIFECYCLE_ENABLED` | `false` | Master switch. When `false`, all hooks are no-ops. |
| `RELAY_MODEL_START_COMMAND` | _unset_ | Shell command Relay runs to start the upstream (e.g. `llama-server …`). Treated as a secret: never logged verbatim. |
| `RELAY_MODEL_SHUTDOWN_COMMAND` | _unset_ | Shell command Relay runs to stop the upstream. Same redaction. |
| `RELAY_MODEL_HEALTH_URL` | _unset_ | Explicit health URL. Falls back to `UPSTREAM_BASE_URL/health` then `/v1/models`. |
| `RELAY_MODEL_IDLE_SHUTDOWN_MS` | `600000` | Idle period before shutdown is attempted. |
| `RELAY_MODEL_START_TIMEOUT_MS` | `120000` | Maximum time to wait for the upstream to become healthy after start. |

Legacy aliases `RELAY_LAZY_MODEL_ENABLED`, `LLAMA_START_COMMAND`,
`LLAMA_STOP_COMMAND`, and `LLAMA_IDLE_SHUTDOWN_SECONDS` are still honored.

## Behavior

When lifecycle is **disabled** (default):

- All lifecycle hooks are no-ops.
- `ensureModelAvailable()` only probes the upstream. If unreachable, jobs
  fail with `model_unavailable` and existing HTTP routes behave exactly as
  before.
- `/relay/lifecycle` reports `{ enabled: false, ... }`.

When lifecycle is **enabled**:

- On every job, Relay probes the upstream. If healthy, the job runs.
- If unreachable and `RELAY_MODEL_START_COMMAND` is set, Relay spawns it via
  the shell (detached, stdio ignored, unref'd) and polls the health URL.
- If the model becomes healthy before `RELAY_MODEL_START_TIMEOUT_MS`, the job
  proceeds. Otherwise the job fails with `model_start_timeout`.
- After the job finishes, Relay calls `maybeShutdownWhenIdle()`. If the queue
  is empty, no jobs are active, and `RELAY_MODEL_SHUTDOWN_COMMAND` is set, a
  timer is scheduled for `RELAY_MODEL_IDLE_SHUTDOWN_MS`.
- If a new job is enqueued before the timer fires, the timer is cancelled.
- When the timer fires, Relay re-checks that no jobs are active or queued and
  then runs the shutdown command.

## Status endpoint

`GET /relay/status` returns:

```jsonc
{
  "queue": { "pending": 0, "active": 0, "completedRecent": 0, "failedRecent": 0 },
  "lifecycle": {
    "enabled": true,
    "modelAvailable": true,
    "activeJobs": 0,
    "idleShutdownScheduled": false,
    "idleShutdownMs": 600000,
    "startCommandConfigured": true,
    "shutdownCommandConfigured": true,
    "healthUrlConfigured": false,
    "startTimeoutMs": 120000,
    "lastStartAt": "2026-05-17T…Z",
    "lastStopAt":  "2026-05-17T…Z",
    "lastError":   null
  }
}
```

Sensitive fields are intentionally absent:

- The raw `RELAY_MODEL_START_COMMAND` and `RELAY_MODEL_SHUTDOWN_COMMAND` are
  **never** included in the response. Only boolean `*_configured` flags are
  exposed.
- `lastError` is passed through a redactor that masks `api_key=…`,
  `token=…`, `secret=…`, `password=…`, and `Bearer …` fragments.

## Safe defaults

- Lifecycle is off unless explicitly enabled.
- No start or shutdown command runs unless explicitly configured.
- Idle shutdown is not scheduled when no shutdown command is configured.
- Streaming and non-streaming HTTP routes both call the lifecycle hooks, but
  if lifecycle is disabled the calls are cheap no-ops.

## Enabling idle shutdown

A minimal local config:

```sh
RELAY_MODEL_LIFECYCLE_ENABLED=true
RELAY_MODEL_START_COMMAND="llama-server -m /path/to/model.gguf -ngl 99 --port 8080"
RELAY_MODEL_SHUTDOWN_COMMAND="pkill -f 'llama-server.*--port 8080'"
RELAY_MODEL_HEALTH_URL=http://127.0.0.1:8080/health
RELAY_MODEL_IDLE_SHUTDOWN_MS=600000
RELAY_MODEL_START_TIMEOUT_MS=120000
```

Do not hardcode paths in code; configure them through env or your process
supervisor (systemd, launchd, docker compose, etc.).

## Production deployment checklist

This section captures the server-only setup required on temper-inference
for the Qwen3.6-35B-A3B lazy lifecycle. These paths and permissions are
**not** git-tracked \u2014 they live on the host filesystem.

### Required directories

```bash
# Model and template files (readable by relay user)
sudo mkdir -p /srv/llm/models/qwen3.6 /srv/llm/templates/qwen3.6
sudo chown -R root:relay /srv/llm
sudo chmod -R 750 /srv/llm

# Relay cache (writable by relay user)
sudo mkdir -p /var/cache/relay
sudo chown relay:relay /var/cache/relay
sudo chmod 750 /var/cache/relay
```

### Systemd override

`/etc/systemd/system/relay.service.d/override.conf`:

```ini
[Service]
Environment=XDG_CACHE_HOME=/var/cache/relay
ExecStopPost=-/usr/bin/pkill -u relay -f ^/usr/local/bin/llama-server
```

- `XDG_CACHE_HOME` ensures relay places its cache outside `/home`.
- `ExecStopPost=-` is non-fatal (the `-` prefix means systemd ignores
  non-zero exit). It kills any lingering llama-server child process when
  relay.service stops, freeing GPU VRAM.

### Environment variables (in /opt/relay/.env)

Key lifecycle vars for the Qwen model:

```sh
RELAY_MODEL_LIFECYCLE_ENABLED=true
RELAY_MODEL_IDLE_SHUTDOWN_MS=900000
RELAY_MODEL_START_TIMEOUT_MS=180000
RELAY_MODEL_HEALTH_URL=http://127.0.0.1:8080/health
RELAY_MODEL_START_ARGV=/usr/local/bin/llama-server,-m,/srv/llm/models/qwen3.6/Qwen3.6-35B-A3B-UD-IQ3_XXS.gguf,--host,127.0.0.1,--port,8080,-fa,--jinja,--chat-template,/srv/llm/templates/qwen3.6/chat_template.jinja,-ngl,99,--ctx-size,32768,--parallel,4,--batch-size,512,--ubatch-size,256,--no-webui
RELAY_MODEL_SHUTDOWN_ARGV=/usr/bin/pkill,-f,llama-server.*--port 8080
```

> **Note:** `RELAY_MODEL_START_ARGV` / `RELAY_MODEL_SHUTDOWN_ARGV` use
> comma-separated argv (no shell interpretation) and are preferred over
> the legacy `RELAY_MODEL_START_COMMAND` / `RELAY_MODEL_SHUTDOWN_COMMAND`.

### Smoke test

```bash
# Confirm idle state
curl -s http://127.0.0.1:1234/relay/lifecycle | python3 -m json.tool

# Cold-start request - IMPORTANT: use max_tokens >= 256 (preferably 512)
# Qwen reasoning mode can consume the entire token budget in reasoning_content,
# producing empty visible content. max_tokens:64 causes misleading
# upstream_bad_response when reasoning is active.
curl -s http://127.0.0.1:1234/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"auto","messages":[{"role":"user","content":"hello"}],"max_tokens":512}'

# Confirm lifecycle went to running
curl -s http://127.0.0.1:1234/relay/lifecycle | python3 -m json.tool

# Restart relay and verify VRAM returns to ~89 MB idle
sudo systemctl restart relay.service
curl -s http://127.0.0.1:1234/relay/lifecycle | python3 -m json.tool
```

### Rollback

To disable lazy lifecycle:

```bash
# Comment out or set to false in /opt/relay/.env:
# RELAY_MODEL_LIFECYCLE_ENABLED=false
sudo systemctl restart relay.service
# Start llama-server manually if needed
```

## Known limitations

- Relay does not track the PID of the upstream it spawned. The systemd
  ExecStopPost override ensures cleanup on service stop. Prefer
  process-supervisor integration (systemd unit, launchd plist, k8s probe) for
  production deployments.
- The current queue runs one job at a time. If you set
  `RELAY_MODEL_SHUTDOWN_COMMAND` but use the model heavily, the shutdown will
  rarely fire — which is the desired behavior, but worth noting.
- Streaming requests are not currently rerouted through the job queue. They
  call `ensureModelAvailable()` / lifecycle hooks indirectly through the
  upstream client path; full streaming-aware queueing is a future change.
- `RELAY_MODEL_START_COMMAND` and `RELAY_MODEL_SHUTDOWN_COMMAND` are executed
  through `spawn(..., { shell: true })`. They are treated as trusted operator
  configuration. Do not source them from untrusted input.
