"""Tests for catalog loading, classify, and companion matching."""
from pathlib import Path

import pytest


def test_load_catalog_loads_all_entries(tui):
    models = tui.load_catalog()
    assert len(models) >= 8
    for m in models:
        assert m["key"]
        assert m["repo"]
        assert m["file"]
        assert m["arch"]
        assert m["quant"]
        assert "multimodal" in m
        assert m["url"].startswith("https://huggingface.co/")
        assert m["notes"]


def test_catalog_has_required_arches(tui):
    models = tui.load_catalog()
    arches = {m["arch"] for m in models}
    # Must include the arches size-model.py understands
    assert arches & {"gemma4", "qwen35", "qwen35moe", "qwen3moe", "qwen3next", "deepseek2"}


def test_classify_base(tui):
    assert tui.classify(Path("model.gguf")) == "base"
    assert tui.classify(Path("some-path/model-q4.gguf")) == "base"


def test_classify_mmproj(tui):
    assert tui.classify(Path("mmproj-model.gguf")) == "mmproj"
    assert tui.classify(Path("model-mmproj-F16.gguf")) == "mmproj"


def test_classify_draft(tui):
    assert tui.classify(Path("mtp-model.gguf")) == "draft"
    assert tui.classify(Path("model-draft.gguf")) == "draft"
    assert tui.classify(Path("some-mtp-variant.gguf")) == "draft"


def test_gguf_magic_ok(tmp_path, tui):
    gguf = tmp_path / "real.gguf"
    gguf.write_bytes(b"GGUF\x03\x00\x00\x00" + b"\x00" * 100)
    assert tui.gguf_magic_ok(gguf)

    fake = tmp_path / "fake.gguf"
    fake.write_text("not a gguf")
    assert not tui.gguf_magic_ok(fake)


def test_strip_markers_removes_suffixes(tui):
    assert tui._strip_markers("model.gguf") == "model"
    assert tui._strip_markers("model-q4_k_m.gguf") == "model-q4_k_m"
    assert tui._strip_markers("mtp-model.gguf") == "model"
    assert tui._strip_markers("model-mmproj-F16.gguf") == "model"
    assert tui._strip_markers("model-draft.gguf") == "model"


def test_fits_within_budget(tui):
    model = {"size_gb": 5.0}
    assert tui.fits(model, 8.0)
    assert not tui.fits(model, 6.0)  # 5.0 + 1.5 = 6.5 > 6.0
    assert not tui.fits({"size_gb": None}, 99.0)
