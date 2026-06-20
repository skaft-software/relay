#!/usr/bin/env bash
# probe-gpu.sh — Detect GPU hardware and estimate available VRAM.
# Outputs JSON: { gpu_type, vram_total_gb, vram_free_gb, driver, models: [...] }
set -euo pipefail

GPU_TYPE="unknown"
VRAM_TOTAL=0
VRAM_FREE=0
DRIVER="unknown"

# ── AMD ROCm ──────────────────────────────────────────────────────────
if command -v rocm-smi &>/dev/null; then
  GPU_TYPE="amd"
  DRIVER="rocm"
  # rocm-smi outputs lines like: "0       1     0x7550,   ...  87%   100%"
  # VRAM% is the second-to-last field before GPU%
  while IFS= read -r line; do
    # Try to parse VRAM total/used from sysfs
    for card in /sys/class/drm/card?/device; do
      if [[ -f "$card/mem_info_vram_total" ]]; then
        total=$(<"$card/mem_info_vram_total")
        used=$(<"$card/mem_info_vram_used" 2>/dev/null || echo 0)
        VRAM_TOTAL=$((total / 1024 / 1024 / 1024))
        VRAM_FREE=$(((total - used) / 1024 / 1024 / 1024))
      fi
    done
  done < <(rocm-smi 2>/dev/null || true)

# ── NVIDIA CUDA ────────────────────────────────────────────────────────
elif command -v nvidia-smi &>/dev/null; then
  GPU_TYPE="nvidia"
  DRIVER="cuda"
  VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ')
  VRAM_FREE=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ')
  VRAM_TOTAL=$((VRAM_TOTAL / 1024))
  VRAM_FREE=$((VRAM_FREE / 1024))

# ── Apple Metal ────────────────────────────────────────────────────────
elif command -v sysctl &>/dev/null && sysctl -n hw.optional.arm64 2>/dev/null | grep -q 1; then
  GPU_TYPE="apple"
  DRIVER="metal"
  # Apple Silicon has unified memory; total is system RAM
  VRAM_TOTAL=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))
  VRAM_FREE=$(( VRAM_TOTAL - 2 ))  # rough: 2GB reserved for OS

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
  "models": $MODELS
}
JSON
