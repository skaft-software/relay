# Agents and Client Compatibility

Relay is designed for local-agent workflows where tools expect hosted API shapes.

## Quick Connect

After setup, point any OpenAI/Anthropic-compatible agent at:

```
Base URL: http://127.0.0.1:1234/v1
API Key:  (leave blank unless API_KEY is set in .env)
Model:    any model from /v1/models
```

## Tested Clients

Relay works with any client that allows custom base URLs and model IDs:

- **opencode** — set `provider.base_url` to `http://127.0.0.1:1234/v1`
- **Cursor** — add as custom OpenAI-compatible provider
- **Claude Code** — use `ANTHROPIC_BASE_URL=http://127.0.0.1:1234/v1`
- **Continue** — add as OpenAI-compatible provider in config
- **Aider** — `--openai-api-base http://127.0.0.1:1234/v1`

## Session Affinity

For multi-project setups, use the `session-id` header to keep conversations isolated:

```bash
# Project A
curl -H "session-id: project-alpha" http://127.0.0.1:1234/v1/chat/completions ...

# Project B — Relay restarts the model to clear context
curl -H "session-id: project-beta" http://127.0.0.1:1234/v1/chat/completions ...
```

## Public Sharing

See [Public Deployment](deploy-public.md) to share your relay with friends over HTTPS.

## Known Limits

- Relay does not implement hosted platform orchestration (assistants, threads, runs)
- Non-function tools (web search, code interpreter) are stripped
- See [API Compatibility](api-compatibility.md) for full endpoint support
