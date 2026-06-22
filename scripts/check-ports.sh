#!/usr/bin/env bash
# check-ports.sh — Check port availability and identify orphan processes.
#
# Usage:
#   bash scripts/check-ports.sh              # check relay + upstream ports from .env
#   bash scripts/check-ports.sh --all        # all ports in 1234, 8080-8090 range
#   bash scripts/check-ports.sh --kill-orphans # kill leftover llama-server processes
#
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RELAY_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

MODE="default"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) MODE="all"; shift ;;
    --kill-orphans) MODE="kill"; shift ;;
    -h|--help) sed -n '2,/^$/{s/^# //p; /^$/q}' "$0"; exit 0 ;;
    *) shift ;;
  esac
done

echo -e "${CYAN}═══ Port & Process Check ═══${NC}"

# Read relay port from .env
RELAY_PORT=1234
UPSTREAM_PORT=8080
if [[ -f "$RELAY_DIR/.env" ]]; then
  RP=$(grep -oP '^PORT=\K\d+' "$RELAY_DIR/.env" | head -1 || true)
  UP=$(grep -oP 'UPSTREAM_BASE_URL=.*:(\d+)' "$RELAY_DIR/.env" | grep -oP ':\K\d+' | head -1 || true)
  [[ -n "$RP" ]] && RELAY_PORT="$RP"
  [[ -n "$UP" ]] && UPSTREAM_PORT="$UP"
fi

check_port() {
  local port=$1
  local label=$2
  local proc_info=""
  
  if command -v ss &>/dev/null; then
    proc_info=$(ss -tlnp 2>/dev/null | grep ":$port " || true)
  elif command -v lsof &>/dev/null; then
    proc_info=$(lsof -i ":$port" -sTCP:LISTEN 2>/dev/null || true)
  else
    echo -e "  ${YELLOW}⚠${NC} $label port $port: cannot check (no ss/lsof)"
    return
  fi

  if [[ -n "$proc_info" ]]; then
    local pid=$(echo "$proc_info" | grep -oP 'pid=\K\d+' | head -1 || echo "?")
    local proc_name=$(echo "$proc_info" | grep -oP 'users:\(\("\K[^"]+' | head -1 || ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
    echo -e "  ${RED}✗${NC} $label port $port: IN USE by PID $pid ($proc_name)"
    if [[ "$proc_name" == *"llama"* ]]; then
      echo -e "     → llama-server process. Kill: ${CYAN}fuser -k ${port}/tcp${NC}"
    fi
  else
    echo -e "  ${GREEN}✓${NC} $label port $port: free"
  fi
}

echo ""
echo "Key ports:"
check_port "$RELAY_PORT" "relay"
check_port "$UPSTREAM_PORT" "upstream "

# Check model ports (8081+)
if [[ "$MODE" == "all" ]]; then
  echo ""
  echo "Model ports (8081-8090):"
  for p in $(seq 8081 8090); do
    if command -v ss &>/dev/null; then
      info=$(ss -tlnp 2>/dev/null | grep ":$p " || true)
      if [[ -n "$info" ]]; then
        local pid=$(echo "$info" | grep -oP 'pid=\K\d+' | head -1 || echo "?")
        local name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "?")
        echo -e "  ${YELLOW}⚠${NC} port $p: PID $pid ($name)"
      fi
    fi
  done
fi

# Find orphan llama processes
echo ""
echo "Orphan processes (llama-server without relay):"
ORPHANS=$(ps aux 2>/dev/null | grep '[l]lama-server' | grep -v grep || true)
if [[ -n "$ORPHANS" ]]; then
  echo "$ORPHANS" | while read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    port=$(echo "$line" | grep -oP '\-\-port \K\d+' || echo "?")
    echo -e "  ${YELLOW}⚠${NC} PID $pid port=$port"
    echo "     $(echo "$line" | awk '{for(i=11;i<=NF;i++) printf $i" "}')"
  done
  
  if [[ "$MODE" == "kill" ]]; then
    echo ""
    echo -n "Kill all llama-server orphans? [y/N] "
    read -r answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
      for pid in $(ps aux | grep '[l]lama-server' | awk '{print $2}'); do
        echo "  Killing PID $pid..."
        kill "$pid" 2>/dev/null || true
      done
      echo -e "  ${GREEN}Done.${NC}"
    else
      echo "  Skipped."
    fi
  else
    echo -e "  → Run with ${CYAN}--kill-orphans${NC} to clean them up."
  fi
else
  echo -e "  ${GREEN}✓${NC} No orphan llama-server processes"
fi

echo ""
echo -e "Tip: Run ${CYAN}npm run doctor${NC} for a full connectivity check."
