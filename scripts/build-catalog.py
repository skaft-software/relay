#!/usr/bin/env python3
"""
Build a comprehensive model catalog from the Unsloth Dynamic 2.0 Quants collection.
- Replaces entries for repos in the collection with ALL UD quants
- Preserves existing entries for repos not in the collection
- Handles both single-file and sharded GGUF repos
"""

import json, sys, os, time, re, urllib.request, urllib.error
from pathlib import Path
from collections import defaultdict

COLLECTION_URL = "https://huggingface.co/api/collections/unsloth/unsloth-dynamic-20-quants"
OUT = Path(os.environ["HOME"]) / "relay/docs/model-catalog.json"

# ── Model metadata ──
MODEL_META = {
    # Gemma 4
    "unsloth/gemma-4-12b-it-GGUF":          dict(family="gemma", lane="vision", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma4"),
    "unsloth/gemma-4-12B-it-qat-GGUF":       dict(family="gemma", lane="vision", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma4"),
    "unsloth/gemma-4-26B-A4B-it-GGUF":       dict(family="gemma", lane="vision", ctx=262144, vision=True, thinking="toggle", moe=True, arch="gemma4", expert_count=8, active_experts=4),
    "unsloth/gemma-4-26B-A4B-it-qat-GGUF":   dict(family="gemma", lane="vision", ctx=262144, vision=True, thinking="toggle", moe=True, arch="gemma4", expert_count=8, active_experts=4),
    "unsloth/gemma-4-31B-it-GGUF":           dict(family="gemma", lane="dense", ctx=262144, vision=False, thinking="off", moe=False, arch="gemma4"),
    "unsloth/gemma-4-31B-it-qat-GGUF":       dict(family="gemma", lane="dense", ctx=262144, vision=False, thinking="off", moe=False, arch="gemma4"),
    "unsloth/gemma-4-E4B-it-GGUF":           dict(family="gemma", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma4", expert_count=8, active_experts=4),
    "unsloth/gemma-4-E4B-it-qat-GGUF":       dict(family="gemma", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma4", expert_count=8, active_experts=4),
    "unsloth/gemma-4-E2B-it-GGUF":           dict(family="gemma", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma4", expert_count=8, active_experts=2),
    "unsloth/gemma-4-E2B-it-qat-GGUF":       dict(family="gemma", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma4", expert_count=8, active_experts=2),
    # Gemma 3
    "unsloth/gemma-3-27b-it-GGUF":           dict(family="gemma3", lane="dense", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-27b-it-qat-GGUF":       dict(family="gemma3", lane="dense", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-12b-it-GGUF":           dict(family="gemma3", lane="dense", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-12b-it-qat-GGUF":       dict(family="gemma3", lane="dense", ctx=131072, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-4b-it-GGUF":            dict(family="gemma3", lane="dense", ctx=32768, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-4b-it-qat-GGUF":        dict(family="gemma3", lane="dense", ctx=32768, vision=True, thinking="off", moe=False, arch="gemma3"),
    "unsloth/gemma-3-1b-it-GGUF":            dict(family="gemma3", lane="dense", ctx=32768, vision=False, thinking="off", moe=False, arch="gemma3"),
    # Gemma 3n
    "unsloth/gemma-3n-E4B-it-GGUF":          dict(family="gemma3n", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma3n", expert_count=8, active_experts=4),
    "unsloth/gemma-3n-E2B-it-GGUF":          dict(family="gemma3n", lane="vision", ctx=32768, vision=True, thinking="off", moe=True, arch="gemma3n", expert_count=8, active_experts=2),
    # FunctionGemma
    "unsloth/functiongemma-270m-it-GGUF":    dict(family="gemma", lane="function", ctx=8192, vision=False, thinking="off", moe=False, arch="gemma"),
    # Qwen3.6
    "unsloth/Qwen3.6-27B-GGUF":             dict(family="qwen", lane="text", ctx=262144, vision=True, thinking="toggle", moe=False, arch="qwen35"),
    "unsloth/Qwen3.6-27B-MTP-GGUF":         dict(family="qwen", lane="text", ctx=262144, vision=True, thinking="toggle", moe=False, arch="qwen35"),
    "unsloth/Qwen3.6-35B-A3B-GGUF":         dict(family="qwen", lane="moe", ctx=262144, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.6-35B-A3B-MTP-GGUF":     dict(family="qwen", lane="moe", ctx=262144, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    # Qwen3.5
    "unsloth/Qwen3.5-122B-A10B-GGUF":       dict(family="qwen", lane="moe", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.5-122B-A10B-MTP-GGUF":   dict(family="qwen", lane="moe", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.5-397B-A17B-GGUF":       dict(family="qwen", lane="moe", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.5-397B-A17B-MTP-GGUF":   dict(family="qwen", lane="moe", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.5-35B-A3B-GGUF":         dict(family="qwen", lane="moe", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen35moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3.5-27B-GGUF":             dict(family="qwen", lane="text", ctx=131072, vision=True, thinking="toggle", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-9B-GGUF":              dict(family="qwen", lane="text", ctx=131072, vision=True, thinking="toggle", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-9B-MTP-GGUF":          dict(family="qwen", lane="text", ctx=131072, vision=True, thinking="toggle", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-4B-GGUF":              dict(family="qwen", lane="text", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-4B-MTP-GGUF":          dict(family="qwen", lane="text", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-2B-GGUF":              dict(family="qwen", lane="text", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-2B-MTP-GGUF":          dict(family="qwen", lane="text", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen35"),
    "unsloth/Qwen3.5-0.8B-GGUF":            dict(family="qwen", lane="text", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen35"),
    # Qwen3 Coder
    "unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF": dict(family="qwen", lane="code", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-Coder-Next-GGUF":         dict(family="qwen", lane="code", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3next", expert_count=128, active_experts=8),
    "unsloth/Qwen3-Coder-480B-A35B-Instruct-GGUF": dict(family="qwen", lane="code", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    # Qwen3 Next
    "unsloth/Qwen3-Next-80B-A3B-Instruct-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3next", expert_count=128, active_experts=8),
    "unsloth/Qwen3-Next-80B-A3B-Thinking-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="on", moe=True, arch="qwen3next", expert_count=128, active_experts=8),
    # Qwen3 VL
    "unsloth/Qwen3-VL-30B-A3B-Instruct-GGUF": dict(family="qwen", lane="vision", ctx=131072, vision=True, thinking="toggle", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-VL-8B-Instruct-GGUF":      dict(family="qwen", lane="vision", ctx=131072, vision=True, thinking="off", moe=False, arch="qwen3"),
    "unsloth/Qwen3-VL-4B-Instruct-GGUF":      dict(family="qwen", lane="vision", ctx=32768, vision=True, thinking="off", moe=False, arch="qwen3"),
    # Qwen3 base
    "unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-30B-A3B-Thinking-2507-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="on", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-30B-A3B-GGUF":              dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-235B-A22B-Instruct-2507-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-235B-A22B-Thinking-2507-GGUF": dict(family="qwen", lane="text", ctx=131072, vision=False, thinking="on", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-235B-A22B-GGUF":              dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=True, arch="qwen3moe", expert_count=128, active_experts=8),
    "unsloth/Qwen3-32B-GGUF":                   dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="qwen3"),
    "unsloth/Qwen3-14B-GGUF":                   dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="qwen3"),
    "unsloth/Qwen3-8B-GGUF":                    dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="qwen3"),
    "unsloth/Qwen3-4B-GGUF":                    dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="qwen3"),
    "unsloth/Qwen3-0.6B-GGUF":                  dict(family="qwen", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="qwen3"),
    # QwQ
    "unsloth/QwQ-32B-GGUF":                    dict(family="qwen", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=False, arch="qwen35"),
    # DeepSeek
    "unsloth/DeepSeek-V3.1-GGUF":              dict(family="deepseek", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/DeepSeek-V3.1-Terminus-GGUF":      dict(family="deepseek", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/DeepSeek-R1-GGUF-UD":              dict(family="deepseek", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/DeepSeek-V3-0324-GGUF-UD":         dict(family="deepseek", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/DeepSeek-R1-0528-GGUF":            dict(family="deepseek", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF":   dict(family="deepseek", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="qwen3"),
    "unsloth/DeepSeek-R1-Distill-Llama-8B-GGUF": dict(family="deepseek", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="llama"),
    "unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF": dict(family="deepseek", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="qwen3"),
    # GLM
    "unsloth/GLM-5.2-GGUF":                    dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-5.1-GGUF":                    dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-5-GGUF":                      dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.7-Flash-GGUF":              dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.7-GGUF":                    dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.6V-GGUF":                   dict(family="glm", lane="vision", ctx=131072, vision=True, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.6V-Flash-GGUF":             dict(family="glm", lane="vision", ctx=32768, vision=True, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.6-GGUF":                    dict(family="glm", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4.5-Air-GGUF":                dict(family="glm", lane="text", ctx=32768, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/GLM-4-32B-0414-GGUF":             dict(family="glm", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="deepseek2"),
    # Kimi
    "unsloth/Kimi-K2.7-Code-GGUF":            dict(family="kimi", lane="code", ctx=131072, vision=True, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/Kimi-K2.6-GGUF":                 dict(family="kimi", lane="text", ctx=131072, vision=True, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/Kimi-K2.5-GGUF":                 dict(family="kimi", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/Kimi-K2-Instruct-GGUF":          dict(family="kimi", lane="text", ctx=131072, vision=False, thinking="toggle", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/Kimi-K2-Thinking-GGUF":          dict(family="kimi", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    # MiniMax
    "unsloth/MiniMax-M3-GGUF":                dict(family="minimax", lane="text", ctx=131072, vision=True, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/MiniMax-M2.7-GGUF":              dict(family="minimax", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/MiniMax-M2.5-GGUF":              dict(family="minimax", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/MiniMax-M2.1-GGUF":              dict(family="minimax", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    "unsloth/MiniMax-M2-GGUF":                dict(family="minimax", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=256, active_experts=8),
    # Llama 4
    "unsloth/Llama-4-Maverick-17B-128E-Instruct-GGUF": dict(family="llama", lane="text", ctx=131072, vision=True, thinking="off", moe=True, arch="llama", expert_count=128, active_experts=1),
    "unsloth/Llama-4-Scout-17B-16E-Instruct-GGUF": dict(family="llama", lane="text", ctx=131072, vision=True, thinking="off", moe=True, arch="llama", expert_count=16, active_experts=1),
    # Llama 3.1
    "unsloth/Llama-3.1-8B-Instruct-GGUF":      dict(family="llama", lane="text", ctx=131072, vision=False, thinking="off", moe=False, arch="llama"),
    # Mistral family
    "unsloth/Mistral-Small-3.2-24B-Instruct-2506-GGUF": dict(family="mistral", lane="text", ctx=131072, vision=True, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Mistral-Small-3.1-24B-Instruct-2503-GGUF": dict(family="mistral", lane="text", ctx=131072, vision=False, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Devstral-Small-2-24B-Instruct-2512-GGUF": dict(family="mistral", lane="text", ctx=131072, vision=False, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Devstral-Small-2505-GGUF":          dict(family="mistral", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Magistral-Small-2506-GGUF":         dict(family="mistral", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Ministral-3-14B-Instruct-2512-GGUF": dict(family="mistral", lane="text", ctx=131072, vision=False, thinking="off", moe=False, arch="mistral3"),
    "unsloth/Ministral-3-14B-Reasoning-2512-GGUF": dict(family="mistral", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="mistral3"),
    # Phi-4
    "unsloth/Phi-4-reasoning-plus-GGUF":        dict(family="phi", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=False, arch="phi"),
    "unsloth/Phi-4-reasoning-GGUF":             dict(family="phi", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="phi"),
    "unsloth/Phi-4-mini-reasoning-GGUF":        dict(family="phi", lane="reasoning", ctx=32768, vision=False, thinking="on", moe=False, arch="phi"),
    # Nemotron
    "unsloth/NVIDIA-Nemotron-3-Super-120B-A12B-GGUF": dict(family="nvidia", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="mistral3", expert_count=128, active_experts=8),
    "unsloth/Nemotron-3-Nano-30B-A3B-GGUF":     dict(family="nvidia", lane="text", ctx=131072, vision=False, thinking="off", moe=True, arch="deepseek2", expert_count=128, active_experts=8),
    "unsloth/NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-GGUF": dict(family="nvidia", lane="reasoning", ctx=131072, vision=False, thinking="on", moe=True, arch="deepseek2", expert_count=128, active_experts=8),
    # GPT-OSS / HyperNova
    "unsloth/gpt-oss-120b-GGUF":               dict(family="hypernova", lane="text", ctx=131072, vision=False, thinking="off", moe=False, arch="gpt-oss"),
    "unsloth/gpt-oss-20b-GGUF":                dict(family="hypernova", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="gpt-oss"),
    # Granite
    "unsloth/granite-4.0-h-small-GGUF":         dict(family="granite", lane="text", ctx=32768, vision=False, thinking="off", moe=False, arch="granite"),
}


def infer_meta(repo_id):
    name = repo_id.lower()
    meta = {"family": "unknown", "lane": "text", "ctx": 32768, "vision": False, "thinking": "off", "moe": False}
    
    if "qwen" in name: meta["family"] = "qwen"
    elif "gemma" in name: meta["family"] = "gemma"
    elif "glm" in name: meta["family"] = "glm"
    elif "deepseek" in name: meta["family"] = "deepseek"
    elif "kimi" in name: meta["family"] = "kimi"
    elif "minimax" in name: meta["family"] = "minimax"
    elif "llama" in name: meta["family"] = "llama"
    elif any(t in name for t in ["mistral", "ministral", "magistral", "devstral"]): meta["family"] = "mistral"
    elif "phi" in name: meta["family"] = "phi"
    elif "nemotron" in name: meta["family"] = "nvidia"
    elif "north" in name or "cohere" in name: meta["family"] = "cohere"
    elif "gpt-oss" in name: meta["family"] = "hypernova"
    elif "granite" in name: meta["family"] = "granite"
    
    if any(t in name for t in ["vl", "vision", "image-edit"]): meta["vision"] = True; meta["lane"] = "vision"
    if "image-edit" in name: meta["lane"] = "image-edit"
    if "coder" in name or "code" in name: meta["lane"] = "code"
    if any(t in name for t in ["thinking", "reasoning", "qwq"]): meta["thinking"] = "on"; meta["lane"] = "reasoning"
    
    if re.search(r'a\d+b', name):
        meta["moe"] = True
        m = re.search(r'a(\d+)b', name)
        if m: meta["active_experts"] = int(m.group(1))
        e = re.search(r'(\d+)e', name)
        if e: meta["expert_count"] = int(e.group(1))
    
    if meta["family"] == "qwen": meta["arch"] = "qwen3moe" if meta.get("moe") else "qwen3"
    elif meta["family"] == "gemma": meta["arch"] = "gemma4"
    elif meta["family"] in ("glm", "deepseek", "kimi", "minimax"): meta["arch"] = "deepseek2"
    elif meta["family"] == "mistral": meta["arch"] = "mistral3"
    elif meta["family"] == "llama": meta["arch"] = "llama"
    elif meta["family"] == "phi": meta["arch"] = "phi"
    elif meta["family"] == "hypernova": meta["arch"] = "gpt-oss"
    
    return meta


def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "relay-catalog-builder/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt == retries - 1:
                print(f"  FAILED: {url} — {e}", file=sys.stderr)
                return None
            time.sleep(2)
    return None


def build_id(repo, quant):
    """Generate a catalog ID. Preserve dots in version numbers (Qwen3.6 → qwen3.6)."""
    model_part = repo.split("/")[-1].replace("-GGUF", "").replace("-gguf", "")
    q = quant.replace("UD-", "")
    raw = f"{model_part}-{q}"
    # Lowercase but preserve dots separating version numbers
    raw = raw.lower()
    # Replace underscores with dashes
    raw = raw.replace("_", "-")
    # Collapse repeated dashes
    while "--" in raw:
        raw = raw.replace("--", "-")
    return raw


def build_label(repo, quant):
    model_part = repo.split("/")[-1].replace("-GGUF", "").replace("-gguf", "")
    q = quant.replace("UD-", "")
    return f"{model_part} {q}"


def extract_ud_files(repo_id):
    url = f"https://huggingface.co/api/models/{repo_id}?blobs=true"
    data = fetch_json(url)
    if not data:
        return [], data
    
    siblings = data.get("siblings", [])
    
    gguf_files = []
    for sib in siblings:
        fname = sib.get("rfilename", "")
        if not fname.endswith(".gguf"):
            continue
        if any(x in fname.lower() for x in ["mmproj", "bf16", "mtp"]):
            continue
        if "UD-" not in fname:
            continue
        
        size = sib.get("lfs", {}).get("size") or sib.get("size", 0)
        gguf_files.append((fname, size))
    
    quant_groups = defaultdict(list)
    for fname, size in gguf_files:
        basename = fname.rsplit("/", 1)[-1] if "/" in fname else fname
        ud_idx = basename.find("-UD-")
        if ud_idx < 0:
            continue
        rest = basename[ud_idx+1:]
        
        shard_match = re.match(r'(UD-[^-]+(?:-[^-]+)*)-\d{5}-of-\d{5}\.gguf$', rest)
        if shard_match:
            quant = shard_match.group(1)
        else:
            quant = rest.replace(".gguf", "")
        
        quant_groups[quant].append((fname, size))
    
    results = []
    for quant, files in sorted(quant_groups.items()):
        total_size = sum(sz for _, sz in files)
        first_file = sorted(files)[0][0]
        total_size_gb = round(total_size / 1e9, 1) if total_size else None
        results.append((first_file, quant, total_size_gb, len(files)))
    
    return results, data


def main():
    print("=" * 60, file=sys.stderr)
    print("Building Relay model catalog from Unsloth Dynamic 2.0 Quants", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    # Load existing catalog to preserve entries for repos not in the collection
    existing = []
    if OUT.exists():
        existing = json.loads(OUT.read_text())
    
    # Map existing entries by hf_repo
    existing_by_repo = defaultdict(list)
    for e in existing:
        existing_by_repo[e.get("hf_repo", "")].append(e)
    
    print(f"Existing catalog: {len(existing)} entries across {len(existing_by_repo)} repos", file=sys.stderr)
    
    print("\nLoading collection...", file=sys.stderr)
    collection = fetch_json(COLLECTION_URL)
    if not collection:
        print("FAILED to load collection", file=sys.stderr)
        sys.exit(1)
    
    items = collection.get("items", [])
    print(f"Collection has {len(items)} repos\n", file=sys.stderr)
    
    # Build set of repos in the collection
    collection_repos = {item.get("id", "") for item in items}
    
    new_entries = []
    repos_processed = 0
    files_found = 0
    repos_replaced = 0
    
    for item in items:
        repo_id = item.get("id", "")
        if not repo_id:
            continue
        
        model_name = repo_id.split("/")[-1]
        repos_processed += 1
        
        ud_files, repo_data = extract_ud_files(repo_id)
        
        if not ud_files:
            print(f"[{repos_processed}/{len(items)}] {model_name} — no UD files", file=sys.stderr)
            continue
        
        repos_replaced += 1
        meta = MODEL_META.get(repo_id)
        if meta is None:
            meta = infer_meta(repo_id)
        
        entries_added = 0
        shard_info = ""
        for fname, quant, size_gb, shards in ud_files:
            files_found += 1
            entries_added += 1
            entry_id = build_id(repo_id, quant)
            label = build_label(repo_id, quant)
            
            entry = {
                "id": entry_id,
                "label": label,
                "family": meta.get("family", "unknown"),
                "lane": meta.get("lane", "text"),
                "ctx": meta.get("ctx", 32768),
                "vision": meta.get("vision", False),
                "thinking": meta.get("thinking", "off"),
                "quant": quant.replace("UD-", ""),
                "download_url": f"https://huggingface.co/{repo_id}/resolve/main/{fname}",
                "filename": fname.split("/")[-1],
                "hf_repo": repo_id,
            }
            
            if size_gb:
                entry["size_gb"] = size_gb
            if shards > 1:
                entry["shards"] = shards
                shard_info = f" ({entries_added} quants, sharded)"
            
            if meta.get("moe"):
                entry["moe"] = True
                if meta.get("expert_count"): entry["expert_count"] = meta["expert_count"]
                if meta.get("active_experts"): entry["active_experts"] = meta["active_experts"]
            if meta.get("arch"): entry["arch"] = meta["arch"]
            
            new_entries.append(entry)
        
        print(f"[{repos_processed}/{len(items)}] {model_name} — {entries_added} UD quants{shard_info} (family={meta.get('family','?')})", file=sys.stderr)
        time.sleep(0.3)
    
    # Preserve entries for repos NOT in the collection
    preserved = 0
    for repo, entries in existing_by_repo.items():
        if repo not in collection_repos:
            for e in entries:
                new_entries.append(e)
                preserved += 1
    
    if preserved:
        print(f"\nPreserved {preserved} entries from {len(existing_by_repo) - repos_replaced} repos not in collection", file=sys.stderr)
    
    print(f"\n{'=' * 60}", file=sys.stderr)
    print(f"Total: {len(new_entries)} entries ({files_found} UD + {preserved} preserved)", file=sys.stderr)
    
    quant_order = {
        "TQ1_0": 0, "IQ1_S": 1, "IQ1_M": 2, "IQ2_XXS": 3, "IQ2_M": 4,
        "IQ3_XXS": 5, "IQ3_S": 6, "Q2_K_XL": 7, "Q3_K_S": 8, "Q3_K_M": 9,
        "Q3_K_XL": 10, "IQ4_XS": 11, "IQ4_NL": 12, "IQ4_NL_XL": 13,
        "Q4_K_S": 14, "Q4_K_M": 15, "Q4_K_XL": 16, "Q5_K_S": 17,
        "Q5_K_M": 18, "Q5_K_XL": 19, "Q6_K": 20, "Q6_K_XL": 21,
        "Q8_K_XL": 22, "Q8_0": 23,
    }
    
    def sort_key(e):
        return (e.get("family", "zzz"), e.get("hf_repo", ""), quant_order.get(e.get("quant", ""), 99))
    
    new_entries.sort(key=sort_key)
    
    OUT.write_text(json.dumps(new_entries, indent=2) + "\n")
    print(f"Wrote {len(new_entries)} entries to {OUT}", file=sys.stderr)
    
    families = {}
    for e in new_entries:
        f = e.get("family", "?")
        families.setdefault(f, []).append(e)
    print("\nBy family:", file=sys.stderr)
    for f, entries in sorted(families.items()):
        repos = len(set(e["hf_repo"] for e in entries))
        sharded = sum(1 for e in entries if e.get("shards", 1) > 1)
        info = f" ({sharded} sharded)" if sharded else ""
        print(f"  {f}: {len(entries)} entries across {repos} repos{info}", file=sys.stderr)


if __name__ == "__main__":
    main()
