"""Tests for non-TTY fallback (numbered menu) and hardware math."""
import io
import sys
from unittest.mock import patch

import pytest


# ── Non-TTY fallback ──────────────────────────────────────────────────────

def test_fallback_pick_single_selects_first_by_default(tui, monkeypatch):
    """Empty input (just Enter) returns index 0."""
    monkeypatch.setattr("builtins.input", lambda _: "")
    opts = [{"label": "Alpha"}, {"label": "Beta"}, {"label": "Gamma"}]
    result = tui._fallback_pick("Pick one", opts, multi=False)
    assert result == [0]  # defaults to first


def test_fallback_pick_selects_numbered_entry(tui, monkeypatch):
    monkeypatch.setattr("builtins.input", lambda _: "3")
    opts = [{"label": "A"}, {"label": "B"}, {"label": "C"}]
    result = tui._fallback_pick("Pick", opts, multi=False)
    assert result == [2]  # 3 → index 2


def test_fallback_pick_out_of_range_clamped(tui, monkeypatch):
    """Out-of-range numbers are ignored, defaults to index 0."""
    monkeypatch.setattr("builtins.input", lambda _: "99")
    opts = [{"label": "A"}, {"label": "B"}]
    result = tui._fallback_pick("Pick", opts, multi=False)
    assert result == [0]  # 99 is invalid, falls back to 0


def test_fallback_pick_multi_comma_separated(tui, monkeypatch):
    monkeypatch.setattr("builtins.input", lambda _: "1,3")
    opts = [{"label": "A"}, {"label": "B"}, {"label": "C"}]
    result = tui._fallback_pick("Pick", opts, multi=True)
    assert result == [0, 2]


def test_fallback_pick_multi_space_separated(tui, monkeypatch):
    monkeypatch.setattr("builtins.input", lambda _: "2 1")
    opts = [{"label": "A"}, {"label": "B"}, {"label": "C"}]
    result = tui._fallback_pick("Pick", opts, multi=True)
    assert result == [1, 0]  # order matches input, not sorted


def test_fallback_pick_eof_raises_quitwizard(tui, monkeypatch):
    monkeypatch.setattr("builtins.input", lambda _: (_ for _ in ()).throw(EOFError()))
    with pytest.raises(tui.QuitWizard):
        tui._fallback_pick("Pick", [{"label": "A"}], multi=False)


# ── Hardware math ─────────────────────────────────────────────────────────

def test_vram_budget_gb_with_gpu(tui):
    hw = ("box", 16 * 1073741824, 32 * 1073741824, 500 * 1073741824, "amd")
    assert tui.vram_budget_gb(hw) == pytest.approx(16.0, abs=0.5)


def test_vram_budget_gb_without_gpu(tui):
    hw = ("box", 0, 32 * 1073741824, 500 * 1073741824, "cpu")
    # 60% of 32GB RAM
    assert tui.vram_budget_gb(hw) == pytest.approx(19.2, abs=0.5)


def test_hw_verdict_plenty(tui):
    hw = ("box", 24 * 1073741824, 0, 0, "amd")
    assert "plenty" in tui.hw_verdict(hw).lower()


def test_hw_verdict_comfy(tui):
    hw = ("box", 12 * 1073741824, 0, 0, "amd")
    verdict = tui.hw_verdict(hw).lower()
    assert "comfy" in verdict or "coding" in verdict


def test_hw_verdict_modest(tui):
    hw = ("box", 0, 8 * 1073741824, 0, "cpu")  # no GPU, 8GB RAM → budget ~4.8GB
    verdict = tui.hw_verdict(hw).lower()
    assert "modest" in verdict or "small" in verdict


def test_detect_hw_runs_without_crashing(tui):
    """detect_hw should always return a 5-tuple regardless of environment."""
    result = tui.detect_hw()
    assert len(result) == 5
    label, vram, ram, disk, vendor = result
    assert isinstance(label, str) and label
    assert isinstance(vram, int) and vram >= 0
    assert isinstance(ram, int) and ram >= 0
    assert isinstance(disk, int) and disk >= 0
    assert vendor in ("apple", "nvidia", "amd", "cpu")


def test_vram_budget_gb_never_zero(tui):
    """Even with no GPU and tiny RAM, budget should be non-negative."""
    hw = ("box", 0, 0, 0, "cpu")
    assert tui.vram_budget_gb(hw) >= 0
