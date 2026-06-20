"""The TUI consumes size-model.py --json as the single source of truth.

parse_size_result() turns size-model's JSON stdout into the values the TUI bakes
into a start script: max_ctx, the launch_flags list, and the human expert label.
No regex scraping, no hardcoded KV flags.
"""
import json
import pytest


def _json(**over):
    base = {
        "model": "/m/model.gguf", "arch": "qwen3moe", "max_ctx": 98304,
        "train_ctx": 262144, "cpu_moe": False, "n_cpu_moe": 0, "expert_flag": "",
        "launch_flags": ["--ctx-size", "98304", "-ngl", "999", "--parallel", "1",
                         "--flash-attn", "on", "--cache-type-k", "q4_0",
                         "--cache-type-v", "q4_0"],
        "headroom_pct": 12.0,
    }
    base.update(over)
    return json.dumps(base)


def test_parses_ctx_and_flags(tui):
    ctx, flags, expert, err = tui.parse_size_result(_json())
    assert err is None
    assert ctx == 98304
    assert flags[:2] == ["--ctx-size", "98304"]
    assert "--cache-type-k" in flags and "q4_0" in flags
    assert expert == ""


def test_parses_cpu_moe_expert(tui):
    ctx, flags, expert, err = tui.parse_size_result(
        _json(cpu_moe=True, expert_flag="--cpu-moe",
              launch_flags=["--ctx-size", "32768", "--cpu-moe"]))
    assert err is None
    assert expert == "--cpu-moe"
    assert "--cpu-moe" in flags


def test_error_json_returns_message(tui):
    ctx, flags, expert, err = tui.parse_size_result(
        json.dumps({"error": "Cannot fit model — no room for KV cache"}))
    assert ctx == 0
    assert flags == []
    assert err and "Cannot fit" in err


def test_garbage_returns_error_not_crash(tui):
    ctx, flags, expert, err = tui.parse_size_result("not json at all\n")
    assert ctx == 0
    assert flags == []
    assert err  # some message, no exception
