#!/bin/sh
# Relay one-line installer — Docker required
# curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/install.sh | sh

set -e

REPO="https://github.com/achuthanmukundan00/relay.git"
DIR="$HOME/relay"

echo ""
echo "  Relay Gateway Installer"
echo "  ----------------------"
echo ""

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "  Error: Docker is not installed."
  echo "  Install: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "  Error: Docker daemon is not running."
  echo "  Start Docker and retry."
  exit 1
fi

# Clone or update
if [ -d "$DIR" ]; then
  echo "  Updating existing Relay at $DIR..."
  cd "$DIR"
  git pull --ff-only origin main 2>/dev/null || true
else
  echo "  Cloning Relay to $DIR..."
  git clone "$REPO" "$DIR"
  cd "$DIR"
fi

# Setup env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example — edit this file to configure models."
fi

# Build and start
echo "  Building Docker image..."
docker compose build --quiet 2>/dev/null || docker compose build

echo "  Starting Relay..."
docker compose up -d

sleep 2

# Verify
if curl -s --max-time 3 http://127.0.0.1:1234/health >/dev/null 2>&1; then
  echo ""
  echo "  Relay is running!"
  echo "  Health:  http://127.0.0.1:1234/health"
  echo "  Models:  http://127.0.0.1:1234/v1/models"
  echo "  Status:  http://127.0.0.1:1234/relay/status"
  echo ""
  echo "  Edit $DIR/.env to configure models, then:"
  echo "    cd $DIR && docker compose restart"
  echo ""
else
  echo ""
  echo "  Relay may still be starting. Check logs:"
  echo "    cd $DIR && docker compose logs -f"
  echo ""
fi
