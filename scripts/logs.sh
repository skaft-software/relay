#!/usr/bin/env bash
# logs.sh — Tail, filter, and inspect Relay logs.
#
# Usage:
#   bash scripts/logs.sh                    # tail all relay logs (stdout)
#   bash scripts/logs.sh --errors           # errors only
#   bash scripts/logs.sh --lifecycle        # lifecycle events only
#   bash scripts/logs.sh --model MODEL      # filter by model name
#   bash scripts/logs.sh --since 10m        # last 10 minutes
#   bash scripts/logs.sh --file /path/log   # specific log file
#
# If RELAY_LOG_FILE is set in .env, that file is used by default.
# Falls back to docker logs if running in Docker.

set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RELAY_DIR="$(dirname "$SCRIPT_DIR")"

MODE="all"
MODEL_FILTER=""
SINCE=""
LOG_FILE=""
FOLLOW=false

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --errors) MODE="errors"; shift ;;
    --lifecycle) MODE="lifecycle"; shift ;;
    --model) MODEL_FILTER="$2"; shift 2 ;;
    --since) SINCE="$2"; shift 2 ;;
    --file) LOG_FILE="$2"; shift 2 ;;
    -f|--follow) FOLLOW=true; shift ;;
    -h|--help)
      sed -n '2,/^$/{s/^# //p; /^$/q}' "$0"; exit 0 ;;
    *) shift ;;
  esac
done

# Resolve log source
if [[ -z "$LOG_FILE" ]]; then
  # Check .env for RELAY_LOG_FILE
  if [[ -f "$RELAY_DIR/.env" ]]; then
    LOG_FILE=$(grep -oP '^RELAY_LOG_FILE=\K.*' "$RELAY_DIR/.env" | tr -d '"' | tr -d "'" | head -1 || true)
  fi
  
  if [[ -z "$LOG_FILE" ]]; then
    # Fall back to docker logs
    if command -v docker &>/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q relay; then
      echo "=== Using docker logs (container: relay) ===" >&2
      DOCKER_ARGS=""
      $FOLLOW && DOCKER_ARGS="$DOCKER_ARGS -f"
      [[ -n "$SINCE" ]] && DOCKER_ARGS="$DOCKER_ARGS --since $SINCE"
      exec docker logs $DOCKER_ARGS relay 2>&1
    fi
    
    # Check systemd journal
    if command -v journalctl &>/dev/null && systemctl is-active --quiet relay 2>/dev/null; then
      echo "=== Using journalctl (unit: relay) ===" >&2
      JCTL_ARGS="-u relay --no-pager"
      $FOLLOW && JCTL_ARGS="$JCTL_ARGS -f"
      [[ -n "$SINCE" ]] && JCTL_ARGS="$JCTL_ARGS --since $SINCE"
      exec journalctl $JCTL_ARGS
    fi
    
    echo "No log source found. Set RELAY_LOG_FILE in .env or run in Docker/systemd." >&2
    echo "Tip: add RELAY_LOG_FILE=./relay.log to your .env file." >&2
    exit 1
  fi
fi

if [[ ! -f "$LOG_FILE" ]]; then
  echo "Log file not found: $LOG_FILE" >&2
  exit 1
fi

echo "=== $LOG_FILE ===" >&2

# Build filter
FILTER_CMD="cat"
case "$MODE" in
  errors) FILTER_CMD="grep -iE '\"level\":\"error\"|\"level\":\"warn\"'" ;;
  lifecycle) FILTER_CMD="grep -i 'lifecycle'" ;;
esac

if [[ -n "$MODEL_FILTER" ]]; then
  FILTER_CMD="$FILTER_CMD | grep -i '$MODEL_FILTER'"
fi

TAIL_CMD="cat"
if $FOLLOW; then
  TAIL_CMD="tail -f"
elif [[ -n "$SINCE" ]]; then
  # approximate: show last N lines based on typical rate
  echo "Tip: --since uses approximate line count for file logs" >&2
fi

if $FOLLOW; then
  eval "tail -f '$LOG_FILE' | $FILTER_CMD"
else
  eval "cat '$LOG_FILE' | $FILTER_CMD"
fi
