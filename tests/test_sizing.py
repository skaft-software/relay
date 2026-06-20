"""Tests for size-model.py's structured (--json) result builder.

This is the single source of truth for the sizing-coupled launch flags the TUI
bakes into start scripts. The launch flags MUST always travel together with the
max_ctx they were computed for: quantized KV (--cache-type-k/v q4_0),
--flash-attn on, --parallel 1, -ngl 999, and the chosen MoE offload flag.
"""
import pytest


def _meta(nl=48, train_ctx=262144, arch="qwen3moe"):
    return {"nl": nl, "train_ctx": train_ctx, "arch": arch, "nexp": 128, "nact": 8}


# A minimal but representative compute() detail dict.
def _bd(**over):
    bd = {
        "vram_budget": 14.0, "nonex": 2.0, "exp_total": 8.0, "exp_gpu": 4.0,
        "exp_cpu": 4.0, "kv_gb": 1.5, "kv_ptok": 100.0, "n_cache": 48, "n_kv": 48,
        "n_cpu_moe": 0, "cpu_moe": False, "draft_gb": 0.0, "dram_need": 0.0,
        "dram_free": 32.0, "headroom_gb": 2.0, "headroom_pct": 14.0,
        "min_headroom_pct": 5, "safety_factor": 1.0, "sensitivity": [],
        "max_overhead_pct": 20, "safety_mb": 512, "compute_mb": 1024,
        "overhead_pct": 5,
    }
    bd.update(over)
    return bd


def test_max_ctx_passthrough(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(), 98304, 0, False, _bd())
    assert r["max_ctx"] == 98304
    assert r["model"] == "/m/model.gguf"


def test_launch_flags_always_include_coupled_kv_perf_flags(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(), 98304, 0, False, _bd())
    f = r["launch_flags"]
    assert f[:2] == ["--ctx-size", "98304"]
    # the coupled flags that make max_ctx real
    assert "-ngl" in f and f[f.index("-ngl") + 1] == "999"
    assert "--parallel" in f and f[f.index("--parallel") + 1] == "1"
    assert "--flash-attn" in f and f[f.index("--flash-attn") + 1] == "on"
    assert f[f.index("--cache-type-k") + 1] == "q4_0"
    assert f[f.index("--cache-type-v") + 1] == "q4_0"
    assert "--jinja" in f


def test_all_gpu_has_no_moe_flag(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(), 98304, 0, False, _bd())
    assert r["cpu_moe"] is False
    assert r["n_cpu_moe"] == 0
    assert r["expert_flag"] == ""
    assert "--cpu-moe" not in r["launch_flags"]
    assert "--n-cpu-moe" not in r["launch_flags"]


def test_partial_offload_emits_n_cpu_moe(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(nl=48), 32768, 24, False, _bd(n_cpu_moe=24))
    assert r["cpu_moe"] is False
    assert r["n_cpu_moe"] == 24
    assert r["expert_flag"] == "--n-cpu-moe 24"
    f = r["launch_flags"]
    assert f[f.index("--n-cpu-moe") + 1] == "24"


def test_cpu_moe_emits_cpu_moe_flag(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(), 32768, 0, True, _bd(cpu_moe=True))
    assert r["cpu_moe"] is True
    assert r["expert_flag"] == "--cpu-moe"
    assert "--cpu-moe" in r["launch_flags"]


def test_ncm_at_or_above_layer_count_is_full_cpu_moe(sizer):
    """If offload count reaches every layer, it's effectively --cpu-moe."""
    r = sizer.build_result("/m/model.gguf", _meta(nl=48), 32768, 48, False, _bd(n_cpu_moe=48))
    assert r["cpu_moe"] is True
    assert r["expert_flag"] == "--cpu-moe"
    assert "--cpu-moe" in r["launch_flags"]
    assert "--n-cpu-moe" not in r["launch_flags"]


def test_headroom_and_arch_surfaced(sizer):
    r = sizer.build_result("/m/model.gguf", _meta(arch="gemma4"), 8192, 0, False, _bd(headroom_pct=9.3))
    assert r["arch"] == "gemma4"
    assert round(r["headroom_pct"], 1) == 9.3
