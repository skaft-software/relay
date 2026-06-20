#!/usr/bin/env bash
# setup-model.sh — Size a GGUF model for the current hardware and wire it into relay.
#
# This script:
#   1. Runs size-model.py to compute optimal --ctx-size and expert offload
#   2. Generates a systemd unit to run llama-server standalone
#   3. Outputs a relay modelEntry JSON snippet for RELAY_MODEL_MAP
#   4. Optionally generates a start-llama-*.sh script
#
# Usage:
#   ./scripts/setup-model.sh /path/to/model.gguf [--draft /path/to/draft.gguf] [--install] [--relay-env]
#
# Options:
#   --draft <path>     MTP draft model (gemma4-assistant etc.)
#   --install           Copy systemd unit to /etc/systemd/system/ and enable
#   --relay-env         Print the RELAY_MODEL_MAP JSON snippet to stdout
#   --dry-run           Compute but don't write any files
#   --verify            Load the model briefly with llama-server to check VRAM usage
#   --name <name>       Override model display name (default: derived from filename)
#   --port <port>       Fixed port for this model (default: dynamic/unset)
#   --multimodal        Mark model as vision-capable in relay config
#   --thinking          Comma-separated thinking levels (e.g. "on,off")
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
SIZE_MODEL="$SCRIPT_DIR/size-model.py"
DEPLOY_DIR="$REPO_ROOT/deploy"
MODELS_DIR="$HOME/models/unsloth"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  cat <<'EOF'
setup-model.sh — Wire a GGUF model into relay with optimal settings.

Usage: setup-model.sh <model.gguf> [--draft <draft.gguf>] [options]

Options:
  --draft <path>       MTP draft model path
  --install            Install systemd unit (requires sudo)
  --relay-env          Print RELAY_MODEL_MAP JSON snippet
  --dry-run            Compute but write nothing
  --verify             Load model briefly to verify VRAM prediction
  --name <name>        Display name for the model
  --port <port>        Fixed upstream port
  --multimodal         Mark as vision-capable
  --thinking <levels>  Thinking levels (e.g. "on,off")
EOF
  exit 0
}

# ── Parse args ────────────────────────────────────────────────────────
MODEL=""
DRAFT=""
DO_INSTALL=false
DO_RELAY_ENV=false
DRY_RUN=false
DO_VERIFY=false
MODEL_NAME=""
MODEL_PORT=""
MULTIMODAL=false
THINKING_LEVELS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) DRAFT="$2"; shift 2 ;;
    --install) DO_INSTALL=true; shift ;;
    --relay-env) DO_RELAY_ENV=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --verify) DO_VERIFY=true; shift ;;
    --name) MODEL_NAME="$2"; shift 2 ;;
    --port) MODEL_PORT="$2"; shift 2 ;;
    --multimodal) MULTIMODAL=true; shift ;;
    --thinking) THINKING_LEVELS="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) 
      if [[ -z "$MODEL" ]]; then MODEL="$1"
      else echo -e "${RED}Unexpected arg: $1${NC}" >&2; exit 1
      fi
      shift ;;
  esac
done

if [[ -z "$MODEL" ]]; then usage; fi
if [[ ! -f "$MODEL" ]]; then echo -e "${RED}Model not found: $MODEL${NC}" >&2; exit 1; fi

# ── Resolve paths ─────────────────────────────────────────────────────
MODEL_REAL="$(realpath "$MODEL")"
MODEL_BASENAME="$(basename "$MODEL_REAL")"
MODEL_SLUG="${MODEL_BASENAME%.*}"  # strip .gguf

if [[ -z "$MODEL_NAME" ]]; then
  MODEL_NAME="$MODEL_SLUG"
fi

# ── Run size-model.py ──────────────────────────────────────────────────
echo -e "${CYAN}═══ Computing optimal settings for $MODEL_BASENAME ═══${NC}"

SIZE_ARGS=("$MODEL_REAL")
if [[ -n "$DRAFT" ]]; then
  if [[ ! -f "$DRAFT" ]]; then echo -e "${RED}Draft not found: $DRAFT${NC}" >&2; exit 1; fi
  SIZE_ARGS+=(--draft "$DRAFT")
fi
if $DO_VERIFY; then
  SIZE_ARGS+=(--verify)
fi

# Capture size-model.py output for parsing
SIZE_OUTPUT="$(python3 "$SIZE_MODEL" "${SIZE_ARGS[@]}" 2>&1)"
SIZE_RC=$?

echo "$SIZE_OUTPUT"

if [[ $SIZE_RC -ne 0 ]]; then
  echo -e "${RED}size-model.py failed${NC}" >&2
  exit $SIZE_RC
fi

# ── Parse results ──────────────────────────────────────────────────────
CTX_SIZE=$(echo "$SIZE_OUTPUT" | grep -oP 'max_ctx=\K\d+' | head -1)
CPU_MOE=$(echo "$SIZE_OUTPUT" | grep -oPe '--cpu-moe' | head -1 || true)
N_CPU_MOE=$(echo "$SIZE_OUTPUT" | grep -oPe 'n-cpu-moe \K\d+' | head -1 || true)
TRAIN_CTX=$(echo "$SIZE_OUTPUT" | grep -oP 'train_ctx=\K\d+' | head -1)

if [[ -z "$CTX_SIZE" ]]; then
  echo -e "${RED}Failed to parse ctx_size from size-model.py output${NC}" >&2
  exit 1
fi

echo ""
echo -e "${GREEN}═══ Result: ctx_size=$CTX_SIZE${NC}"

# Build the moe flag
MOE_FLAG=""
if [[ -n "$CPU_MOE" ]]; then
  MOE_FLAG="--cpu-moe"
  echo -e "${GREEN}  experts: --cpu-moe${NC}"
elif [[ -n "$N_CPU_MOE" ]]; then
  MOE_FLAG="--n-cpu-moe $N_CPU_MOE"
  echo -e "${GREEN}  experts: --n-cpu-moe $N_CPU_MOE${NC}"
else
  echo -e "${GREEN}  experts: all GPU${NC}"
fi

# ── Output paths ───────────────────────────────────────────────────────
SYSTEMD_UNIT="$DEPLOY_DIR/llama-${MODEL_SLUG}.service"
START_SCRIPT="$HOME/start-llama-${MODEL_SLUG}.sh"

# ── Generate systemd unit ──────────────────────────────────────────────
generate_systemd() {
  local svc_name="llama-${MODEL_SLUG}"

  cat > "$SYSTEMD_UNIT" <<UNIT
[Unit]
Description=llama.cpp — ${MODEL_NAME} (ctx=${CTX_SIZE})
After=network.target

[Service]
Type=simple
User=${USER}
Group=${USER}
WorkingDirectory=${HOME}/llama.cpp
EnvironmentFile=-/etc/relay/llama.env
ExecStart=${HOME}/llama.cpp/build-vulkan/bin/llama-server \\
  --model ${MODEL_REAL} \\
  --host 127.0.0.1 \\
  --port \${LLAMA_PORT:-8080} \\
  --ctx-size ${CTX_SIZE} \\
  -ngl 999 \\
  --parallel 1 \\
  --flash-attn on \\
  --cache-type-k q4_0 \\
  --cache-type-v q4_0 \\
  --cache-prompt \\
  --cache-ram 8192 \\
  --cache-idle-slots \\
  --cache-reuse 256 \\
  --slot-prompt-similarity 0.98
UNIT

  # Add expert offload
  if [[ -n "$CPU_MOE" ]]; then
    echo "  --cpu-moe \\" >> "$SYSTEMD_UNIT"
  elif [[ -n "$N_CPU_MOE" ]]; then
    echo "  --n-cpu-moe $N_CPU_MOE \\" >> "$SYSTEMD_UNIT"
  fi

  # Add draft model
  if [[ -n "$DRAFT" ]]; then
    echo "  --model-draft $(realpath "$DRAFT") \\" >> "$SYSTEMD_UNIT"
  fi

  # Close ExecStart and add service metadata
  cat >> "$SYSTEMD_UNIT" <<UNIT

Restart=on-failure
RestartSec=5
NoNewPrivileges=false
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT

  echo -e "${GREEN}  Systemd unit: ${SYSTEMD_UNIT}${NC}"
}

# ── Generate start script ──────────────────────────────────────────────
generate_start_script() {
  cat > "$START_SCRIPT" <<SCRIPT
#!/bin/bash
# Generated by setup-model.sh — ${MODEL_NAME}
# ctx_size=${CTX_SIZE}  train_ctx=${TRAIN_CTX}
cd ${HOME}/llama.cpp
exec ./build-vulkan/bin/llama-server \\
  --model ${MODEL_REAL} \\
  --host 127.0.0.1 \\
  --port \${LLAMA_PORT:-8080} \\
  --ctx-size ${CTX_SIZE} \\
  -ngl 999 \\
  --parallel 1 \\
  --flash-attn on \\
  --cache-type-k q4_0 \\
  --cache-type-v q4_0 \\
  --cache-prompt \\
  --cache-ram 8192 \\
  --cache-idle-slots \\
  --cache-reuse 256 \\
  --slot-prompt-similarity 0.98
SCRIPT

  if [[ -n "$CPU_MOE" ]]; then
    echo "  --cpu-moe \\" >> "$START_SCRIPT"
  elif [[ -n "$N_CPU_MOE" ]]; then
    echo "  --n-cpu-moe $N_CPU_MOE \\" >> "$START_SCRIPT"
  fi
  if [[ -n "$DRAFT" ]]; then
    echo "  --model-draft $(realpath "$DRAFT") \\" >> "$START_SCRIPT"
  fi
  echo "  2>&1" >> "$START_SCRIPT"

  chmod +x "$START_SCRIPT"
  echo -e "${GREEN}  Start script: ${START_SCRIPT}${NC}"
}

# ── Generate relay modelEntry JSON ─────────────────────────────────────
generate_relay_entry() {
  local entry_name="${MODEL_NAME}"
  # Build the start command
  local cmd="${HOME}/start-llama-${MODEL_SLUG}.sh"
  
  echo ""
  echo -e "${CYAN}═══ RELAY_MODEL_MAP entry ═══${NC}"
  echo 'Add this to your relay.env RELAY_MODEL_MAP JSON:'
  echo ""

  # Build JSON manually
  local json_entry="{\"cmd\":\"${cmd}\",\"ctx_size\":${CTX_SIZE}"
  if $MULTIMODAL; then
    json_entry+=",\"multimodal\":true"
  fi
  if [[ -n "$MODEL_PORT" ]]; then
    json_entry+=",\"port\":${MODEL_PORT}"
  fi
  if [[ -n "$THINKING_LEVELS" ]]; then
    # Convert comma-separated to JSON array
    local levels_json="["
    local IFS=,
    for level in $THINKING_LEVELS; do
      levels_json+="\"$level\","
    done
    levels_json="${levels_json%,}]"
    json_entry+=",\"thinking_levels\":${levels_json}"
  fi
  json_entry+="}"

  echo "  \"${entry_name}\": ${json_entry}"
  echo ""

  # Full RELAY_MODEL_MAP example
  echo -e "${YELLOW}Example RELAY_MODEL_MAP (merge with existing entries):${NC}"
  echo "  RELAY_MODEL_MAP='{\"${entry_name}\": ${json_entry}}'"
  echo ""
}

# ── Execute ────────────────────────────────────────────────────────────
if $DRY_RUN; then
  echo -e "${YELLOW}Dry run — no files written${NC}"
else
  generate_systemd
  generate_start_script
fi

if $DO_RELAY_ENV; then
  generate_relay_entry
fi

# ── Install ────────────────────────────────────────────────────────────
if $DO_INSTALL; then
  SVC_NAME="llama-${MODEL_SLUG}"
  
  if [[ "$(id -u)" -ne 0 ]]; then
    echo -e "${YELLOW}Re-running with sudo for install...${NC}"
    exec sudo bash "$0" "$@"
  fi

  echo -e "${CYAN}═══ Installing systemd unit ═══${NC}"
  cp "$SYSTEMD_UNIT" "/etc/systemd/system/${SVC_NAME}.service"
  systemctl daemon-reload
  echo -e "${GREEN}  Installed: /etc/systemd/system/${SVC_NAME}.service${NC}"
  echo ""
  echo -e "${YELLOW}To enable and start:${NC}"
  echo "  sudo systemctl enable --now ${SVC_NAME}.service"
  echo ""
  echo -e "${YELLOW}To stop the currently running llama-server first:${NC}"
  echo "  sudo systemctl stop llama-server.service"
  echo "  sudo systemctl disable llama-server.service"
fi

echo ""
echo -e "${GREEN}═══ Done ═══${NC}"
