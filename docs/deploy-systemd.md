# systemd Deployment

This page documents a repo-provided systemd deployment for Relay and llama.cpp. Nothing in this repository touches `/etc` or systemd unless you manually run the helper scripts.

The scripts are examples for a single-machine install where:

- Relay runs from `/opt/relay` as the `relay` user.
- Relay listens on `127.0.0.1:1234`.
- llama.cpp `llama-server` listens on `127.0.0.1:8080`.
- Environment files live in `/etc/relay`.
- Unit files live in `/etc/systemd/system`.

## Install Flow

Review the files first:

```sh
sed -n '1,220p' scripts/install-systemd.sh
sed -n '1,220p' deploy/relay.service.example
sed -n '1,220p' deploy/llama-server.service.example
```

Prepare the app location and user. Adjust paths if your system uses different Node or llama.cpp locations:

```sh
sudo useradd --system --home /opt/relay --shell /usr/sbin/nologin relay
sudo mkdir -p /opt/relay
sudo cp -R . /opt/relay
sudo chown -R relay:relay /opt/relay
```

Install the example units and environment files:

```sh
sudo /opt/relay/scripts/install-systemd.sh
```

Edit the environment files before starting services:

```sh
sudo editor /etc/relay/llama.env
sudo editor /etc/relay/relay.env
```

Enable and start the services:

```sh
sudo systemctl enable --now llama-server.service
sudo systemctl enable --now relay.service
```

## Required Environment

`/etc/relay/relay.env` is copied from `deploy/relay.env.example` if it does not already exist.

Required Relay values:

- `HOST=127.0.0.1`
- `PORT=1234`
- `UPSTREAM_BASE_URL=http://127.0.0.1:8080`
- `REQUEST_TIMEOUT_SECONDS=600`
- `MAX_REQUEST_BODY_BYTES=1048576`
- `LOG_LEVEL=info`

Optional Relay values:

- `DEFAULT_MODEL=` can provide a fallback model id when upstream model discovery fails.
- `API_KEY=` enables local API-key enforcement when set.

`/etc/relay/llama.env` is copied from `deploy/llama.env.example` if it does not already exist.

Required llama.cpp values:

- `LLAMA_MODEL=/path/to/model.gguf`
- `LLAMA_HOST=127.0.0.1`
- `LLAMA_PORT=8080`

Optional llama.cpp values:

- `LLAMA_EXTRA_ARGS=` can hold additional `llama-server` flags.

## llama.cpp Assumptions

The `llama-server.service` example assumes a llama.cpp build has installed `llama-server` at `/usr/local/bin/llama-server`, the configured model path is readable by the `relay` user, and the OpenAI-compatible HTTP server is available on `127.0.0.1:8080`. Edit the service example before installation if your binary lives elsewhere.

## Relay Assumptions

The `relay.service` example assumes the repository has been copied to `/opt/relay`, dependencies are available there, and `/usr/bin/npm start` runs the gateway. The service reads `/etc/relay/relay.env` and does not load the repo-local `.env` file.

## Health Checks

Use the read-only check script:

```sh
./scripts/check-systemd.sh
```

Or run the individual checks:

```sh
systemctl status llama-server.service
systemctl status relay.service
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:1234/health
curl http://127.0.0.1:1234/v1/models
```

Override check URLs when needed:

```sh
RELAY_URL=http://127.0.0.1:1234 LLAMA_URL=http://127.0.0.1:8080 ./scripts/check-systemd.sh
```

## Debugging Logs

Follow logs while starting services:

```sh
journalctl -u llama-server.service -f
journalctl -u relay.service -f
```

Print recent logs without following:

```sh
journalctl -u llama-server.service -n 200 --no-pager
journalctl -u relay.service -n 200 --no-pager
```

## GPU Access (Vulkan / ROCm)

When running llama-server with GPU acceleration on AMD hardware:

```ini
# /etc/systemd/system/relay.service.d/override.conf (or inline in the unit)
[Service]
DeviceAllow=/dev/dri/renderD128 rw
DeviceAllow=/dev/kfd rw
```

If models are stored outside `/opt` (e.g. `/home/user/models`) and
`ProtectHome=yes` is active, add a read-only bind mount so the `relay` user
can spawn llama-server with the GGUF files:

```ini
BindReadOnlyPaths=/home/user/models:/srv/llm/models
```

For lazy lifecycle, also add a cleanup hook so systemd kills any lingering
llama-server when relay stops:

```ini
ExecStopPost=-/usr/bin/pkill -9 -u relay -f '^/usr/local/bin/llama-server'
```

## Uninstall Flow

Review the uninstall script:

```sh
sed -n '1,220p' scripts/uninstall-systemd.sh
```

Remove services and reload systemd. Environment files are kept:

```sh
sudo /opt/relay/scripts/uninstall-systemd.sh
```

Remove services and environment files:

```sh
sudo /opt/relay/scripts/uninstall-systemd.sh --remove-env
```
