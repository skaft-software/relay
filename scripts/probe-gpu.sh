#!/usr/bin/env bash
# probe-gpu.sh — Detect GPU hardware and estimate available VRAM.
# Outputs JSON: { gpu_type, vram_total_gb, vram_free_gb, driver, devices: [...], models: [...] }
#
# Primary path: relay uses llama-server --list-devices when available (cross-vendor,
# authoritative). This script is the pre-build fallback for the setup TUI.
set -euo pipefail

GPU_TYPE="unknown"
VRAM_TOTAL=0
VRAM_FREE=0
DRIVER="unknown"
DEVICES_JSON="[]"

# ── AMD ROCm/Vulkan ────────────────────────────────────────────────────
if command -v rocm-smi &>/dev/null; then
  GPU_TYPE="amd"
  # Relay uses Vulkan for AMD (not HIP/ROCm) — device handles match llama-server Vulkan{i}.
  DRIVER="vulkan"
  idx=0
  first=true
  DEVICES_JSON="["
  for card in /sys/class/drm/card?/device; do
    [[ -f "$card/mem_info_vram_total" ]] || continue
    total=$(<"$card/mem_info_vram_total")
    used=$(<"$card/mem_info_vram_used" 2>/dev/null || echo 0)
    gb=$((total / 1024 / 1024 / 1024))
    (( gb > 0 )) || continue
    free_gb=$(((total - used) / 1024 / 1024 / 1024))
    VRAM_TOTAL=$((VRAM_TOTAL + gb))
    VRAM_FREE=$((VRAM_FREE + free_gb))
    [[ "$first" == "true" ]] && first=false || DEVICES_JSON+=","
    DEVICES_JSON+="{\"index\":$idx,\"device\":\"Vulkan$idx\",\"name\":\"AMD GPU\",\"vram_gb\":$gb,\"free_vram_gb\":$free_gb}"
    idx=$((idx + 1))
  done
  DEVICES_JSON+="]"

# ── NVIDIA CUDA ────────────────────────────────────────────────────────
elif command -v nvidia-smi &>/dev/null; then
  GPU_TYPE="nvidia"
  DRIVER="cuda"
  DEVICES_JSON="["
  first=true
  while IFS=, read -r raw_idx raw_name raw_mib raw_free_mib; do
    raw_idx="${raw_idx// /}"
    raw_name="${raw_name## }"  # strip leading space from csv
    raw_mib="${raw_mib// /}"
    raw_free_mib="${raw_free_mib// /}"
    (( raw_mib > 0 )) 2>/dev/null || continue
    gb=$((raw_mib / 1024))
    free_gb=$((raw_free_mib / 1024))
    (( gb > 0 )) || continue
    VRAM_TOTAL=$((VRAM_TOTAL + gb))
    VRAM_FREE=$((VRAM_FREE + free_gb))
    # Minimal JSON string escaping for GPU names (backslash and double-quote).
    safe_name="${raw_name//\\/\\\\}"
    safe_name="${safe_name//\"/\\\"}"
    [[ "$first" == "true" ]] && first=false || DEVICES_JSON+=","
    DEVICES_JSON+="{\"index\":$raw_idx,\"device\":\"CUDA$raw_idx\",\"name\":\"$safe_name\",\"vram_gb\":$gb,\"free_vram_gb\":$free_gb}"
  done < <(nvidia-smi --query-gpu=index,name,memory.total,memory.free --format=csv,noheader,nounits 2>/dev/null || true)
  DEVICES_JSON+="]"

# ── Apple Metal ────────────────────────────────────────────────────────
elif command -v sysctl &>/dev/null && sysctl -n hw.optional.arm64 2>/dev/null | grep -q 1; then
  GPU_TYPE="apple"
  DRIVER="metal"
  # Apple Silicon has unified memory; total is system RAM
  VRAM_TOTAL=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))
  VRAM_FREE=$(( VRAM_TOTAL - 2 ))  # rough: 2GB reserved for OS
  DEVICES_JSON="[{\"index\":0,\"device\":\"Metal0\",\"name\":\"Apple Silicon\",\"vram_gb\":$VRAM_TOTAL,\"free_vram_gb\":$VRAM_FREE}]"

# ── Vulkan-only (no vendor tool) ──────────────────────────────────────
elif command -v vulkaninfo &>/dev/null; then
  GPU_TYPE="vulkan"
  DRIVER="vulkan"
fi

# ── Suggest models based on VRAM ──────────────────────────────────────
suggest_models() {
  local vram=$1
  # Each tuple: "model_name ctx_size vram_estimate_gb"
  # Sorted by VRAM requirement ascending
  local candidates=(
    "glm-4.7-flash:98304:4"
    "north-mini-code:131072:6"
    "qwen3.6-35b-a3b:98304:8"
    "qwen3.6-27b:32768:11"
    "gemma-4-26b:98304:12"
    "devstral-2-24b:32768:14"
    "gemma-4-31b:32768:18"
  )
  local suggestions=()
  for entry in "${candidates[@]}"; do
    IFS=: read -r name ctx est <<< "$entry"
    if (( vram >= est )); then
      suggestions+=("{\"name\":\"$name\",\"ctx_size\":$ctx,\"vram_estimate_gb\":$est}")
    fi
  done
  # Join with commas
  local joined=""
  for s in "${suggestions[@]}"; do
    if [[ -n "$joined" ]]; then joined+=","; fi
    joined+="$s"
  done
  echo "[$joined]"
}

MODELS=$(suggest_models "$VRAM_TOTAL")

cat <<JSON
{
  "gpu_type": "$GPU_TYPE",
  "driver": "$DRIVER",
  "vram_total_gb": $VRAM_TOTAL,
  "vram_free_gb": $VRAM_FREE,
  "devices": $DEVICES_JSON,
  "models": $MODELS
}
JSON
