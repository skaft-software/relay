"""Tests for llama.cpp release-asset selection (Linux provisioning).

Ground truth: the real ggml-org/llama.cpp release assets are `.tar.gz`, named
`llama-<tag>-bin-<os>-<accel>-<arch>.tar.gz`. The Linux x64 assets observed on
tag b9739 (stable naming across b9736..b9739) are below. There is NO Linux CUDA
prebuilt — CUDA exists only for Windows.
"""
import pytest

# Real asset names captured from the live GitHub API (tag b9739).
LINUX_AND_MAC_ASSETS = [
    "llama-b9739-bin-macos-arm64.tar.gz",
    "llama-b9739-bin-macos-x64.tar.gz",
    "llama-b9739-bin-ubuntu-x64.tar.gz",            # CPU
    "llama-b9739-bin-ubuntu-vulkan-x64.tar.gz",     # Vulkan
    "llama-b9739-bin-ubuntu-rocm-7.2-x64.tar.gz",   # AMD ROCm
    "llama-b9739-bin-ubuntu-sycl-fp16-x64.tar.gz",
    "llama-b9739-bin-ubuntu-sycl-fp32-x64.tar.gz",
    "llama-b9739-bin-ubuntu-openvino-2026.2-x64.tar.gz",
    "llama-b9739-bin-ubuntu-arm64.tar.gz",
    "cudart-llama-bin-win-cuda-12.4-x64.zip",
    "llama-b9739-bin-win-cuda-12.4-x64.zip",
]


def _assets(names):
    return [{"name": n, "browser_download_url": f"https://example/{n}"} for n in names]


def test_amd_prefers_vulkan(tui):
    """AMD hosts get the Vulkan prebuilt (broadest AMD compat, no ROCm toolchain)."""
    chosen = tui.select_llama_asset(_assets(LINUX_AND_MAC_ASSETS), "amd")
    assert chosen is not None
    assert chosen["name"] == "llama-b9739-bin-ubuntu-vulkan-x64.tar.gz"


def test_nvidia_falls_back_to_vulkan_when_no_linux_cuda(tui):
    """No Linux CUDA prebuilt exists, so NVIDIA defaults to the Vulkan build."""
    chosen = tui.select_llama_asset(_assets(LINUX_AND_MAC_ASSETS), "nvidia")
    assert chosen is not None
    assert chosen["name"] == "llama-b9739-bin-ubuntu-vulkan-x64.tar.gz"


def test_unknown_vendor_gets_cpu_build(tui):
    """Unknown/no-GPU hosts get the plain CPU ubuntu-x64 build, not an accel build."""
    chosen = tui.select_llama_asset(_assets(LINUX_AND_MAC_ASSETS), "unknown")
    assert chosen is not None
    assert chosen["name"] == "llama-b9739-bin-ubuntu-x64.tar.gz"


def test_never_picks_macos_windows_arm_sycl_openvino(tui):
    """The matcher must never return a non-Linux-x64 or unsupported-accel asset."""
    for vendor in ("amd", "nvidia", "unknown"):
        chosen = tui.select_llama_asset(_assets(LINUX_AND_MAC_ASSETS), vendor)
        name = chosen["name"]
        assert "macos" not in name
        assert "win" not in name
        assert "arm64" not in name
        assert "sycl" not in name
        assert "openvino" not in name
        assert name.endswith(".tar.gz")


def test_amd_falls_back_to_cpu_when_only_cpu_present(tui):
    """If no Vulkan/ROCm asset exists, AMD still gets a working CPU build."""
    chosen = tui.select_llama_asset(
        _assets(["llama-b9739-bin-ubuntu-x64.tar.gz",
                 "llama-b9739-bin-macos-arm64.tar.gz"]), "amd")
    assert chosen["name"] == "llama-b9739-bin-ubuntu-x64.tar.gz"


def test_returns_none_when_no_linux_asset(tui):
    """No Linux x64 asset at all -> None (caller shows manual instructions)."""
    chosen = tui.select_llama_asset(
        _assets(["llama-b9739-bin-macos-arm64.tar.gz",
                 "llama-b9739-bin-win-cuda-12.4-x64.zip"]), "amd")
    assert chosen is None
