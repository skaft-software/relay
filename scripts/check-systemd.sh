#!/usr/bin/env bash
set -euo pipefail

RELAY_URL="${RELAY_URL:-http://127.0.0.1:1234}"
LLAMA_URL="${LLAMA_URL:-http://127.0.0.1:8080}"

echo "Relay systemd check"
echo "This script reads service status, health endpoints, and recent logs only."

for service in llama-server.service relay.service; do
  echo
  echo "+ systemctl status --no-pager $service"
  systemctl status --no-pager "$service" || true
done

echo
echo "+ curl -fsS $LLAMA_URL/health"
curl -fsS "$LLAMA_URL/health" || true

echo
echo "+ curl -fsS $RELAY_URL/health"
curl -fsS "$RELAY_URL/health" || true

echo
echo "+ curl -fsS $RELAY_URL/v1/models"
curl -fsS "$RELAY_URL/v1/models" || true

for service in llama-server.service relay.service; do
  echo
  echo "+ journalctl -u $service -n 80 --no-pager"
  journalctl -u "$service" -n 80 --no-pager || true
done
