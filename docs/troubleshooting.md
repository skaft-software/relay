# Troubleshooting

## Relay Doesn't Start

- **Node.js version**: Relay needs Node.js 22+. Check with `node -v`.
- **Port conflict**: Something else on port 1234? Change `PORT` in `.env`.
- **Docker permissions**: `docker compose up -d` needs Docker running and the user in the `docker` group.

## Model Won't Start

- **Check the start script**: The wizard generates `start-scripts/start-<model>.sh`. Run it directly: `bash start-scripts/start-qwen3.6-35b-a3b.sh`. Does it error?
- **llama.cpp binary**: Is `llama-server` at the path in the script? If you moved it, re-run `python3 scripts/setup-tui.py --auto`.
- **GGUF path**: Is the model file at the path in the script? Check with `ls -la`.
- **VRAM**: Does the model fit? Check `nvidia-smi` or `rocm-smi`. The wizard adds headroom, but very large contexts can still exceed.
- **Port conflict**: Is something on the allocated port (8081+)? Kill it: `fuser -k 8081/tcp`.

## Request Fails / 502

- **Upstream not reachable**: Is llama-server running? Check `docker logs relay` for errors.
- **Model not in map**: Is the model name in `RELAY_MODEL_MAP`? Check `/v1/models`.
- **Timeout**: Long model startup? Increase `RELAY_MODEL_START_TIMEOUT_MS` (default 2 minutes).

## Streaming Issues

- **Agent client errors on stream chunks**: Some older clients don't handle empty `choices: []` in lifecycle events. This is fixed in current Relay (dummy choices emitted).
- **Missing events**: If your client expects specific SSE event types, check the [API Compatibility](api-compatibility.md) doc for the exact event sequence.

## Wrong Context Window

- **Agent thinks context is smaller/larger than expected**: Relay exposes `ctx_size` from `RELAY_MODEL_MAP`. Re-run `python3 scripts/setup-tui.py --auto` to regenerate with correct sizes from your GGUF files.

## Session / Context Confusion

- **Conversation state leaking between projects**: Send a `session-id` header. Relay restarts the model when the session ID changes.
- **Model restarting too often**: Each unique `session-id` triggers a restart. Use the same session ID across related requests in the same project.

## Docker-Specific

- **Can't access GPU**: Ensure `/dev/dri` is mounted. For NVIDIA, you may need `nvidia-container-toolkit`.
- **Start scripts not found**: The compose file mounts start-scripts from the path in `SCRIPTS_DIR`. Check the volume mount in `docker-compose.yml`.
- **Orphan containers**: `docker compose down --remove-orphans` cleans up old containers.

## Regenerate Config

```bash
# Backup existing config
cp .env .env.bak

# Regenerate everything
python3 scripts/setup-tui.py --auto

# Restart
docker compose down && docker compose up -d
```

Your model files (`~/models/`) are never touched. Only configs and start scripts are regenerated.
