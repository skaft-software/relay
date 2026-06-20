# Public Deployment

Share your local GPU with friends by exposing Relay behind HTTPS.

## Cloudflare Tunnel (Recommended)

The Docker compose file includes an optional Cloudflare Tunnel sidecar:

```bash
docker compose --profile public up -d
```

This creates a `https://your-tunnel.trycloudflare.com` endpoint with automatic TLS. No port forwarding, no domain registration, no certificates to manage.

Add `?access_token=...` or use Cloudflare Access for auth.

## Reverse Proxy (nginx / caddy)

Point your reverse proxy at `http://127.0.0.1:1234`:

```nginx
# nginx
server {
    listen 443 ssl;
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 600s;  # long-lived SSE streams
    }
}
```

```caddy
# Caddy (auto-TLS)
ai.yourdomain.com {
    reverse_proxy 127.0.0.1:1234
}
```

## Security Notes

- Set `API_KEY` in `.env` if exposing to the internet. All requests will require `Authorization: Bearer <key>`.
- Rate limiting is per-key — each friend's API token gets its own bucket.
- Models start on-demand and unload when idle, so your GPU stays free when not in use.
- Session-aware context clearing prevents conversation state from leaking between users.

## Multi-User Setup

Each friend adds your relay URL as a separate provider in their agent config. They don't need to know about each other — Relay isolates sessions by `session-id` header and API key.
