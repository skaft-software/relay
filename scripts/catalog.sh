#!/usr/bin/env bash
# relay model catalog — supported models with download URLs and metadata.
# Source this file or read it to know what's available.
#
# Each entry:  NAME|REPO|FILE|ARCH|QUANT|MULTIMODAL|DRAFT_REPO|DRAFT_FILE|NOTES
#
# Usage: ./scripts/setup.sh <model-name>
#   ./scripts/setup.sh apodex-2b
#   ./scripts/setup.sh gemma-4-e4b
#   ./scripts/setup.sh --list

CATALOG=(
  # ── Apodex (Qwen3.5 dense, code-focused) ──
  "apodex-2b|FlameF0X/Apodex-1.0-2B-SFT-Q4_K_M-GGUF|apodex-1.0-2b-sft-q4_k_m.gguf|qwen35|Q4_K_M|false|||2B params, fits 8GB easily, 262K ctx"
  "apodex-4b|FlameF0X/Apodex-1.0-4B-SFT-Q4_K_M-GGUF|apodex-1.0-4b-sft-q4_k_m.gguf|qwen35|Q4_K_M|false|||4B params, Q4_K_M recommended for 8GB"
  "apodex-4b-q8|FlameF0X/Apodex-1.0-4B-SFT-Q8_0-GGUF|apodex-1.0-4b-sft-q8_0.gguf|qwen35|Q8_0|false|||4B Q8_0, higher quality, tighter on 8GB"

  # ── Gemma 4 (Google, vision-capable) ──
  "gemma-4-e4b|unsloth/gemma-4-E4B-it-GGUF|gemma-4-E4B-it-Q4_K_M.gguf|gemma4|Q4_K_M|true|||4B expert, vision, Q4_K_M for 8GB"
  "gemma-4-e4b-q3|unsloth/gemma-4-E4B-it-GGUF|gemma-4-E4B-it-Q3_K_M.gguf|gemma4|Q3_K_M|true|||4B expert, vision, Q3 for max ctx on 8GB"
  "gemma-4-e4b-mtp|unsloth/gemma-4-E4B-it-GGUF|gemma-4-E4B-it-Q4_K_M.gguf|gemma4|Q4_K_M|true|unsloth/gemma-4-E4B-it-GGUF|mtp-gemma-4-E4B-it.gguf|With MTP draft, faster"

  # ── Qwen3.6 MoE (general purpose) ──
  "qwen36-35b|unsloth/Qwen3.6-35B-A3B-GGUF|Qwen3.6-35B-A3B-UD-IQ3_XXS.gguf|qwen35moe|IQ3_XXS|false|||35B MoE, needs 12GB+ VRAM"
  "qwen36-35b-q4|unsloth/Qwen3.6-35B-A3B-GGUF|Qwen3.6-35B-A3B-UD-Q4_K_XL.gguf|qwen35moe|Q4_K_XL|false|||35B MoE, Q4, needs 16GB+ VRAM"

  # ── GLM-4.7 Flash MoE (DeepSeek MLA arch) ──
  "glm47-flash|unsloth/GLM-4.7-Flash-REAP-23B-A3B-GGUF|GLM-4.7-Flash-REAP-23B-A3B-UD-Q4_K_XL.gguf|deepseek2|Q4_K_XL|false|||23B MoE, MLA KV, needs 12GB+"

  # ── Qwen3-Coder MoE ──
  "qwen3coder-30b|unsloth/Qwen3-Coder-30B-A3B-Instruct-1M-GGUF|Qwen3-Coder-30B-A3B-Instruct-1M-UD-Q4_K_XL.gguf|qwen3moe|Q4_K_XL|false|||30B MoE, 1M train ctx, needs 16GB+"

  # ── Qwen3-Next MoE ──
  "qwen3next-80b|unsloth/Qwen3-Next-80B-A3B-Instruct-GGUF|Qwen3-Next-80B-A3B-Instruct-UD-IQ2_XXS.gguf|qwen3next|IQ2_XXS|false|||80B MoE, IQ2 quant, needs 16GB+"
)

get_catalog_entry() {
  local name="$1"
  for entry in "${CATALOG[@]}"; do
    if [[ "${entry%%|*}" == "$name" ]]; then
      echo "$entry"
      return 0
    fi
  done
  return 1
}
