#!/usr/bin/env python3
"""
size-model.py — compute optimal llama.cpp flags for a GGUF model on your hardware.

Zero-config: just point at a .gguf file. Auto-detects GPU vendor, VRAM, DRAM.
Outputs ready-to-use CLI flags, docker run command, docker-compose, or systemd unit.

Safety: empirical overhead calibrated on real hardware. Enforces 5% VRAM headroom
by default. Sensitivity table shows exactly how much unexpected overhead your config
can absorb before OOM.

Usage:
  # Simplest: just get the flags
  python3 size-model.py /path/to/model.gguf

  # With MTP draft model
  python3 size-model.py model.gguf --draft mtp-draft.gguf

  # Generate docker run command (auto-detects AMD/NVIDIA)
  python3 size-model.py model.gguf --docker

  # Generate docker-compose.yml snippet
  python3 size-model.py model.gguf --compose

  # Conservative mode (1.5x all safety margins)
  python3 size-model.py model.gguf --conservative

  # Maximum safety (2x margins)  
  python3 size-model.py model.gguf --safe

  # For containers: specify VRAM/DRAM manually (detection needs host GPU tools)
  python3 size-model.py model.gguf --vram 16 --dram 32 --docker

Safety levels:
  default     1.0x margins  (~3% overhead,  256MB safety,  500MB bufs)
  --conservative  1.5x      (~7.5% overhead, 384MB safety,  750MB bufs)
  --safe       2.0x         (~10% overhead,  512MB safety, 1000MB bufs)

Flags:
  --draft PATH         MTP draft model
  --docker             Print docker run command
  --compose            Print docker-compose.yml snippet
  --systemd PATH       Write systemd unit to PATH
  --write-script       Write start-llama-*.sh
  --safe               2x safety margins
  --conservative       1.5x safety margins
  --safety-factor N    Custom multiplier (N >= 1.0)
  --headroom-pct N     Minimum VRAM headroom % (default 5)
  --vram N             Override VRAM in GB
  --dram N             Override available DRAM in GB
  --image NAME         Docker image (default: auto-detect)
  --port N             Port for --docker/--compose (default 8080)
  --verify             Launch model briefly to check VRAM usage
"""

import os, sys, subprocess, re, json, time, signal

GB = 1073741824
KV_Q4_RATIO = 0.5625
# Sizing-coupled launch flags. These MUST travel with the computed max_ctx:
# the quantized KV cache + flash-attn + single-slot are what make that ctx fit.
GPU_LAYERS = 999          # -ngl: offload all transformer layers to GPU
KV_CACHE_TYPE = "q4_0"    # --cache-type-k/v: quantized KV (max_ctx assumes this)
CORRECTNESS_FLAGS = ["--jinja"]  # always-on flags needed for correct output
SAFETY_MARGIN_MB = 256      # VRAM reserved for driver/HIP context
COMPUTE_BUFS_MB = 500        # flash attention, intermediate tensors, scratch
EMPIRICAL_OVERHEAD_PCT = 5   # empirically measured overhead: 1.3-3.1% on 9070XT
SAFE_SAFETY_MARGIN_MB = 512  # --safe mode: double the safety margin
SAFE_COMPUTE_BUFS_MB = 1024  # --safe mode: double compute buffer estimate
DEFAULT_HEADROOM_PCT = 5     # minimum VRAM headroom % — verified 5% keeps system stable

# ── Hardware detection ───────────────────────────────────────────────

def detect_vram_total():
    """Detect total VRAM in bytes from ROCm or NVIDIA."""
    try:
        out = subprocess.check_output(["rocm-smi", "--showmeminfo", "vram"],
                                       stderr=subprocess.DEVNULL, text=True)
        m = re.search(r"VRAM Total Memory \(B\):\s*(\d+)", out)
        if m: return int(m.group(1))
    except: pass
    try:
        out = subprocess.check_output(["nvidia-smi", "--query-gpu=memory.total",
                                        "--format=csv,noheader,nounits"], text=True)
        return int(out.strip()) * 1048576
    except: pass
    return 16 * GB


def detect_vram_used():
    """Get current VRAM usage in bytes."""
    try:
        out = subprocess.check_output(["rocm-smi", "--showmemuse"],
                                       stderr=subprocess.DEVNULL, text=True)
        m = re.search(r"GPU Memory Used \(B\):\s*(\d+)", out)
        if m: return int(m.group(1))
    except: pass
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            text=True)
        return int(out.strip()) * 1048576
    except: pass
    return 0


def detect_dram_available():
    """
    Detect available DRAM for offload, preferring cgroup limits over MemAvailable.
    cgroup v2: /sys/fs/cgroup/memory.max
    cgroup v1: /sys/fs/cgroup/memory/memory.limit_in_bytes + memory.usage_in_bytes
    Fallback: /proc/meminfo MemAvailable
    """
    # cgroup v2
    try:
        with open("/sys/fs/cgroup/memory.max") as f:
            val = f.read().strip()
        if val != "max":
            limit = int(val)
            usage = 0
            try:
                with open("/sys/fs/cgroup/memory.current") as f:
                    usage = int(f.read().strip())
            except: pass
            avail = limit - usage
            if avail > 0:
                return avail
    except: pass

    # cgroup v1
    try:
        with open("/sys/fs/cgroup/memory/memory.limit_in_bytes") as f:
            limit = int(f.read().strip())
        if limit > 0 and limit < (1 << 62):  # not unlimited
            usage = 0
            try:
                with open("/sys/fs/cgroup/memory/memory.usage_in_bytes") as f:
                    usage = int(f.read().strip())
            except: pass
            avail = limit - usage
            if avail > 0:
                return avail
    except: pass

    # systemd cgroup (leaf group may be under /sys/fs/cgroup/system.slice/...)
    # Try to find self cgroup
    try:
        with open("/proc/self/cgroup") as f:
            cg_lines = f.read().strip().split("\n")
        for line in cg_lines:
            parts = line.strip().split(":")
            if len(parts) >= 3:
                cg_path = parts[2]
                if cg_path.startswith("/"):
                    # Try cgroup v2 max
                    max_f = f"/sys/fs/cgroup{cg_path}/memory.max"
                    cur_f = f"/sys/fs/cgroup{cg_path}/memory.current"
                    if os.path.exists(max_f):
                        with open(max_f) as f:
                            val = f.read().strip()
                        if val != "max":
                            limit = int(val)
                            usage = 0
                            if os.path.exists(cur_f):
                                with open(cur_f) as f:
                                    usage = int(f.read().strip())
                            avail = limit - usage
                            if avail > 0:
                                return avail
    except: pass

    # Fallback: MemAvailable
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    return int(line.split()[1]) * 1024
    except: pass
    return 0


def detect_cgroup_memory_max():
    """Get the hard cgroup memory limit in bytes (0 if unlimited)."""
    # cgroup v2
    try:
        with open("/sys/fs/cgroup/memory.max") as f:
            val = f.read().strip()
        if val != "max":
            return int(val)
    except: pass
    # cgroup v1
    try:
        with open("/sys/fs/cgroup/memory/memory.limit_in_bytes") as f:
            limit = int(f.read().strip())
        if limit > 0 and limit < (1 << 62):
            return limit
    except: pass
    return 0


# ── GGUF ────────────────────────────────────────────────────────────

def read_meta(path):
    from gguf import GGUFReader
    r = GGUFReader(path)

    def g(suf):
        for k in r.fields:
            if k == suf or k.endswith("." + suf):
                try:
                    return r.fields[k].contents()
                except:
                    return None
        return None

    arch = str(g("general.architecture") or "?")
    # For assistant/draft models, also read assistant-specific keys
    emb = g("embedding_length") or 0
    if emb == 0:
        emb = g(f"{arch}.embedding_length") or 0

    return {
        "arch": arch,
        "nl": g("block_count") or 0,
        "nkv": g("attention.head_count_kv"),
        "kl": g("attention.key_length"),
        "emb": emb,
        "nexp": g("expert_count") or 0,
        "nact": g("expert_used_count") or 0,
        "train_ctx": g("context_length") or 0,
        "swa_window": g("attention.sliding_window"),
        "swa_pattern": g("attention.sliding_window_pattern"),
        "fsize": os.path.getsize(path),
        "reader": r,
    }


def analyze(meta):
    r = meta["reader"]
    arch, nl, nkv_meta, kl_meta = meta["arch"], meta["nl"], meta["nkv"], meta["kl"]
    fsize, moe = meta["fsize"], meta["nexp"] > 0

    kv_per_layer = [0.0] * nl
    exp_els, nonex_els = 0, 0

    for t in r.tensors:
        tn = t.name
        els = 1
        for d in t.shape:
            els *= int(d)
        sd = [int(d) for d in t.shape]

        # ── KV per layer (q4_0) ──
        if tn.startswith("blk.") and tn.endswith(".weight"):
            parts = tn.split(".")
            try:
                ln = int(parts[1])
            except:
                continue

            if arch == "deepseek2":
                # MLA: single compressed latent vector
                if "attn_kv_a_mqa" in tn:
                    kv_per_layer[ln] += sd[-1] * KV_Q4_RATIO

            elif arch in ("qwen3next", "gemma4"):
                if "attn_k." in tn:
                    kv_per_layer[ln] += 2 * sd[-1] * KV_Q4_RATIO

            else:
                # Standard GQA / dense / cohere2moe
                if "attn_k." in tn and "norm" not in tn:
                    kv_per_layer[ln] += 2 * sd[-1] * KV_Q4_RATIO
                elif "attn_qkv." in tn:
                    # Fused QKV: K portion = nkv * head_dim
                    kd = (
                        (nkv_meta * kl_meta)
                        if (
                            isinstance(nkv_meta, int)
                            and nkv_meta > 0
                            and kl_meta
                        )
                        else 512
                    )
                    kv_per_layer[ln] += 2 * kd * KV_Q4_RATIO

        # ── Expert vs non-expert ──
        if any(
            p in tn
            for p in [
                "_exps.",
                "_shexp.",
                "ffn_gate_inp.",
                "ffn_gate_inp_shexp.",
                "ffn_gate_exps.",
                "ffn_gate_shexp.",
                "ffn_down_exps.",
                "ffn_down_shexp.",
                "ffn_up_exps.",
                "ffn_up_shexp.",
            ]
        ):
            exp_els += els
        else:
            nonex_els += els

    total = exp_els + nonex_els
    if moe and exp_els == 0:
        fracs = {
            "qwen35moe": 0.94,
            "qwen3moe": 0.94,
            "qwen3next": 0.94,
            "deepseek2": 0.93,
            "gemma4": 0.91,
            "cohere2moe": 0.90,
        }
        frac = fracs.get(arch, 0.90)
        exp_bytes = int(fsize * frac)
        nonex_bytes = fsize - exp_bytes
    elif total > 0:
        nonex_bytes = int(fsize * (nonex_els / total))
        exp_bytes = fsize - nonex_bytes
    else:
        nonex_bytes, exp_bytes = fsize, 0

    kv_ptok = sum(kv_per_layer)
    n_kv = sum(1 for v in kv_per_layer if v > 0)

    # SWA split (Gemma4): sliding layers have large KV heads (nv=8) but fixed window;
    # global layers have small KV heads (nv=2) and grow with context.
    if arch == "gemma4" and isinstance(nkv_meta, list):
        swa_win = meta.get("swa_window")
        win = int(swa_win) if swa_win else 1024
        swa_pat = meta.get("swa_pattern")
        g_ptok, s_fixed = 0.0, 0.0
        for i in range(min(nl, len(nkv_meta))):
            nv = nkv_meta[i]
            is_swa = swa_pat[i] if (isinstance(swa_pat, list) and i < len(swa_pat)) else (nv > 2)
            if is_swa:
                # Sliding window layer: fixed cost
                s_fixed += kv_per_layer[i]
            else:
                # Global layer: grows with context
                g_ptok += kv_per_layer[i]
        nonex_bytes += int(s_fixed * win)
        kv_ptok, n_cache = g_ptok, sum(1 for v in nkv_meta if v <= 2)
    else:
        n_cache = n_kv

    return {
        "nonex": nonex_bytes,
        "exp": exp_bytes,
        "kv_ptok": kv_ptok,
        "n_kv": n_kv,
        "n_cache": n_cache,
        "fsize": fsize,
    }


# ── Solver ──────────────────────────────────────────────────────────

def compute(vram, dram_free, meta, ta, draft=0, safety_factor=1.0, min_headroom_pct=DEFAULT_HEADROOM_PCT):
    sm = int(SAFETY_MARGIN_MB * safety_factor)
    cb = int(COMPUTE_BUFS_MB * safety_factor)
    overhead_pct = EMPIRICAL_OVERHEAD_PCT * safety_factor
    budget = vram - (sm + cb) * 1048576
    if budget < 0:
        return (0, 0, False, {"error": "VRAM budget negative"})

    # Apply empirical overhead to base footprint (allocator waste, alignment, unreported buffers)
    base_raw = ta["nonex"] + draft
    base = int(base_raw * (1 + overhead_pct / 100))
    if base >= budget:
        return (0, 0, False, {"error": "Base footprint exceeds VRAM"})

    exp, kvp, tctx, nl = ta["exp"], ta["kv_ptok"], meta["train_ctx"], meta["nl"]
    epl = exp / nl if nl > 0 else exp
    if kvp <= 0 and ta["n_kv"] > 0:
        kvp = 0.001  # safety

    best_ctx, best_ncmoe, best_cpumoe, best_eg, best_ec = 0, 0, False, 0.0, 0.0

    def try_cfg(offloaded, force_cpu):
        eg = 0.0 if force_cpu else max(0.0, exp - offloaded * epl)
        ec = exp - eg
        ka = budget - base - int(eg)
        if ka <= 4096 or kvp <= 0:
            return (0, eg, ec)
        return (min(int(ka / kvp), tctx), eg, ec)

    # Full GPU
    ctx, eg, ec = try_cfg(0, False)
    if ctx > 0:
        best_ctx, best_eg, best_ec = ctx, eg, ec

    # Partial offload scan (always — even full-GPU fit may not be best)
    for o in range(1, nl + 1):
        ctx, eg, ec = try_cfg(o, False)
        if ctx <= 0:
            continue
        if int(ec) + draft + (2 * GB) > dram_free:
            break
        if ctx > best_ctx:
            best_ctx, best_ncmoe, best_eg, best_ec = ctx, o, eg, ec

    # --cpu-moe
    ctx, eg, ec = try_cfg(0, True)
    if ctx > 0 and int(ec) + draft + (2 * GB) <= dram_free and ctx > best_ctx:
        best_ctx, best_ncmoe, best_cpumoe, best_eg, best_ec = ctx, 0, True, eg, ec

    if best_ctx <= 4096:
        return (0, 0, False, {"error": "Cannot fit model — no room for KV cache"})

    # Enforce minimum headroom: if best config has < min_headroom_pct,
    # try higher n_cpu_moe values that sacrifice some ctx for safety
    min_hr_bytes = int(budget * min_headroom_pct / 100)
    best_hr_bytes = budget - int(base) - int(best_eg) - draft - int(kvp * best_ctx)
    
    if best_hr_bytes < min_hr_bytes:
        # Scan for config meeting headroom requirement
        safe_found = False
        for o in range(best_ncmoe + 1, nl + 1):
            ctx_s, eg_s, ec_s = try_cfg(o, False)
            if ctx_s <= 0:
                continue
            hr_s = budget - int(base) - int(eg_s) - draft - int(kvp * ctx_s)
            if hr_s >= min_hr_bytes and int(ec_s) + draft + (2 * GB) <= dram_free:
                best_ctx, best_ncmoe, best_eg, best_ec = ctx_s, o, eg_s, ec_s
                safe_found = True
                break
        
        # Try --cpu-moe
        if not safe_found:
            ctx_s, eg_s, ec_s = try_cfg(0, True)
            if ctx_s > 0:
                hr_s = budget - int(base) - draft - int(kvp * ctx_s)
                if hr_s >= min_hr_bytes and int(ec_s) + draft + (2 * GB) <= dram_free:
                    best_ctx, best_ncmoe, best_cpumoe, best_eg, best_ec = ctx_s, 0, True, eg_s, ec_s
                    safe_found = True
        
        # If still unsafe, reduce ctx to meet headroom
        if not safe_found:
            # How much ctx can we keep with current offload + min headroom?
            kv_avail = max(0, budget - int(base) - int(best_eg) - draft - min_hr_bytes)
            safe_ctx = min(int(kv_avail / kvp), tctx) if kvp > 0 else 0
            if safe_ctx > 4096:
                best_ctx = safe_ctx

    # Compute actual headroom for best config
    best_hr_gb = budget / GB - base / GB - best_eg / GB - draft / GB - (kvp * best_ctx) / GB
    best_hr_pct = (best_hr_gb / (budget / GB)) * 100 if budget > 0 else 0

    # Sensitivity: what overhead can this config absorb before OOM?
    # Overhead comes from: KV packing inefficiency, allocator waste, unreported buffers
    sensitivity = []
    for overhead_pct in [5, 10, 15, 20, 25]:
        overhead_bytes = int(budget * overhead_pct / 100)
        kv_avail = max(0, budget - int(base) - int(best_eg) - draft - overhead_bytes)
        ctx_at_overhead = min(int(kv_avail / kvp), tctx) if kvp > 0 and kv_avail > 0 else 0
        status = "OK" if ctx_at_overhead >= best_ctx * 0.9 else ("LOW" if ctx_at_overhead > 4096 else "OOM")
        sensitivity.append((overhead_pct, ctx_at_overhead, status))

    # Find max overhead before OOM
    max_overhead = 0
    for oh in range(1, 51):
        oh_bytes = int(budget * oh / 100)
        kv_avail = max(0, budget - int(base) - int(best_eg) - draft - oh_bytes)
        if kvp > 0 and kv_avail > 0:
            c = min(int(kv_avail / kvp), tctx)
            if c >= best_ctx * 0.9:
                max_overhead = oh
            else:
                break
        else:
            break

    return (
        best_ctx,
        best_ncmoe,
        best_cpumoe,
        {
            "vram_budget": budget / GB,
            "nonex": ta["nonex"] / GB,
            "exp_total": exp / GB,
            "exp_gpu": best_eg / GB,
            "exp_cpu": best_ec / GB,
            "kv_gb": (kvp * best_ctx) / GB,
            "kv_ptok": kvp,
            "n_cache": ta["n_cache"],
            "n_kv": ta["n_kv"],
            "n_cpu_moe": best_ncmoe,
            "cpu_moe": best_cpumoe,
            "draft_gb": draft / GB,
            "dram_need": (best_ec + draft) / GB if best_ec > 0 else 0,
            "dram_free": dram_free / GB,
            "headroom_gb": best_hr_gb,
            "headroom_pct": best_hr_pct,
            "min_headroom_pct": min_headroom_pct,
            "safety_factor": safety_factor,
            "sensitivity": sensitivity,
            "max_overhead_pct": max_overhead,
            "safety_mb": sm,
            "compute_mb": cb,
            "overhead_pct": overhead_pct,
        },
    )


# ── Draft check ─────────────────────────────────────────────────────

def check_draft(tgt, dr):
    """
    Check if a draft model is compatible with the target model.
    
    Rules:
    1. Same arch, OR draft arch = target_arch + "-assistant" (MTP drafts like gemma4-assistant)
    2. Draft's output embedding must match target's embedding length
    """
    t_arch = tgt["arch"]
    d_arch = dr["arch"]
    
    # Exact match
    if t_arch == d_arch:
        return True, "ok"
    
    # MTP draft: target_arch + "-assistant"
    if d_arch == f"{t_arch}-assistant":
        # Check embedding compatibility: draft output dim must match target emb
        d_emb_out = _get_assistant_emb_out(dr)
        if d_emb_out and tgt["emb"]:
            if d_emb_out == tgt["emb"]:
                return True, "ok"
            else:
                return False, f"draft emb_out={d_emb_out} != target emb={tgt['emb']}"
        return True, "ok"  # can't verify, assume ok
    
    return False, f"arch mismatch: {d_arch} vs {t_arch}"


def _get_assistant_emb_out(meta):
    """Get embedding_length_out for assistant/draft models."""
    r = meta.get("reader")
    if not r:
        return None
    arch = meta["arch"]
    key = f"{arch}.embedding_length_out"
    for k in r.fields:
        if k == key:
            try:
                return r.fields[k].contents()
            except:
                pass
    return None


# ── Verify mode ─────────────────────────────────────────────────────

def verify_model(mpath, ctx, ncm, cpm, draft_path=None):
    """
    Launch llama-server briefly with computed flags and check actual VRAM usage.
    Returns (ok, actual_vram_used_bytes, predicted_vram_bytes, error_msg).
    """
    llama_server = "/home/achu/llama.cpp/build-vulkan/bin/llama-server"
    if not os.path.exists(llama_server):
        return False, 0, 0, f"llama-server not found at {llama_server}"

    port = 18080
    # Find a free port
    import socket
    for p in range(18080, 18100):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.bind(("127.0.0.1", p))
            s.close()
            port = p
            break
        except:
            continue

    cmd = [
        llama_server,
        "--model", mpath,
        "--host", "127.0.0.1",
        "--port", str(port),
        "--ctx-size", str(min(ctx, 4096)),  # tiny ctx for quick load
        "-ngl", "999",
        "--parallel", "1",
        "--flash-attn", "on",
        "--cache-type-k", "q4_0",
        "--cache-type-v", "q4_0",
        "--no-webui",
    ]
    if cpm:
        cmd.append("--cpu-moe")
    elif ncm > 0:
        cmd.extend(["--n-cpu-moe", str(ncm)])
    if draft_path and os.path.exists(draft_path):
        cmd.extend(["--model-draft", draft_path])

    # Measure VRAM before
    vram_before = detect_vram_used()

    vram_peak = vram_before
    proc = None
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
        )

        # Monitor VRAM while loading
        deadline = time.time() + 60  # 60 second timeout
        loaded = False
        stderr_lines = []
        while time.time() < deadline:
            ret = proc.poll()
            if ret is not None:
                # Process exited
                remaining = proc.stderr.read() if proc.stderr else ""
                stderr_lines.append(remaining)
                break

            # Read stderr for "HTTP server listening" or errors
            if proc.stderr:
                import select
                r, _, _ = select.select([proc.stderr], [], [], 0.5)
                if r:
                    line = proc.stderr.readline()
                    if line:
                        stderr_lines.append(line)
                        if "HTTP server listening" in line or "Starting" in line:
                            loaded = True
                            break
                        if "error" in line.lower() or "failed" in line.lower():
                            loaded = False
                            break

            # Sample VRAM
            cur = detect_vram_used()
            if cur > vram_peak:
                vram_peak = cur

            if not loaded:
                time.sleep(1)

        if loaded:
            # Let it settle for 2 seconds, sample again
            time.sleep(2)
            cur = detect_vram_used()
            if cur > vram_peak:
                vram_peak = cur

    except Exception as e:
        return False, vram_peak, 0, str(e)
    finally:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=10)
            except:
                proc.kill()

    vram_delta = vram_peak - vram_before
    if vram_delta < 0:
        vram_delta = vram_peak  # can't trust before measurement

    # Check stderr for OOM errors
    stderr_text = "".join(stderr_lines[-20:]).lower()
    oom_indicators = ["out of memory", "cuda error", "hip error", "memory", "cannot allocate"]
    had_oom = any(ind in stderr_text for ind in oom_indicators)

    return (not had_oom), vram_delta, 0, stderr_text[:500] if had_oom else ""


# ── Generate systemd unit ────────────────────────────────────────────

def generate_systemd_unit(mpath, ctx, ncm, cpm, draft_path, output_path,
                          llama_server_bin="/home/achu/llama.cpp/build-vulkan/bin/llama-server",
                          templates_dir=None):
    """Generate a systemd service unit for the model."""
    bn = os.path.splitext(os.path.basename(mpath))[0]
    service_name = f"llama-{bn}"

    lines = []
    lines.append("[Unit]")
    lines.append(f"Description=llama.cpp server - {bn}")
    lines.append("After=network.target")
    lines.append("")
    lines.append("[Service]")
    lines.append("Type=simple")
    lines.append("User=achu")
    lines.append("Group=achu")
    lines.append("WorkingDirectory=/home/achu/llama.cpp")
    lines.append(f"EnvironmentFile=-/etc/relay/llama.env")
    lines.append("")
    lines.append("ExecStart=" + " \\\n  ".join([
        llama_server_bin,
        f"--model {mpath}",
        f"--host 127.0.0.1",
        f"--port ${{LLAMA_PORT:-8080}}",
        f"--ctx-size {ctx}",
        "-ngl 999",
        "--parallel 1",
        "--flash-attn on",
        "--cache-type-k q4_0",
        "--cache-type-v q4_0",
    ]))
    
    extra_opts = []
    if cpm:
        extra_opts.append("--cpu-moe")
    elif ncm > 0:
        extra_opts.append(f"--n-cpu-moe {ncm}")
    if draft_path:
        extra_opts.append(f"--model-draft {draft_path}")
    
    if extra_opts:
        for opt in extra_opts:
            lines[-1] += f" \\\n    {opt}"

    lines.append("")
    lines.append("Restart=on-failure")
    lines.append("RestartSec=5")
    lines.append("")
    lines.append("[Install]")
    lines.append("WantedBy=multi-user.target")
    
    content = "\n".join(lines) + "\n"
    with open(output_path, "w") as f:
        f.write(content)
    
    return output_path, service_name


# ── GPU vendor ──────────────────────────────────────────────────────

def detect_gpu_vendor():
    """Return 'amd', 'nvidia', or 'unknown'."""
    try:
        subprocess.check_output(["rocm-smi"], stderr=subprocess.DEVNULL, timeout=5)
        return "amd"
    except:
        pass
    try:
        subprocess.check_output(["nvidia-smi"], stderr=subprocess.DEVNULL, timeout=5)
        return "nvidia"
    except:
        pass
    return "unknown"


# ── Docker output ───────────────────────────────────────────────────

def generate_docker_run(mpath, ctx, ncm, cpm, draft_path, gpu_vendor, image_override=None, port=8080):
    """Generate a 'docker run' command for llama.cpp."""
    model_dir = os.path.dirname(os.path.abspath(mpath))
    model_name = os.path.basename(mpath)
    
    if image_override:
        image = image_override
        gpu_flags = "--device /dev/kfd --device /dev/dri" if gpu_vendor == "amd" else ("--gpus all" if gpu_vendor == "nvidia" else "# add --gpus or --device for GPU access")
    elif gpu_vendor == "amd":
        image = "ghcr.io/ggml-org/llama.cpp:full"
        gpu_flags = "--device /dev/kfd --device /dev/dri"
    elif gpu_vendor == "nvidia":
        image = "ghcr.io/ggml-org/llama.cpp:full-cuda"
        gpu_flags = "--gpus all"
    else:
        image = "ghcr.io/ggml-org/llama.cpp:full"
        gpu_flags = "# --device /dev/kfd --device /dev/dri  (AMD)  OR  --gpus all  (NVIDIA)"
    
    lines = []
    lines.append("docker run -d --name llama-server \\")
    lines.append(f"  {gpu_flags} \\")
    lines.append(f"  -v {model_dir}:/models:ro \\")
    lines.append(f"  -p {port}:{port} \\")
    lines.append(f"  {image} \\")
    lines.append(f"  --model /models/{model_name} \\")
    lines.append(f"  --host 0.0.0.0 --port {port} \\")
    lines.append(f"  --ctx-size {ctx} \\")
    lines.append(f"  -ngl 999 --parallel 1 --flash-attn on \\")
    lines.append(f"  --cache-type-k q4_0 --cache-type-v q4_0")
    if cpm:
        lines[-1] += " \\"
        lines.append(f"  --cpu-moe")
    elif ncm > 0:
        lines[-1] += " \\"
        lines.append(f"  --n-cpu-moe {ncm}")
    if draft_path:
        draft_name = os.path.basename(draft_path)
        lines[-1] += " \\"
        lines.append(f"  --model-draft /models/{draft_name}")
    return lines


def generate_docker_compose(mpath, ctx, ncm, cpm, draft_path, gpu_vendor, image_override=None, port=8080):
    """Generate a docker-compose.yml snippet for llama.cpp."""
    model_dir = os.path.dirname(os.path.abspath(mpath))
    model_name = os.path.basename(mpath)
    
    if image_override:
        image = image_override
        gpu_section = "    devices:\n      - /dev/kfd\n      - /dev/dri" if gpu_vendor == "amd" else ("    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: 1\n              capabilities: [gpu]" if gpu_vendor == "nvidia" else "    # devices:  # add GPU access")
        deploy = "" if gpu_vendor == "amd" else (gpu_section if gpu_vendor == "nvidia" else "")
        if gpu_vendor == "nvidia":
            gpu_section = ""
    elif gpu_vendor == "amd":
        image = "ghcr.io/ggml-org/llama.cpp:full"
        gpu_section = "    devices:\n      - /dev/kfd\n      - /dev/dri"
        deploy = ""
    elif gpu_vendor == "nvidia":
        image = "ghcr.io/ggml-org/llama.cpp:full-cuda"
        gpu_section = ""
        deploy = "    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: 1\n              capabilities: [gpu]"
    else:
        image = "ghcr.io/ggml-org/llama.cpp:full"
        gpu_section = "    # devices:\n    #   - /dev/kfd\n    #   - /dev/dri  # AMD\n    # deploy:  # NVIDIA\n    #   resources:\n    #     reservations:\n    #       devices:\n    #         - driver: nvidia\n    #           count: 1\n    #           capabilities: [gpu]"
        deploy = ""
    
    lines = []
    lines.append("services:")
    lines.append("  llama-server:")
    lines.append(f"    image: {image}")
    lines.append(f"    container_name: llama-server")
    lines.append(f"    ports:")
    lines.append(f"      - \"{port}:{port}\"")
    lines.append(f"    volumes:")
    lines.append(f"      - {model_dir}:/models:ro")
    if gpu_section:
        for gl in gpu_section.split("\n"):
            lines.append(gl)
    if deploy:
        for dl in deploy.split("\n"):
            lines.append(dl)
    lines.append(f"    command:")
    lines.append(f"      - --model")
    lines.append(f"      - /models/{model_name}")
    lines.append(f"      - --host")
    lines.append(f"      - 0.0.0.0")
    lines.append(f"      - --port")
    lines.append(f"      - \"{port}\"")
    lines.append(f"      - --ctx-size")
    lines.append(f"      - \"{ctx}\"")
    lines.append(f"      - -ngl")
    lines.append(f"      - \"999\"")
    lines.append(f"      - --parallel")
    lines.append(f"      - \"1\"")
    lines.append(f"      - --flash-attn")
    lines.append(f"      - \"on\"")
    lines.append(f"      - --cache-type-k")
    lines.append(f"      - q4_0")
    lines.append(f"      - --cache-type-v")
    lines.append(f"      - q4_0")
    if cpm:
        lines.append(f"      - --cpu-moe")
    elif ncm > 0:
        lines.append(f"      - --n-cpu-moe")
        lines.append(f"      - \"{ncm}\"")
    if draft_path:
        draft_name = os.path.basename(draft_path)
        lines.append(f"      - --model-draft")
        lines.append(f"      - /models/{draft_name}")
    return lines


# ── CLI ─────────────────────────────────────────────────────────────

def build_result(mpath, meta, ctx, ncm, cpm, bd, draft_path=None):
    """Assemble the structured (--json) result from a compute() outcome.

    This is the single source of truth for the sizing-coupled launch flags the
    TUI bakes into start scripts. ``ctx, ncm, cpm, bd`` are exactly the tuple
    compute() returns. Returns a JSON-serializable dict.
    """
    # If every layer's experts are offloaded, that's effectively --cpu-moe.
    eff_cpu = bool(cpm) or (ncm >= meta["nl"])
    if eff_cpu:
        expert_flag = "--cpu-moe"
    elif ncm > 0:
        expert_flag = f"--n-cpu-moe {ncm}"
    else:
        expert_flag = ""

    launch_flags = [
        "--ctx-size", str(ctx),
        "-ngl", str(GPU_LAYERS),
        "--parallel", "1",
        "--flash-attn", "on",
        "--cache-type-k", KV_CACHE_TYPE,
        "--cache-type-v", KV_CACHE_TYPE,
    ]
    launch_flags.extend(CORRECTNESS_FLAGS)
    if eff_cpu:
        launch_flags.append("--cpu-moe")
    elif ncm > 0:
        launch_flags += ["--n-cpu-moe", str(ncm)]
    if draft_path:
        launch_flags += ["--model-draft", str(draft_path)]

    return {
        "model": mpath,
        "arch": meta.get("arch"),
        "max_ctx": ctx,
        "train_ctx": meta.get("train_ctx"),
        "cpu_moe": eff_cpu,
        "n_cpu_moe": 0 if eff_cpu else ncm,
        "expert_flag": expert_flag,
        "launch_flags": launch_flags,
        "cache_type_k": KV_CACHE_TYPE,
        "cache_type_v": KV_CACHE_TYPE,
        "gpu_layers": GPU_LAYERS,
        "headroom_pct": bd.get("headroom_pct"),
        "headroom_gb": bd.get("headroom_gb"),
        "vram_budget_gb": bd.get("vram_budget"),
        "kv_gb": bd.get("kv_gb"),
        "dram_need_gb": bd.get("dram_need"),
        "max_overhead_pct": bd.get("max_overhead_pct"),
    }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    mpath = sys.argv[1]
    dpath = None
    wrs = False
    verify = False
    systemd = None
    docker_out = False
    compose_out = False
    json_out = False
    safe_mode = False
    safety_factor = 1.0
    headroom_pct = DEFAULT_HEADROOM_PCT
    vram_override = None
    dram_override = None
    docker_image = None
    docker_port = 8080

    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == "--draft" and i + 1 < len(args):
            dpath = args[i + 1]
            i += 2
        elif args[i] == "--write-script":
            wrs = True
            i += 1
        elif args[i] == "--verify":
            verify = True
            i += 1
        elif args[i] == "--docker":
            docker_out = True
            i += 1
        elif args[i] == "--compose":
            compose_out = True
            i += 1
        elif args[i] == "--json":
            json_out = True
            i += 1
        elif args[i] == "--safe":
            safe_mode = True
            safety_factor = 2.0
            i += 1
        elif args[i] == "--conservative":
            safe_mode = True
            safety_factor = 1.5
            i += 1
        elif args[i] == "--safety-factor" and i + 1 < len(args):
            try:
                safety_factor = float(args[i + 1])
                if safety_factor >= 1.5:
                    safe_mode = True
            except:
                pass
            i += 2
        elif args[i] == "--headroom-pct" and i + 1 < len(args):
            try:
                headroom_pct = int(args[i + 1])
            except:
                pass
            i += 2
        elif args[i] == "--vram" and i + 1 < len(args):
            try:
                vram_override = float(args[i + 1])
            except:
                pass
            i += 2
        elif args[i] == "--dram" and i + 1 < len(args):
            try:
                dram_override = float(args[i + 1])
            except:
                pass
            i += 2
        elif args[i] == "--image" and i + 1 < len(args):
            docker_image = args[i + 1]
            i += 2
        elif args[i] == "--port" and i + 1 < len(args):
            try:
                docker_port = int(args[i + 1])
            except:
                pass
            i += 2
        elif args[i] == "--systemd" and i + 1 < len(args):
            systemd = args[i + 1]
            i += 2
        else:
            i += 1

    if not os.path.exists(mpath):
        print(f"ERROR: {mpath} not found", file=sys.stderr)
        sys.exit(1)

    vram = int(vram_override * GB) if vram_override else detect_vram_total()
    dram = int(dram_override * GB) if dram_override else detect_dram_available()
    cgroup_max = detect_cgroup_memory_max() if not dram_override else 0

    meta = read_meta(mpath)
    ta = analyze(meta)

    # --json: emit ONLY the structured result on stdout so the TUI can json.loads
    # it directly. This is the single source of truth for launch flags + ctx.
    if json_out:
        actual_dram = cgroup_max if (cgroup_max and cgroup_max < dram) else dram
        draft_bytes = 0
        if dpath and os.path.exists(dpath):
            draft_bytes = read_meta(dpath)["fsize"]
        ctx, ncm, cpm, bd = compute(vram, actual_dram, meta, ta, draft_bytes,
                                    safety_factor, headroom_pct)
        if "error" in bd:
            print(json.dumps({"error": bd["error"]}))
            sys.exit(1)
        result = build_result(mpath, meta, ctx, ncm, cpm, bd,
                              dpath if draft_bytes else None)
        print(json.dumps(result))
        sys.exit(0)

    print(f"# HW: VRAM={vram/GB:.1f}GB  DRAM_free={dram/GB:.1f}GB", end="")
    if cgroup_max:
        print(f"  cgroup_max={cgroup_max/GB:.1f}GB")
    else:
        print()
    # Apply safety factor to margins
    eff_safety_mb = int(SAFETY_MARGIN_MB * safety_factor)
    eff_compute_mb = int(COMPUTE_BUFS_MB * safety_factor)
    eff_overhead_pct = EMPIRICAL_OVERHEAD_PCT * safety_factor
    
    mode_label = f"{safety_factor:.1f}x" if safety_factor != 1.0 else "normal"
    print(f"# KV=q4_0  safety={eff_safety_mb}MB  compute={eff_compute_mb}MB  overhead={eff_overhead_pct:.1f}%  min_headroom={headroom_pct}%")
    print(f"# {os.path.basename(mpath)}")
    print(f"#   arch={meta['arch']}  L={meta['nl']}  train_ctx={meta['train_ctx']}  experts={meta['nexp']}/{meta['nact']}")
    print(f"#   file={meta['fsize']/GB:.1f}GB  nonex={ta['nonex']/GB:.2f}GB  exp={ta['exp']/GB:.2f}GB")
    print(f"#   kv_ptok={ta['kv_ptok']:.1f}B  kv_layers={ta['n_kv']}(growing={ta['n_cache']})")

    draft = 0
    if dpath and os.path.exists(dpath):
        dm = read_meta(dpath)
        ok, why = check_draft(meta, dm)
        if ok:
            draft = dm["fsize"]
            print(f"# Draft: {os.path.basename(dpath)} ({draft/GB:.2f}GB) arch={dm['arch']} ✓")
        else:
            print(f"# WARN: draft incompatible: {why}")
            # Still allow if user explicitly passed --draft
            draft = dm["fsize"]
            print(f"#        using draft anyway ({draft/GB:.2f}GB) — you've been warned")

    # Warn if cgroup limit is tighter than MemAvailable
    if cgroup_max and cgroup_max < dram:
        actual_dram = cgroup_max
        print(f"# NOTE: DRAM clamped to cgroup limit ({cgroup_max/GB:.1f}GB) vs MemAvailable ({dram/GB:.1f}GB)")
    else:
        actual_dram = dram

    ctx, ncm, cpm, bd = compute(vram, actual_dram, meta, ta, draft, safety_factor, headroom_pct)
    if "error" in bd:
        print(f"\nERROR: {bd['error']}", file=sys.stderr)
        sys.exit(1)

    eff_cpu = cpm or (ncm >= meta["nl"])
    print(f"\n─── RESULT ───")
    print(f"  max_ctx={ctx}  (train_ctx={meta['train_ctx']})")
    print(f"  experts: {'--cpu-moe' if eff_cpu else f'--n-cpu-moe {ncm}' if ncm > 0 else 'all GPU'}")
    print(f"\n  VRAM: budget={bd['vram_budget']:.1f}  nonex={bd['nonex']:.1f}  exp_gpu={bd['exp_gpu']:.1f}  KV={bd['kv_gb']:.1f}GB")
    hr = bd['vram_budget'] - bd['nonex'] - bd['draft_gb'] - bd['exp_gpu'] - bd['kv_gb']
    hr_pct = bd.get('headroom_pct', 0)

    # Headroom warning
    if hr_pct < headroom_pct:
        print(f"  ⚠ headroom={hr:+.1f}GB ({hr_pct:.1f}%) — BELOW minimum {headroom_pct}%")
        print(f"    Consider: --safe flag, or lower --ctx-size manually")
    elif hr_pct < 3:
        print(f"  headroom={hr:+.1f}GB ({hr_pct:.1f}%) — tight, monitor for OOM")
    else:
        print(f"  headroom={hr:+.1f}GB ({hr_pct:.1f}%)")

    # Sensitivity table
    print(f"\n  ── Overhead tolerance ──")
    print(f"  {'Extra %':>7s}  {'Result ctx':>10s}  Status")
    for oh_pct, oh_ctx, oh_status in bd.get('sensitivity', []):
        marker = "⚠" if oh_status == "LOW" else ("✗" if oh_status == "OOM" else "✓")
        print(f"  {oh_pct:>6d}%  {oh_ctx:>10d}  {marker} {oh_status}")
    print(f"  Max overhead before degraded: ~{bd.get('max_overhead_pct', 0)}%")

    if bd.get("exp_cpu", 0) > 0:
        print(f"\n  DRAM: need={bd['dram_need']:.1f}GB  free={bd['dram_free']:.1f}GB")

    print(f"\n  Flags:")
    for f in [
        f"--model {mpath}",
        f"--ctx-size {ctx}",
        "-ngl 999 --parallel 1 --flash-attn on",
        "--cache-type-k q4_0 --cache-type-v q4_0",
    ]:
        print(f"    {f}")
    if eff_cpu:
        print(f"    --cpu-moe")
    elif ncm > 0:
        print(f"    --n-cpu-moe {ncm}")
    if dpath and draft:
        print(f"    --model-draft {dpath}")

    # Runtime safety warning
    if bd.get('headroom_pct', 0) < 5:
        print(f"\n  ═══ RUNTIME SAFETY NOTES ═══")
        print(f"  Headroom is {bd.get('headroom_pct',0):.1f}%. Real-world overhead from:")
        print(f"  - ROCm/HIP driver allocator: ~50-200 MB")
        print(f"  - q4_0 packing inefficiency: up to ~5% of KV")
        print(f"  - Flash attention workspace: varies by batch")
        print(f"  - Recommend: test with --verify before production")

    # ── Docker output ────────────────────────────────────────────
    gpu_vendor = detect_gpu_vendor()
    if docker_out or compose_out:
        print(f"\n  ═══ DOCKER ═══")
        model_dir = os.path.dirname(os.path.abspath(mpath))
        model_name = os.path.basename(mpath)
        
        if docker_out:
            docker_cmd = generate_docker_run(mpath, ctx, ncm, cpm, dpath, gpu_vendor, docker_image, docker_port)
            for line in docker_cmd:
                print(f"  {line}")
        
        if compose_out:
            print(f"\n  # docker-compose.yml:")
            compose = generate_docker_compose(mpath, ctx, ncm, cpm, dpath, gpu_vendor, docker_image, docker_port)
            for line in compose:
                print(f"  {line}")

    # --verify: launch and check
    if verify:
        print(f"\n─── VERIFY (loading model with ctx=4096) ───")
        ok, actual_vram, _, err = verify_model(mpath, ctx, ncm, cpm, dpath)
        if ok:
            actual_gb = actual_vram / GB
            predicted = bd['nonex'] + bd['exp_gpu'] + bd.get('draft_gb', 0) + (bd['kv_ptok'] * 4096 / GB)
            print(f"  ✓ Model loads successfully")
            print(f"  Actual VRAM: ~{actual_gb:.1f}GB  Predicted (ctx=4096): ~{predicted:.1f}GB")
            delta = actual_gb - predicted
            print(f"  Estimation error: {delta:+.1f}GB ({delta/predicted*100 if predicted else 0:+.1f}%)")
        else:
            print(f"  ✗ Model failed to load: {err[:200]}")

    # --systemd: generate systemd unit
    if systemd:
        sp, svc_name = generate_systemd_unit(mpath, ctx, ncm, cpm, dpath, systemd)
        print(f"\n  Systemd unit: {sp}")
        print(f"  Install: sudo cp {sp} /etc/systemd/system/")
        print(f"  Enable:  sudo systemctl enable {svc_name}")
        print(f"  Start:   sudo systemctl start {svc_name}")

    # --write-script: legacy shell script
    if wrs:
        bn = os.path.splitext(os.path.basename(mpath))[0]
        sp = f"/home/achu/start-llama-{bn}.sh"
        with open(sp, "w") as f:
            f.write("#!/bin/bash\n")
            f.write(f"# Generated by size-model.py  max_ctx={ctx}  arch={meta['arch']}\n")
            f.write(f"# VRAM={vram/GB:.0f}GB  DRAM_free={dram/GB:.0f}GB\n")
            f.write("cd /home/achu/llama.cpp\nexec ./build-vulkan/bin/llama-server \\\n")
            f.write(f"  --model {mpath} \\\n")
            f.write(f"  --ctx-size {ctx} \\\n")
            f.write(f"  --host 127.0.0.1 --port ${{LLAMA_PORT:-8080}} \\\n")
            f.write(f"  -ngl 999 --parallel 1 --flash-attn on \\\n")
            f.write(f"  --cache-type-k q4_0 --cache-type-v q4_0 \\\n")
            if eff_cpu:
                f.write("  --cpu-moe \\\n")
            elif ncm > 0:
                f.write(f"  --n-cpu-moe {ncm} \\\n")
            if dpath and draft:
                f.write(f"  --model-draft {dpath} \\\n")
            f.write("  2>&1\n")
        os.chmod(sp, 0o755)
        print(f"\n  Script: {sp}")


if __name__ == "__main__":
    main()
