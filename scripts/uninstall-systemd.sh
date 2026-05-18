#!/usr/bin/env bash
set -euo pipefail

ENV_DIR="/etc/relay"
SYSTEMD_DIR="/etc/systemd/system"
REMOVE_ENV=0

for arg in "$@"; do
  case "$arg" in
    --remove-env)
      REMOVE_ENV=1
      ;;
    -h|--help)
      echo "Usage: $0 [--remove-env]"
      echo "Stops/disables Relay systemd services and removes service files."
      echo "Environment files under $ENV_DIR are kept unless --remove-env is passed."
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--remove-env]"
      exit 1
      ;;
  esac
done

echo "Relay systemd uninstaller"
echo "This script removes service files under $SYSTEMD_DIR and reloads systemd."

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Refusing to continue: run this script as root after reviewing it."
  echo "Example: sudo $0"
  exit 1
fi

for service in relay.service llama-server.service; do
  if systemctl list-unit-files "$service" >/dev/null 2>&1; then
    echo "+ systemctl disable --now $service"
    systemctl disable --now "$service" || true
  else
    echo "= $service is not installed"
  fi
done

for service_file in "$SYSTEMD_DIR/relay.service" "$SYSTEMD_DIR/llama-server.service"; do
  if [[ -f "$service_file" ]]; then
    echo "+ rm -f $service_file"
    rm -f "$service_file"
  else
    echo "= $service_file does not exist"
  fi
done

if [[ "$REMOVE_ENV" -eq 1 ]]; then
  for env_file in "$ENV_DIR/relay.env" "$ENV_DIR/llama.env"; do
    if [[ -f "$env_file" ]]; then
      echo "+ rm -f $env_file"
      rm -f "$env_file"
    else
      echo "= $env_file does not exist"
    fi
  done
else
  echo "= keeping $ENV_DIR/relay.env and $ENV_DIR/llama.env"
fi

echo "+ systemctl daemon-reload"
systemctl daemon-reload
