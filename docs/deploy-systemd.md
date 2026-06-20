# Deployment

Relay runs in Docker. The setup wizard generates `docker-compose.yml` for you.

## Docker Compose (Recommended)

```bash
docker compose up -d
```

The generated compose file uses:
- `network_mode: host` — direct access to localhost model servers
- `pid: host` — ability to spawn and manage model processes
- GPU device passthrough (`/dev/dri`) when available

## Bare Metal

```bash
npm start
```

Requires Node.js 22+. Reads configuration from `.env`.

## Background Service (systemd)

For always-on deployment on a Linux server:

```ini
# /etc/systemd/system/relay.service
[Unit]
Description=Relay model gateway
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/home/achu/relay
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now relay
```

## Updating

```bash
cd ~/relay
git pull
docker compose down
docker compose up -d --build
```

To regenerate model configs after adding new GGUF files:

```bash
python3 scripts/setup-tui.py --auto
docker compose restart
```
