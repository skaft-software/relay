#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_DIR="/etc/relay"
SYSTEMD_DIR="/etc/systemd/system"

required_files=(
  "$REPO_ROOT/deploy/relay.service.example"
  "$REPO_ROOT/deploy/llama-server.service.example"
  "$REPO_ROOT/deploy/relay.env.example"
  "$REPO_ROOT/deploy/llama.env.example"
)

echo "Relay systemd installer"
echo "Repo: $REPO_ROOT"
echo "This script creates files under $ENV_DIR and $SYSTEMD_DIR, then reloads systemd."

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Refusing to continue: run this script as root after reviewing it."
  echo "Example: sudo $0"
  exit 1
fi

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

echo "+ mkdir -p $ENV_DIR"
mkdir -p "$ENV_DIR"

if [[ ! -f "$ENV_DIR/relay.env" ]]; then
  echo "+ cp $REPO_ROOT/deploy/relay.env.example $ENV_DIR/relay.env"
  cp "$REPO_ROOT/deploy/relay.env.example" "$ENV_DIR/relay.env"
else
  echo "= keeping existing $ENV_DIR/relay.env"
fi

if [[ ! -f "$ENV_DIR/llama.env" ]]; then
  echo "+ cp $REPO_ROOT/deploy/llama.env.example $ENV_DIR/llama.env"
  cp "$REPO_ROOT/deploy/llama.env.example" "$ENV_DIR/llama.env"
else
  echo "= keeping existing $ENV_DIR/llama.env"
fi

echo "+ cp $REPO_ROOT/deploy/relay.service.example $SYSTEMD_DIR/relay.service"
cp "$REPO_ROOT/deploy/relay.service.example" "$SYSTEMD_DIR/relay.service"

echo "+ cp $REPO_ROOT/deploy/llama-server.service.example $SYSTEMD_DIR/llama-server.service"
cp "$REPO_ROOT/deploy/llama-server.service.example" "$SYSTEMD_DIR/llama-server.service"

echo "+ systemctl daemon-reload"
systemctl daemon-reload

cat <<'NEXT'

Next commands to run after editing the environment files:
  sudo editor /etc/relay/llama.env
  sudo editor /etc/relay/relay.env
  sudo systemctl enable --now llama-server.service
  sudo systemctl enable --now relay.service
  ./scripts/check-systemd.sh
NEXT
