#!/usr/bin/env bash
# verify-runtime.sh — Empirically test that a model doesn't OOM at computed ctx.
#
# Launches llama-server, fills KV cache incrementally, monitors VRAM.
# Reports peak VRAM vs prediction.
#
# Usage:
#   ./verify-runtime.sh /path/to/model.gguf [--ctx-size N] [--step N]
#   ./verify-runtime.sh --from-script /path/to/start-llama-*.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SIZE_MODEL="$SCRIPT_DIR/size-model.py"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
GB=1073741824
MB=1048576

# ── VRAM helpers ────────────────────────────────────────────────────────
get_vram_used() {
  python3 -c "
import subprocess, re
try:
    out = subprocess.check_output(['rocm-smi','--showmeminfo','vram'], stderr=subprocess.DEVNULL, text=True, timeout=10)
    m = re.search(r'VRAM Total Used Memory \(B\):\s*(\d+)', out)
    if m: print(int(m.group(1)))
    else: print(0)
except: print(0)
" 2>/dev/null || echo 0
}

get_vram_total() {
  python3 -c "
import subprocess, re
try:
    out = subprocess.check_output(['rocm-smi','--showmeminfo','vram'], stderr=subprocess.DEVNULL, text=True, timeout=10)
    m = re.search(r'VRAM Total Memory \(B\):\s*(\d+)', out)
    if m: print(int(m.group(1)))
    else: print(17179869184)
except: print(17179869184)
" 2>/dev/null || echo 17179869184
}

fmt_gb() { python3 -c "print(f'{$1 / $GB:.2f}')" 2>/dev/null || echo "?"; }
fmt_mb() { echo $(($1 / MB)); }

# ── Defaults ───────────────────────────────────────────────────────────
MODEL=""; DRAFT=""; CTX_SIZE=""; N_CPU_MOE=""; CPU_MOE=false
FROM_SCRIPT=""; PORT=""; STEP=32768; MAX_CTX=""; TIMEOUT=60; LAUNCH_TIMEOUT=120
LLAMA_SERVER="$HOME/llama.cpp/build-vulkan/bin/llama-server"
N_GPU_LAYERS=999

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft) DRAFT="$2"; shift 2 ;;
    --n-cpu-moe) N_CPU_MOE="$2"; shift 2 ;;
    --cpu-moe) CPU_MOE=true; shift ;;
    --ctx-size) CTX_SIZE="$2"; shift 2 ;;
    --step) STEP="$2"; shift 2 ;;
    --max-ctx) MAX_CTX="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --ngl) N_GPU_LAYERS="$2"; shift 2 ;;
    --from-script) FROM_SCRIPT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,/^$/{s/^# //p; /^$/q}' "$0"; exit 0 ;;
    *)
      if [[ -z "$MODEL" ]]; then MODEL="$1"; else echo -e "${RED}Unknown: $1${NC}" >&2; exit 1; fi
      shift ;;
  esac
done

# ── Parse from start script ────────────────────────────────────────────
if [[ -n "$FROM_SCRIPT" ]]; then
  [[ ! -f "$FROM_SCRIPT" ]] && { echo -e "${RED}Not found: $FROM_SCRIPT${NC}" >&2; exit 1; }
  MODEL=$(grep -oP -- '--model \K\S+' "$FROM_SCRIPT" | head -1 || true)
  CTX_SIZE=$(grep -oP -- '--ctx-size \K\d+' "$FROM_SCRIPT" | head -1 || true)
  N_CPU_MOE=$(grep -oP -- '--n-cpu-moe \K\d+' "$FROM_SCRIPT" | head -1 || true)
  grep -q -- '--cpu-moe' "$FROM_SCRIPT" && CPU_MOE=true
  DRAFT=$(grep -oP -- '--model-draft \K\S+' "$FROM_SCRIPT" | head -1 || true)
  echo -e "${CYAN}Parsed from $FROM_SCRIPT:${NC}"
  echo "  model=$MODEL  ctx=$CTX_SIZE  n_cpu_moe=$N_CPU_MOE  cpu_moe=$CPU_MOE  draft=$DRAFT"
fi

[[ -z "$MODEL" ]] && { echo -e "${RED}No model specified${NC}" >&2; exit 1; }
[[ ! -f "$MODEL" ]] && { echo -e "${RED}Model not found: $MODEL${NC}" >&2; exit 1; }

# ── Compute optimal settings if needed ─────────────────────────────────
if [[ -z "$CTX_SIZE" ]]; then
  echo -e "${CYAN}Computing settings via size-model.py...${NC}"
  SIZE_OUT="$(python3 "$SIZE_MODEL" "$MODEL" ${DRAFT:+--draft "$DRAFT"} 2>&1)"
  CTX_SIZE=$(echo "$SIZE_OUT" | grep -oPe 'max_ctx=\K\d+' | head -1)
  if [[ -z "$N_CPU_MOE" ]] && ! $CPU_MOE; then
    CPU_MOE=$(echo "$SIZE_OUT" | grep -oPe '--cpu-moe' | head -1 || true)
    [[ -n "$CPU_MOE" ]] && N_CPU_MOE="" || N_CPU_MOE=$(echo "$SIZE_OUT" | grep -oPe 'n-cpu-moe \K\d+' | head -1 || true)
  fi
fi

[[ -z "$CTX_SIZE" ]] && { echo -e "${RED}Failed to determine ctx_size${NC}" >&2; exit 1; }
[[ -z "$MAX_CTX" ]] && MAX_CTX="$CTX_SIZE"

echo -e "${GREEN}Settings: model=$(basename "$MODEL") ctx=$CTX_SIZE n_cpu_moe=${N_CPU_MOE:-0} cpu_moe=$CPU_MOE${NC}"

# ── Port ────────────────────────────────────────────────────────────────
if [[ -z "$PORT" ]]; then
  for p in $(seq 18080 18100); do
    if ! ss -tln 2>/dev/null | grep -q ":$p " && ! netstat -tln 2>/dev/null | grep -q ":$p "; then
      PORT=$p; break
    fi
  done
  [[ -z "$PORT" ]] && { echo -e "${RED}No free port${NC}" >&2; exit 1; }
fi
echo -e "${CYAN}Port: $PORT${NC}"

# ── Baseline VRAM ──────────────────────────────────────────────────────
VRAM_TOTAL=$(get_vram_total)
vram_before=$(get_vram_used)
echo -e "${CYAN}VRAM: $(fmt_gb $vram_before)/$(fmt_gb $VRAM_TOTAL) GB used before launch${NC}"

# ── Build command ──────────────────────────────────────────────────────
CMD=("$LLAMA_SERVER"
  "--model" "$MODEL" "--host" "127.0.0.1" "--port" "$PORT"
  "--ctx-size" "$CTX_SIZE" "-ngl" "$N_GPU_LAYERS"
  "--parallel" "1" "--flash-attn" "on"
  "--cache-type-k" "q4_0" "--cache-type-v" "q4_0"
  "--batch-size" "512" "--ubatch-size" "256"
  "--no-webui"
)
$CPU_MOE && CMD+=(--cpu-moe)
[[ -n "$N_CPU_MOE" && "$N_CPU_MOE" != "0" ]] && CMD+=(--n-cpu-moe "$N_CPU_MOE")
[[ -n "$DRAFT" && -f "$DRAFT" ]] && CMD+=(--model-draft "$DRAFT")

echo -e "${CYAN}Launch: ${CMD[*]}${NC}"

# ── Launch ──────────────────────────────────────────────────────────────
STDERR_FILE="$(mktemp /tmp/llama-verify-stderr.XXXXXX)"
trap "rm -f '$STDERR_FILE'" EXIT

"${CMD[@]}" 2>"$STDERR_FILE" &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# ── Wait for ready ──────────────────────────────────────────────────────
echo -n "Waiting for server..."
DEADLINE=$((SECONDS + LAUNCH_TIMEOUT))
LOADED=false
while [[ $SECONDS -lt $DEADLINE ]]; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo -e "\n${RED}Server died during launch${NC}"
    tail -30 "$STDERR_FILE"; exit 1
  fi
  if curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    LOADED=true; echo " ready (health)"; break
  fi
  if grep -q "HTTP server listening" "$STDERR_FILE" 2>/dev/null; then
    sleep 2; LOADED=true; echo " ready (stderr)"; break
  fi
  sleep 1; echo -n "."
done

if ! $LOADED; then
  echo -e "\n${RED}Server failed to start${NC}"
  kill "$SERVER_PID" 2>/dev/null || true
  tail -50 "$STDERR_FILE"; exit 1
fi

sleep 3
vram_after_load=$(get_vram_used)
vram_load_delta=$((vram_after_load - vram_before))
echo -e "${GREEN}VRAM after load: $(fmt_gb $vram_after_load) GB (+$(fmt_mb $vram_load_delta) MB)${NC}"

VRAM_PEAK=$vram_after_load

# ── Fill context ────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══ Filling context to $MAX_CTX (step=$STEP) ═══${NC}"

CURRENT_CTX=0; OOM_DETECTED=false; OOM_CTX=0

while [[ $CURRENT_CTX -lt $MAX_CTX ]]; do
  FILL_CTX=$((CURRENT_CTX + STEP))
  [[ $FILL_CTX -gt $MAX_CTX ]] && FILL_CTX=$MAX_CTX
  FILL_TOKENS=$((FILL_CTX - CURRENT_CTX))

  echo -n "  Fill → $FILL_CTX (+$FILL_TOKENS tok)... "

  # Generate prompt with ~FILL_TOKENS tokens worth of text
  CHARS=$((FILL_TOKENS * 3))
  PROMPT=$(python3 -c "print('The quick brown fox jumps over the lazy dog. ' * $((CHARS / 45)))" 2>/dev/null || \
           printf 'The quick brown fox jumps over the lazy dog. %.0s' $(seq 1 $((CHARS / 45))))

  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT" \
    "http://127.0.0.1:$PORT/v1/completions" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\":$(echo "$PROMPT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""'),\"max_tokens\":1,\"echo\":true,\"temperature\":0}" \
    2>/dev/null || echo "000")

  if [[ "$HTTP_CODE" == "200" ]]; then
    CURRENT_CTX=$FILL_CTX
    VRAM_NOW=$(get_vram_used)
    [[ $VRAM_NOW -gt $VRAM_PEAK ]] && VRAM_PEAK=$VRAM_NOW
    VRAM_DELTA=$((VRAM_NOW - vram_after_load))
    VRAM_PCT=$((VRAM_NOW * 100 / VRAM_TOTAL))
    echo -e "${GREEN}OK${NC}  VRAM=$(fmt_gb $VRAM_NOW)G (+$(fmt_mb $VRAM_DELTA)MB, ${VRAM_PCT}%)"

    if [[ $VRAM_PCT -ge 98 ]]; then
      echo -e "  ${RED}⚠ VRAM at ${VRAM_PCT}%${NC}"
      if [[ $VRAM_PCT -ge 99 ]]; then
        OOM_DETECTED=true; OOM_CTX=$CURRENT_CTX
        echo -e "  ${RED}✗ Stopping — VRAM critically full${NC}"; break
      fi
    fi
  else
    echo -e "${RED}FAIL (HTTP $HTTP_CODE)${NC}"
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo -e "  ${RED}✗ Server crashed — likely OOM${NC}"
      OOM_DETECTED=true; OOM_CTX=$CURRENT_CTX
      grep -qiE 'out of memory|cannot allocate|hip.*error' "$STDERR_FILE" && \
        echo -e "  ${RED}Stderr:$(grep -iE 'out of memory|cannot allocate|hip.*error' "$STDERR_FILE" | tail -3)${NC}"
      break
    fi
    echo -e "  ${YELLOW}Server alive, retrying...${NC}"; sleep 2
  fi
  sleep 1
done

# ── Results ─────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══ RESULTS ═══${NC}"
echo "  Model:       $(basename "$MODEL")"
echo "  Target ctx:  $MAX_CTX"
echo "  Reached ctx: $CURRENT_CTX"
echo "  Peak VRAM:   $(fmt_gb $VRAM_PEAK) GB"
echo "  VRAM delta:  +$(fmt_mb $((VRAM_PEAK - vram_before))) MB from baseline"

VRAM_PCT=$((VRAM_PEAK * 100 / VRAM_TOTAL))

if $OOM_DETECTED; then
  echo -e "  ${RED}Status: OOM at ctx=$OOM_CTX${NC}"
  echo -e "  ${YELLOW}→ Safe max ctx: < $OOM_CTX${NC}"
elif [[ $CURRENT_CTX -ge $MAX_CTX ]]; then
  echo -e "  ${GREEN}Status: ✓ SURVIVED at $MAX_CTX ctx, ${VRAM_PCT}% VRAM${NC}"
  headroom_mb=$(fmt_mb $((VRAM_TOTAL - VRAM_PEAK)))
  headroom_pct=$((100 - VRAM_PCT))
  echo "  Headroom:    ${headroom_mb} MB (${headroom_pct}%)"
  if [[ $headroom_pct -lt 5 ]]; then
    echo -e "  ${YELLOW}⚠ Tight — <5% free. Consider --safe mode.${NC}"
  fi
else
  echo -e "  ${YELLOW}Status: PARTIAL — $CURRENT_CTX / $MAX_CTX${NC}"
fi

echo ""
echo "  Stderr log: $STDERR_FILE"
echo "  Server PID: $SERVER_PID"

# ── Cleanup ─────────────────────────────────────────────────────────────
echo -e "${CYAN}Stopping server...${NC}"
kill "$SERVER_PID" 2>/dev/null || true
for i in $(seq 1 15); do
  kill -0 "$SERVER_PID" 2>/dev/null || { echo -e "${GREEN}Stopped${NC}"; break; }
  sleep 1
done
kill -0 "$SERVER_PID" 2>/dev/null && { kill -9 "$SERVER_PID" 2>/dev/null; echo -e "${YELLOW}Force-killed${NC}"; }

sleep 3
vram_after=$(get_vram_used)
leak=$((vram_after - vram_before))
if [[ $leak -gt $((100 * MB)) ]]; then
  echo -e "${YELLOW}⚠ VRAM leak: +$(fmt_mb $leak) MB after shutdown${NC}"
else
  echo -e "${GREEN}VRAM clean: $(fmt_gb $vram_after) GB (baseline: $(fmt_gb $vram_before) GB)${NC}"
fi

echo -e "${CYAN}Done.${NC}"
