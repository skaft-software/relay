#!/usr/bin/env python3
"""
relay setup — turn any machine into a model gateway, no jargon required.

Friendly, arrow-key driven wizard. You don't need to know what a GGUF, a
quantization, or a KV cache is — relay works it out for your hardware so models
run as fast as possible and never run out of memory.

Two things it can set up:
  • Cloud gateway  — one endpoint in front of OpenAI / Anthropic / DeepSeek / Groq.
  • Local gateway  — run models on your own machine (Mac Metal or Linux GPU),
                     downloading + sizing curated models so it's plug-and-play.

Pure Python 3.10+ stdlib. macOS (Apple Silicon) + Linux x64.
"""
import os, sys, re, json, time, getpass, platform, select, subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
CATALOG_PATH = SCRIPT_DIR / "catalog.sh"
SIZE_MODEL = SCRIPT_DIR / "size-model.py"
GB = 1073741824
IS_MAC = sys.platform == "darwin"

RELAY_HOME = Path(os.environ.get("RELAY_HOME", Path.home() / ".relay"))
ENV_OUT = RELAY_HOME / "relay.env"
COMPOSE_OUT = RELAY_HOME / "docker-compose.yml"
SCRIPTS_DIR = RELAY_HOME / "start-scripts"
MODELS_DEFAULT = RELAY_HOME / "models"

INTERACTIVE = sys.stdin.isatty() and sys.stdout.isatty()

class QuitWizard(Exception):
    pass

# ── ANSI ─────────────────────────────────────────────────────────────────────
# Brand accent = steel blue (≈ #568dd0). 256-color 75.
def a(s):  return f"\x1b[38;5;75m{s}\x1b[0m"   # accent
def c(s):  return f"\x1b[36m{s}\x1b[0m"        # cyan
def b(s):  return f"\x1b[1m{s}\x1b[0m"         # bold
def g(s):  return f"\x1b[32m{s}\x1b[0m"        # green
def y(s):  return f"\x1b[33m{s}\x1b[0m"        # yellow
def r(s):  return f"\x1b[31m{s}\x1b[0m"        # red
def d(s):  return f"\x1b[2m{s}\x1b[0m"         # dim
def inv(s): return f"\x1b[7m{s}\x1b[0m"        # inverse (selection bar)

CLR = "\x1b[2J\x1b[H"
HIDE = "\x1b[?25l"
SHOW = "\x1b[?25h"

def _emit(s):
    sys.stdout.write(s)
    sys.stdout.flush()

# ── Key input + menus (the bit that makes it not feel like a terminal) ───────
try:
    import termios, tty
    _HAS_TTY = True
except ImportError:
    _HAS_TTY = False

class _Cbreak:
    def __enter__(self):
        self.fd = sys.stdin.fileno()
        self.old = termios.tcgetattr(self.fd)
        tty.setcbreak(self.fd)          # cbreak keeps Ctrl-C working
        _emit(HIDE)
        return self
    def __exit__(self, *exc):
        termios.tcsetattr(self.fd, termios.TCSADRAIN, self.old)
        _emit(SHOW)

def _read_key():
    # Read from the raw fd (not buffered sys.stdin) so arrow escape sequences
    # aren't swallowed by Python's read-ahead buffer.
    fd = sys.stdin.fileno()
    ch = os.read(fd, 1)
    if ch == b"\x1b":
        rdy, _, _ = select.select([fd], [], [], 0.05)
        if not rdy:
            return "esc"
        seq = os.read(fd, 2)
        return {b"[A": "up", b"[B": "down", b"[C": "right", b"[D": "left"}.get(seq, "esc")
    if ch in (b"\r", b"\n"):
        return "enter"
    if ch == b" ":
        return "space"
    if ch == b"\x03":
        raise KeyboardInterrupt
    if ch == b"\x04":
        return "eof"
    try:
        return ch.decode()
    except Exception:
        return ""

def _draw_menu(top, options, idx, selected, hint):
    buf = [CLR, top, ""]
    for i, opt in enumerate(options):
        active = i == idx
        pointer = a(b("❯")) if active else " "
        box = ""
        if selected is not None:
            box = g("◉ ") if i in selected else d("○ ")
        label = opt["label"]
        label = (a(b(label)) if active else label)
        buf.append(f"  {pointer} {box}{label}")
        if opt.get("desc"):
            buf.append(d(f"       {opt['desc']}"))
        buf.append("")
    buf.append(d(f"  {hint}"))
    _emit("\n".join(buf) + "\n")

def select_one(top, options, hint="↑/↓ move · enter to choose · q to quit"):
    """options: list of {label, desc?}. Returns chosen index, or raises QuitWizard."""
    if not INTERACTIVE or not _HAS_TTY:
        return _fallback_pick(top, options, multi=False)[0]
    idx = 0
    with _Cbreak():
        while True:
            _draw_menu(top, options, idx, None, hint)
            k = _read_key()
            if k in ("up", "k"):     idx = (idx - 1) % len(options)
            elif k in ("down", "j"): idx = (idx + 1) % len(options)
            elif k == "enter":       return idx
            elif k in ("q", "esc", "eof"): raise QuitWizard()

def select_many(top, options, preselect=None,
                hint="↑/↓ move · space to toggle · enter to confirm · q to quit"):
    """Multi-select. Returns sorted list of chosen indices."""
    if not INTERACTIVE or not _HAS_TTY:
        return _fallback_pick(top, options, multi=True)
    idx = 0
    selected = set(preselect or [])
    with _Cbreak():
        while True:
            _draw_menu(top, options, idx, selected, hint)
            k = _read_key()
            if k in ("up", "k"):     idx = (idx - 1) % len(options)
            elif k in ("down", "j"): idx = (idx + 1) % len(options)
            elif k == "space":       selected.symmetric_difference_update({idx})
            elif k == "a":           selected = set(range(len(options)))
            elif k == "enter":       return sorted(selected)
            elif k in ("q", "esc", "eof"): raise QuitWizard()

def _fallback_pick(top, options, multi):
    """Numbered fallback for non-TTY (pipes, CI). Keeps the wizard scriptable."""
    print(top)
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt['label']}" + (f"  — {opt['desc']}" if opt.get("desc") else ""))
    try:
        raw = input("  choose" + (" (comma-separated)" if multi else "") + ": ").strip()
    except (EOFError, KeyboardInterrupt):
        raise QuitWizard()
    nums = [int(t) - 1 for t in raw.replace(",", " ").split() if t.strip().isdigit()]
    nums = [n for n in nums if 0 <= n < len(options)]
    if multi:
        return nums
    return [nums[0] if nums else 0]

def ask(prompt, default=""):
    try:
        val = input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        raise QuitWizard()
    return val or default

def ask_secret(prompt):
    try:
        return getpass.getpass(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        raise QuitWizard()

def confirm(prompt, default=True):
    opts = [{"label": "Yes"}, {"label": "No"}]
    if not INTERACTIVE or not _HAS_TTY:
        ans = ask(f"{prompt} [{'Y/n' if default else 'y/N'}]: ", "")
        if not ans:
            return default
        return ans.lower().startswith("y")
    return select_one(prompt, opts, hint="↑/↓ · enter") == 0

def pause(msg="Press enter to continue…"):
    if not INTERACTIVE:
        return
    if _HAS_TTY:
        _emit(d(f"\n  {msg} ") + SHOW)
        with _Cbreak():
            _read_key()
    else:
        ask(f"\n  {msg} ")

# ── Personality ──────────────────────────────────────────────────────────────
LOGO = [
    "     ██████╗  ███████╗ ██╗       █████╗ ██╗   ██╗",
    "     ██╔══██╗ ██╔════╝ ██║      ██╔══██╗╚██╗ ██╔╝",
    "     ██████╔╝ █████╗   ██║      ███████║ ╚████╔╝ ",
    "     ██╔══██╗ ██╔══╝   ██║      ██╔══██║  ╚██╔╝  ",
    "     ██║  ██║ ███████╗ ███████╗ ██║  ██║   ██║   ",
    "     ╚═╝  ╚═╝ ╚══════╝ ╚══════╝ ╚═╝  ╚═╝   ╚═╝   ",
]

THINKING = [
    "Doing the scary math so you don't have to…",
    "Measuring your machine's appetite…",
    "Working out what fits without melting anything…",
    "Reading the fine print on these models…",
    "Tuning everything to your exact hardware…",
]

def _spin(msg, i):
    frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    return f"  {a(frames[i % len(frames)])} {msg}"

# ── Catalog ──────────────────────────────────────────────────────────────────
def load_catalog():
    models = []
    if not CATALOG_PATH.exists():
        return models
    for line in CATALOG_PATH.read_text().split("\n"):
        line = line.strip().strip('"')
        if not line or line.startswith("#") or "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 6:
            continue
        models.append({
            "key": parts[0], "repo": parts[1], "file": parts[2],
            "url": f"https://huggingface.co/{parts[1]}/resolve/main/{parts[2]}",
            "arch": parts[3], "quant": parts[4],
            "multimodal": len(parts) > 5 and parts[5].lower() in ("yes", "true"),
            "notes": parts[8] if len(parts) > 8 else "",
            "size_gb": None,
        })
    return models

CATALOG = load_catalog()

# ── Real model sizes from HuggingFace ────────────────────────────────────────
import urllib.request

_TREE_CACHE = {}

def _hf_tree(repo):
    if repo in _TREE_CACHE:
        return _TREE_CACHE[repo]
    sizes = {}
    url = f"https://huggingface.co/api/models/{repo}/tree/main?recursive=1"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "relay-setup"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            for item in json.load(resp):
                if item.get("type") != "file":
                    continue
                lfs = item.get("lfs") or {}
                sizes[item["path"]] = lfs.get("size") or item.get("size") or 0
    except Exception:
        pass
    _TREE_CACHE[repo] = sizes
    return sizes

def hf_size_gb(model):
    by_name = _hf_tree(model["repo"])
    size = by_name.get(model["file"])
    if not size:
        base = model["file"].rsplit("/", 1)[-1]
        for path, sz in by_name.items():
            if path.rsplit("/", 1)[-1] == base:
                size = sz
                break
    return (size / GB) if size else None

def _repo_mmproj(repo):
    for path in _hf_tree(repo):
        low = path.lower()
        if "mmproj" in low and low.endswith(".gguf"):
            return path.rsplit("/", 1)[-1]
    return None

# ── Hardware detection (cross-platform) ──────────────────────────────────────
def _run(cmd, timeout=5):
    try:
        return subprocess.check_output(cmd, text=True, timeout=timeout,
                                       stderr=subprocess.DEVNULL)
    except Exception:
        return ""

def detect_hw():
    """(label, vram_bytes, ram_bytes, disk_bytes, vendor). vendor ∈ apple/nvidia/amd/cpu."""
    label, vram, ram, disk, vendor = "your machine", 0, 0, 0, "cpu"

    if IS_MAC:
        out = _run(["sysctl", "-n", "hw.memsize"])
        if out.strip().isdigit():
            ram = int(out.strip())
        chip = _run(["sysctl", "-n", "machdep.cpu.brand_string"]).strip()
        if platform.machine() == "arm64" and ram:
            vram = int(ram * 0.70)
            vendor = "apple"
            label = chip or "Apple Silicon"
        else:
            label = chip or "Mac"
    else:
        out = _run(["nvidia-smi", "--query-gpu=memory.total",
                    "--format=csv,noheader,nounits"])
        if out.strip():
            vendor, label = "nvidia", "NVIDIA GPU"
            vram = int(out.strip().split("\n")[0]) * 1048576
        if not vram:
            out = _run(["rocm-smi", "--showmeminfo", "vram"])
            if out:
                vendor, label = "amd", "AMD GPU"
                mm = re.search(r"VRAM Total Memory \(B\):\s*(\d+)", out)
                if mm:
                    vram = int(mm.group(1))
        try:
            with open("/proc/meminfo") as f:
                for line in f:
                    if line.startswith("MemTotal:"):
                        ram = int(line.split()[1]) * 1024
                        break
        except Exception:
            pass

    try:
        s = os.statvfs(str(Path.home()))
        disk = s.f_frsize * s.f_bavail
    except Exception:
        pass

    return label, vram, ram, disk, vendor

def vram_budget_gb(hw):
    _, vram, ram, _, _ = hw
    if vram:
        return vram / GB
    return (ram / GB) * 0.6 if ram else 8.0

def hw_verdict(hw):
    budget = vram_budget_gb(hw)
    if budget >= 22:   return g("plenty of room — you can run big, smart models.")
    if budget >= 12:   return g("a comfy amount — solid coding models will fly.")
    if budget >= 7:    return c("enough for a capable everyday model.")
    return y("modest, but we'll find a small model that runs great.")

# ── Splash / screen frame ────────────────────────────────────────────────────
def banner(hw):
    label, vram, ram, disk, vendor = hw
    lines = [""]
    for ln in LOGO:
        lines.append(a(b(ln)))
    lines.append(c("       your friendly model gateway — no jargon required"))
    lines.append("")
    vram_str = f"{vram/GB:.0f} GB graphics memory" if vram else "no dedicated GPU"
    lines.append(f"  {g('●')} {b(label)}   {a(vram_str)}"
                 f"   {c(f'{ram/GB:.0f} GB RAM')}   {c(f'{disk/GB:.0f} GB free')}")
    lines.append(f"  {d('└')} {hw_verdict(hw)}")
    lines.append(f"  {d('─'*64)}")
    return "\n".join(lines)

def mini_banner(hw):
    """One-line banner used after welcome screen — less visual noise."""
    label, vram, ram, _disk, _vendor = hw
    vram_str = f"{vram/GB:.0f} GB GPU" if vram else "shared memory"
    return f"  {d('relay ·')} {label}  {d('·')} {vram_str}  {d('·')} {ram/GB:.0f} GB RAM"

def frame(hw, title, *body, step=None):
    """Build a full screen string: mini-banner + title + body lines."""
    title_str = f"  {title}"
    if step:
        title_str = f"{title_str}  {d(f'(Step {step})')}"
    parts = ["", mini_banner(hw), "", a(b(title_str))]
    if body:
        parts.append("")
        parts.extend(body)
    return "\n".join(parts)

def show(hw, title, *body, step=None):
    _emit(CLR + frame(hw, title, *body, step=step) + "\n")

# ── Welcome ──────────────────────────────────────────────────────────────────
def screen_welcome(hw):
    # Welcome uses the full logo banner, not the mini-banner.
    _emit(CLR + banner(hw) + "\n\n" + 
          a(b("  Hey there \U0001f44b")) + "\n\n" +
          d("  I put local AI models in your coding agent. No cloud. No subscriptions.") + "\n" +
          d(f"  {a('↑/↓ to move, Enter to pick.')} That's it.") + "\n\n")
    pause("Press enter when you're ready…")

# ── Docker / llama.cpp discovery ─────────────────────────────────────────────
def docker_available():
    return bool(_run(["docker", "--version"]).strip())

def find_llama():
    """Locate a llama-server binary. Returns (bin_path, root_dir, label) or None."""
    candidates = []
    brew = _run(["brew", "--prefix"]).strip() if IS_MAC else ""
    if brew:
        candidates.append(Path(brew) / "bin" / "llama-server")
    for root in [RELAY_HOME / "llama.cpp", Path.home() / "llama.cpp",
                 Path("/opt/llama.cpp")]:
        for sub in ["build/bin", "build-vulkan/bin", "build-cuda/bin",
                    "build-rocm/bin", "build-metal/bin", "bin"]:
            candidates.append(root / sub / "llama-server")
    candidates += [Path("/usr/local/bin/llama-server"), Path("/usr/bin/llama-server")]
    for binp in candidates:
        if binp.exists() and os.access(binp, os.X_OK):
            # root = the llama.cpp dir to cd into (two levels up from bin/ when present)
            root = binp.parent.parent if binp.parent.name == "bin" else binp.parent
            return binp, root, binp.parent.parent.name
    return None

def ensure_llama(hw):
    """Make sure a llama-server exists. Returns (bin_path, root_dir) or raises QuitWizard."""
    found = find_llama()
    if found:
        binp, root, _ = found
        show(hw, "🦙  llama.cpp", f"  {g('●')} Found it: {d(str(binp))}")
        time.sleep(0.6)
        return binp, root

    if IS_MAC:
        show(hw, "🦙  llama.cpp",
             d("  llama.cpp is the engine that actually runs models. You don't have"),
             d("  it yet. On a Mac the easy button is Homebrew."), "")
        if _run(["brew", "--version"]).strip():
            if confirm("  Install it now with Homebrew? (recommended)"):
                show(hw, "🦙  Installing llama.cpp", d("  brew install llama.cpp — hang tight…"))
                os.system("brew install llama.cpp")
                found = find_llama()
                if found:
                    return found[0], found[1]
        show(hw, "🦙  llama.cpp",
             y("  Couldn't set it up automatically."),
             d("  Run this, then re-launch relay:"),
             f"    {b('brew install llama.cpp')}")
        pause()
        raise QuitWizard()

    # Linux: try a prebuilt release, else give exact instructions.
    vendor = hw[4]
    show(hw, "🦙  llama.cpp",
         d("  llama.cpp is the engine that runs models. You don't have it yet."), "")
    if confirm("  Download a prebuilt llama.cpp for your GPU? (recommended)"):
        binp = provision_llama_linux(hw, vendor)
        if binp:
            return binp, binp.parent.parent
    flavor = {"nvidia": "vulkan", "amd": "vulkan"}.get(vendor, "cpu")
    show(hw, "🦙  llama.cpp",
         y("  Couldn't fetch a prebuilt automatically."),
         d("  Grab a release build (or compile) and re-run relay. Quick path:"),
         f"    {b('https://github.com/ggml-org/llama.cpp/releases')}  ({flavor} build)",
         d(f"  Unzip it to {RELAY_HOME / 'llama.cpp'}/ and I'll find it."))
    pause()
    raise QuitWizard()

# Acceleration backend preferred per GPU vendor, in fallback order. There is no
# Linux CUDA prebuilt in ggml-org/llama.cpp releases, so NVIDIA falls back to the
# Vulkan build (which also runs on NVIDIA). AMD prefers Vulkan over ROCm because
# the ROCm asset pins a specific ROCm runtime version; Vulkan is broadest-compat.
_ACCEL_PREFERENCE = {
    "amd": ["vulkan", "rocm", "cpu"],
    "nvidia": ["cuda", "vulkan", "cpu"],
}


def select_llama_asset(assets, vendor):
    """Pick the best llama.cpp Linux x64 release asset for this GPU vendor.

    Real assets are named ``llama-<tag>-bin-ubuntu[-<accel>]-x64.tar.gz``.
    ``assets`` is the GitHub release ``assets`` list (dicts with ``name`` and
    ``browser_download_url``). Returns the chosen asset dict, or None when no
    usable Linux x64 build is present.
    """
    cands = {}  # accel -> first matching asset
    for av in assets:
        n = av["name"].lower()
        if not n.endswith(".tar.gz"):
            continue
        if "ubuntu" not in n or "x64" not in n or "arm64" in n:
            continue
        if "vulkan" in n:
            accel = "vulkan"
        elif "rocm" in n:
            accel = "rocm"
        elif "cuda" in n:
            accel = "cuda"
        elif "sycl" in n or "openvino" in n:
            continue  # niche backends relay doesn't target
        else:
            accel = "cpu"
        cands.setdefault(accel, av)
    for accel in _ACCEL_PREFERENCE.get(vendor, ["cpu", "vulkan"]):
        if accel in cands:
            return cands[accel]
    return None


def provision_llama_linux(hw, vendor):
    """Best-effort: download the latest prebuilt llama.cpp release for this GPU."""
    show(hw, "🦙  Fetching llama.cpp", d("  Looking for a prebuilt for Linux x64…"))
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest",
            headers={"User-Agent": "relay-setup", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            rel = json.load(resp)
    except Exception:
        return None
    asset = select_llama_asset(rel.get("assets", []), vendor)
    if not asset:
        return None
    dest_dir = RELAY_HOME / "llama.cpp"
    dest_dir.mkdir(parents=True, exist_ok=True)
    tar_path = dest_dir / asset["name"]
    show(hw, "🦙  Fetching llama.cpp", d(f"  {asset['name']} — downloading…"))
    if not _curl(asset["browser_download_url"], tar_path):
        return None
    try:
        import tarfile
        with tarfile.open(tar_path) as tf:
            tf.extractall(dest_dir)
        tar_path.unlink(missing_ok=True)
    except Exception:
        return None
    for binp in dest_dir.rglob("llama-server"):
        try:
            binp.chmod(0o755)
        except Exception:
            pass
        return binp
    return None

# ── Cloud gateway ────────────────────────────────────────────────────────────
CLOUD_PROVIDERS = [
    {"key": "openai",    "label": "OpenAI",    "base_url": "https://api.openai.com/v1",    "env": "OPENAI_API_KEY"},
    {"key": "anthropic", "label": "Anthropic", "base_url": "https://api.anthropic.com/v1", "env": "ANTHROPIC_API_KEY"},
    {"key": "deepseek",  "label": "DeepSeek",  "base_url": "https://api.deepseek.com/v1",  "env": "DEEPSEEK_API_KEY"},
    {"key": "groq",      "label": "Groq",      "base_url": "https://api.groq.com/openai/v1","env": "GROQ_API_KEY"},
]

def flow_cloud(hw):
    opts = [{"label": p["label"], "desc": p["base_url"]} for p in CLOUD_PROVIDERS]
    chosen = select_many(
        frame(hw, "☁  Cloud gateway",
              d("  Which providers should relay sit in front of? Toggle the ones"),
              d("  you have API keys for. You'll type the keys next (hidden)."), step=2),
        opts)
    if not chosen:
        raise QuitWizard()

    cloud_models, env_lines = {}, []
    for i in chosen:
        p = CLOUD_PROVIDERS[i]
        show(hw, f"☁  {p['label']}",
             d("  Paste your API key. It's hidden as you type and stored locally."), step=3)
        base = ask(f"  Base URL [{p['base_url']}]: ", p["base_url"])
        existing = os.environ.get(p["env"], "")
        key = ask_secret(f"  {p['label']} API key" +
                         (" (enter to keep existing)" if existing else "") + ": ")
        if key:
            env_lines.append(f"{p['env']}={key}")
        elif not existing:
            continue
        cloud_models[p["key"]] = {"base_url": base, "auth_env": p["env"]}

    if not cloud_models:
        raise QuitWizard()
    config = env_lines + [
        "RELAY_MODE=cloud",
        f"RELAY_CLOUD_MODELS={json.dumps(cloud_models, separators=(',', ':'))}",
    ]
    return config, None, "cloud"

# ── Local: point at an existing runner ───────────────────────────────────────
def flow_existing(hw):
    opts = [
        {"label": "Ollama", "desc": "the popular one-click local model app"},
        {"label": "llama.cpp / other", "desc": "anything that speaks the OpenAI API"},
    ]
    pick = select_one(frame(hw, "📡  Use a runner I already have",
                            d("  Which one are you running?"), step=3), opts)
    if pick == 0:
        url = "http://127.0.0.1:11434/v1"
        models = _ollama_models()
        show(hw, "📡  Ollama",
             (f"  {g('●')} Found {len(models)} model(s): " + ", ".join(models[:4]))
             if models else y("  Couldn't reach Ollama — make sure it's running."))
        default = models[0] if models else ask("  Default model name: ", "")
        time.sleep(0.6)
    else:
        show(hw, "📡  Existing server",
             d("  What URL is it listening on? (Enter for the llama.cpp default.)"))
        url = ask("  Server URL [http://127.0.0.1:8080/v1]: ", "http://127.0.0.1:8080/v1")
        if not url.startswith("http"):
            url = "http://127.0.0.1:8080/v1"
        default = ask("  Default model name (Enter to auto-detect): ", "")

    config = ["RELAY_MODE=gateway", f"UPSTREAM_BASE_URL={url}",
              "RELAY_MODEL_LIFECYCLE_ENABLED=false"]
    if default:
        config.append(f"DEFAULT_MODEL={default}")
    return config, None, "existing"

# ── Headless auto-setup ──────────────────────────────────────────────────────
def auto_local(hw):
    """Run the full local setup without any prompts. Same logic as flow_local_full."""
    print(f"  {d('Auto-detecting hardware…')}")
    label, vram, ram, disk, vendor = hw
    vram_str = f"{vram/GB:.0f} GB GPU" if vram else "shared memory"
    print(f"  {g('●')} {label}  ·  {vram_str}  ·  {ram/GB:.0f} GB RAM")

    # 1. llama.cpp
    print(f"  {d('Finding llama.cpp…')}")
    llama_bin, llama_root = ensure_llama(hw)
    print(f"  {g('✓')} {llama_bin}")

    # 2. Models directory: use MODELS_DEFAULT, or find existing models
    guess = next((p for p in [MODELS_DEFAULT, Path.home() / "models", Path("/opt/models")]
                 if p.is_dir() and any(p.rglob("*.gguf"))), None)
    models_dir = guess or MODELS_DEFAULT
    models_dir.mkdir(parents=True, exist_ok=True)
    print(f"  {g('✓')} models dir: {models_dir}")

    # 3. Get models if empty
    ggufs = sorted(p for p in models_dir.rglob("*.gguf"))
    if not ggufs:
        print(f"  {y('!')} no models found — downloading recommended one…")
        budget = vram_budget_gb(hw)
        # Pre-size catalog and pick best fit
        for mdl in CATALOG:
            if mdl.get("size_gb") is None:
                mdl["size_gb"] = hf_size_gb(mdl)
        fitting = [m for m in CATALOG if fits(m, budget)]
        if fitting:
            best = max(fitting, key=lambda m: m.get("size_gb") or 0)
            ggufs = download_models(hw, [best], models_dir)
        if not ggufs:
            print(f"  {r('✗')} could not download any models")
            raise QuitWizard()
    print(f"  {g('✓')} {len(ggufs)} GGUF files found")

    # 4. Size + wire each base model
    bases = [p for p in ggufs if classify(p) == "base"]
    print(f"  {d('Sizing ' + str(len(bases)) + ' model(s)…')}")
    entries, port = {}, 8081
    for gguf in bases:
        key = re.sub(r"[^a-z0-9-]", "-", gguf.stem.lower())[:48].strip("-")
        ctx, launch_flags, expert, err = size_model(gguf)
        if not ctx:
            print(f"  {y('⚠')} {key[:40]:40s} {d(err)}")
            continue
        script = write_start_script(key, gguf, models_dir, llama_bin, llama_root,
                                    port, launch_flags)
        entry = {"ctx_size": ctx, "port": port, "cmd": script}
        if expert:
            entry["expert_flag"] = expert
        if companion_for(gguf, "mmproj"):
            entry["multimodal"] = True
        entries[key] = entry
        extras = ["smart-offload"] if expert else []
        if companion_for(gguf, "mmproj"):
            extras.append("vision")
        if companion_for(gguf, "draft"):
            extras.append("turbo")
        tail = ("  " + " ".join([d(e) for e in extras])) if extras else ""
        print(f"  {g('✓')} {key[:35]:35s} {d(f'{ctx:,} ctx')}{tail}")
        port += 1

    if not entries:
        print(f"  {r('✗')} no models could be configured")
        raise QuitWizard()

    default = max(entries.keys(), key=lambda k: entries[k]["ctx_size"])
    print(f"  {g('✓')} default model: {a(default)}")

    config = [
        "RELAY_MODE=gateway",
        "RELAY_MODEL_LIFECYCLE_ENABLED=true",
        "RELAY_SERIALIZE_REQUESTS=true",   # FCFS: one request at a time, no thrash
        "RELAY_THINKING_SUPPORTED=true",
        f"DEFAULT_MODEL={default}",
        f"RELAY_MODEL_MAP={json.dumps(entries, separators=(',', ':'))}",
    ]
    compose = None if IS_MAC else render_compose(models_dir, llama_root)
    return config, compose, "local"

def _ollama_models():
    try:
        req = urllib.request.Request("http://127.0.0.1:11434/api/tags",
                                     headers={"User-Agent": "relay-setup"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            return [m["name"] for m in json.load(resp).get("models", [])]
    except Exception:
        return []

# ── Local: full plug-and-play setup ──────────────────────────────────────────
def gguf_magic_ok(path):
    try:
        with open(path, "rb") as f:
            return f.read(4) == b"GGUF"
    except Exception:
        return False

def classify(path):
    n = path.name.lower()
    if "mmproj" in n:
        return "mmproj"
    if n.startswith("mtp-") or "-mtp" in n or "draft" in n:
        return "draft"
    return "base"

def _strip_markers(name):
    s = name[:-5] if name.lower().endswith(".gguf") else name
    s = re.sub(r"(?i)[-_.]?mmproj.*$", "", s)
    s = re.sub(r"(?i)^mtp[-_.]+", "", s)
    s = re.sub(r"(?i)[-_.]?draft.*$", "", s)
    return s.rstrip("-_.")

def companion_for(base, kind):
    bstem = base.name[:-5].lower() if base.name.lower().endswith(".gguf") else base.name.lower()
    for f in sorted(base.parent.glob("*.gguf")):
        if classify(f) != kind or not gguf_magic_ok(f):
            continue
        cbase = _strip_markers(f.name).lower()
        if cbase and (bstem.startswith(cbase) or cbase in bstem):
            return f
    return None

def parse_size_result(stdout):
    """Parse size-model.py --json output.
    Returns (max_ctx, launch_flags, expert_flag, error).
    """
    try:
        data = json.loads(stdout.strip())
    except json.JSONDecodeError as e:
        return 0, [], "", f"size-model output not valid JSON: {e}"
    if not isinstance(data, dict):
        return 0, [], "", "size-model output is not a JSON object"
    if "error" in data:
        return 0, [], "", data["error"]
    return (
        data.get("max_ctx", 0),
        data.get("launch_flags", []),
        data.get("expert_flag", ""),
        None,
    )


def size_model(gguf):
    """(max_ctx, launch_flags, expert_flag, error)."""
    if not gguf_magic_ok(gguf):
        return 0, [], "", "looks like a broken or half-finished download"
    try:
        res = subprocess.run(
            [sys.executable, str(SIZE_MODEL), str(gguf), "--json"],
            capture_output=True, text=True, timeout=180, cwd=str(REPO_ROOT))
        if res.returncode != 0:
            msg = (res.stderr or res.stdout).strip().splitlines()
            return 0, [], "", (msg[-1] if msg else "size-model failed")
        return parse_size_result(res.stdout)
    except subprocess.TimeoutExpired:
        return 0, [], "", "sizing timed out"
    except Exception as e:
        return 0, [], "", str(e)

def _curl(url, dest):
    Path(dest).parent.mkdir(parents=True, exist_ok=True)
    part = str(dest) + ".part"
    rc = os.system(f"curl -L -C - --retry 5 --retry-delay 5 --progress-bar -o '{part}' '{url}'")
    if rc == 0 and Path(part).exists() and Path(part).stat().st_size > 0:
        os.replace(part, dest)
        return True
    return False

def fits(model, budget):
    if model["size_gb"] is None:
        return False
    return (model["size_gb"] + 1.5) <= budget

def screen_catalog(hw):
    budget = vram_budget_gb(hw)
    show(hw, "📦  Picking models", _spin("Checking real sizes on HuggingFace…", 0))
    for mdl in CATALOG:
        if mdl["size_gb"] is None:
            mdl["size_gb"] = hf_size_gb(mdl)

    opts, fitting = [], []
    for i, mdl in enumerate(CATALOG):
        sz = mdl["size_gb"]
        if sz is None:
            tag = y("size unknown")
        elif fits(mdl, budget):
            tag = g("✓ fits")
            fitting.append(i)
        else:
            tag = r("too big for your memory")
        vis = c(" · 👁 sees images") if mdl["multimodal"] else ""
        szs = f"{sz:.1f} GB" if sz else "? GB"
        opts.append({"label": f"{mdl['key']:18s} {szs:>8s}  {tag}{vis}",
                     "desc": mdl["notes"]})

    preselect = [max(fitting, key=lambda i: CATALOG[i]["size_gb"] or 0)] if fitting else []
    chosen = select_many(
        frame(hw, "📦  Pick your model(s)",
              d(f"  You've got ~{budget:.0f} GB to play with. Anything marked"),
              d("  ✓ fits will run smoothly. I've pre-ticked a great default —"),
              d("  press Enter to take it, or Space to choose your own."),
              d("  (You can always re-run setup to add more models later.)"), step=5),
        opts, preselect=preselect)
    if not chosen:
        raise QuitWizard()
    return [CATALOG[i] for i in chosen]

def download_models(hw, models, models_dir):
    paths = []
    for mdl in models:
        show(hw, f"⬇  Getting {mdl['key']}", d(f"  {mdl['url']}\n"))
        dest = models_dir / mdl["file"]
        if dest.exists() and gguf_magic_ok(dest):
            print(f"  {g('●')} Already here ({dest.stat().st_size/GB:.1f} GB)")
            paths.append(dest)
        elif _curl(mdl["url"], dest):
            print(f"  {g('✓')} Saved {dest.name} ({dest.stat().st_size/GB:.1f} GB)")
            paths.append(dest)
        else:
            print(f"  {r('✗')} Download failed — skipping.")
            time.sleep(1.2)
            continue
        if mdl["multimodal"]:
            mm = _repo_mmproj(mdl["repo"])
            if mm:
                mdest = models_dir / mm
                if mdest.exists() and gguf_magic_ok(mdest):
                    print(f"  {g('●')} Vision add-on present")
                elif _curl(f"https://huggingface.co/{mdl['repo']}/resolve/main/{mm}", mdest):
                    print(f"  {g('✓')} 👁 Vision enabled")
                else:
                    print(f"  {y('⚠')} Couldn't get the vision add-on — text only for now.")
        time.sleep(0.3)
    return paths

def flow_local_full(hw):
    # 1. Engine
    llama_bin, llama_root = ensure_llama(hw)

    # 2. Models directory
    guess = next((p for p in [Path.home() / "models", MODELS_DEFAULT,
                              Path("/opt/models")]
                 if p.is_dir() and any(p.rglob("*.gguf"))), None)
    default_dir = str(guess or MODELS_DEFAULT)
    show(hw, "📁  Where do models live?",
         d("  Pick a folder for model files. I'll reuse anything already there."),
         (f"  {g('●')} Found models in {guess}" if guess else
          d("  (Nothing here yet — I'll download some next.)")),
         step=4)
    models_dir = Path(ask(f"  Folder [{default_dir}]: ", default_dir)).expanduser().resolve()
    models_dir.mkdir(parents=True, exist_ok=True)

    # 3. Get models if empty
    ggufs = sorted(p for p in models_dir.rglob("*.gguf"))
    if not ggufs:
        ggufs = download_models(hw, screen_catalog(hw), models_dir)
        if not ggufs:
            show(hw, "📦  Models", r("  Nothing downloaded. Re-run when you're online."))
            pause()
            raise QuitWizard()

    # 4. Size + wire each base model
    bases = [p for p in ggufs if classify(p) == "base"]
    show(hw, "🔍  Tuning to your hardware",
         d("  " + THINKING[int(time.time()) % len(THINKING)]), "", step=6)
    entries, port = {}, 8081
    gpu_label = "GPU" if hw[1] else "CPU"
    for gguf in bases:
        key = re.sub(r"[^a-z0-9-]", "-", gguf.stem.lower())[:48].strip("-")
        ctx, launch_flags, expert, err = size_model(gguf)
        if not ctx:
            print(f"  {y('⚠')} {gguf.name[:40]:40s} {d(err)}")
            continue
        script = write_start_script(key, gguf, models_dir, llama_bin, llama_root,
                                    port, launch_flags)
        entry = {"ctx_size": ctx, "port": port, "cmd": script}
        extras = []
        if expert:
            extras.append(d("⤓ smart-offload"))
        if companion_for(gguf, "mmproj"):
            entry["multimodal"] = True
            extras.append(c("👁 vision"))
        if companion_for(gguf, "draft"):
            extras.append(d("⚡ turbo"))
        # Always show GPU/CPU backend so user knows it was detected
        extras.append(d(gpu_label))
        entries[key] = entry
        tail = ("  " + " ".join(extras)) if extras else f"  {d(gpu_label)}"
        print(f"  {g('✓')} {key[:35]:35s} {d(f'{ctx:,} ctx')} {tail}")
        port += 1

    if not entries:
        show(hw, "🔍  Tuning", r("  None of the models could be set up. See notes above."))
        pause()
        raise QuitWizard()

    config = [
        "RELAY_MODE=gateway",
        "RELAY_MODEL_LIFECYCLE_ENABLED=true",
        "RELAY_SERIALIZE_REQUESTS=true",   # FCFS: one request at a time, no thrash
        "RELAY_THINKING_SUPPORTED=true",
        f"DEFAULT_MODEL={next(iter(entries))}",
        f"RELAY_MODEL_MAP={json.dumps(entries, separators=(',', ':'))}",
    ]
    compose = None if IS_MAC else render_compose(models_dir, llama_root)
    return config, compose, "local"

def write_start_script(key, gguf, models_dir, llama_bin, llama_root, port, launch_flags):
    """Write a per-model launch script and return the path relay should call."""
    SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

    def _fmt_flags(flags):
        """Format a launch-flags list as one shell-safe string."""
        frags = []
        i = 0
        while i < len(flags):
            if flags[i].startswith("-"):
                if i + 1 < len(flags) and not flags[i + 1].startswith("-"):
                    frags.append(f"{flags[i]} {flags[i+1]}")
                    i += 2
                else:
                    frags.append(flags[i])
                    i += 1
            else:
                i += 1
        return " ".join(frags)

    parts = [
        f'exec "{llama_bin}" \\',
        f'  --model "{gguf}" \\',
        f'  --host 127.0.0.1 --port "${{LLAMA_PORT:-{port}}}" \\',
        f'  {_fmt_flags(launch_flags)} \\',
    ]
    mm = companion_for(gguf, "mmproj")
    if mm:
        parts.append(f'  --mmproj "{mm}" \\')
    draft = companion_for(gguf, "draft")
    if draft:
        parts.append(f'  --model-draft "{draft}" \\')
    parts.append('  "$@"')
    body = ("#!/usr/bin/env bash\n"
            f"# relay model: {key}  (generated by relay setup)\n"
            f'cd "{llama_root}"\n' + "\n".join(parts) + "\n")
    host_path = SCRIPTS_DIR / f"start-{key}.sh"
    host_path.write_text(body)
    host_path.chmod(0o755)
    # On Linux the script runs inside the relay container at /relay/start-scripts.
    return str(host_path) if IS_MAC else f"/relay/start-scripts/{host_path.name}"

def render_compose(models_dir, llama_root):
    tmpl_dir = Path.home() / "templates"
    tmpl_line = f"      - {tmpl_dir}:{tmpl_dir}:ro\n" if tmpl_dir.is_dir() else ""
    dev_line = ("    devices:\n      - /dev/dri:/dev/dri\n"
                if (Path("/dev/dri").exists()) else "")
    return f"""# Generated by relay setup. Docker runs relay; llama.cpp runs on the host
# (mounted in at identical paths). host networking + host PID let relay launch
# and manage model servers exactly like a bare-metal install.
services:
  relay:
    build: .
    image: relay-gateway:local
    container_name: relay
    restart: unless-stopped
    network_mode: host
    pid: host
    env_file:
      - .env
    volumes:
      - {models_dir}:{models_dir}:ro
      - {llama_root}:{llama_root}:ro
      - {SCRIPTS_DIR}:/relay/start-scripts:ro
{tmpl_line}{dev_line}"""

# ── Write + finish ───────────────────────────────────────────────────────────
def _resolve_outputs():
    """Return (env_path, compose_path).
    If we're running from inside a relay checkout, write to the repo's .env
    so docker compose and npm start pick it up without symlinks."""
    pkg_json = REPO_ROOT / "package.json"
    if pkg_json.exists():
        try:
            pkg = json.loads(pkg_json.read_text())
            if pkg.get("name") == "relay":
                return REPO_ROOT / ".env", REPO_ROOT / "docker-compose.yml"
        except Exception:
            pass
    RELAY_HOME.mkdir(parents=True, exist_ok=True)
    return ENV_OUT, COMPOSE_OUT

def write_outputs(config, compose):
    env_path, compose_path = _resolve_outputs()
    if env_path.exists():
        env_path.replace(env_path.with_name(env_path.name + ".bak"))
    env_path.write_text("\n".join(config) + "\n")
    try:
        env_path.chmod(0o600)
    except Exception:
        pass
    if compose:
        compose_path.write_text(compose)

def screen_done(hw, config, compose, kind, step=7):
    env_path, compose_path = _resolve_outputs()
    body = [f"  {g('●')} Saved your setup to {a(str(env_path))}"]
    if compose:
        body.append(f"  {g('●')} Wrote {a(str(compose_path))}")
    body.append("")
    body.append(b("  Start it up:"))
    if compose:
        body.append(f"    {a('docker compose -f ' + str(COMPOSE_OUT) + ' up -d')}")
        body.append(d("    (builds the relay image the first time, then it's instant.)"))
    else:
        body.append(f"    {a('npm start')}")
        body.append(d("    Run this from the relay directory. Keep the terminal open."))
    body.append("")
    body.append(b("  Then test it:"))
    body.append(f"    {a('curl http://127.0.0.1:1234/v1/models')}")
    body.append(d("    …or open  http://127.0.0.1:1234  in your browser"))
    body.append("")
    if kind == "local":
        body.append(d("  Models load on demand and unload when idle — your machine"))
        body.append(d("  stays free until something actually needs them."))
    body.append(g(b("  You're done. Go build something. ✨")))
    show(hw, "🎉  All set!", *body, step=step)
    print()

# ── Main ─────────────────────────────────────────────────────────────────────
def flow_local(hw):
    opts = [
        {"label": "Set me up from scratch",
         "desc": "download a model that fits, tune it, make it plug-and-play"},
        {"label": "I already run models",
         "desc": "just point relay at Ollama or an existing server"},
    ]
    pick = select_one(frame(hw, "🖥  Local gateway",
                            d("  Run AI on your own machine. How hands-on do you want to be?"), step=2),
                      opts)
    return flow_local_full(hw) if pick == 0 else flow_existing(hw)

def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        print("")
        print("Usage:")
        print("  python3 setup-tui.py                  # interactive wizard")
        print("  python3 setup-tui.py --auto            # headless, auto-detect everything")
        print("  python3 setup-tui.py --auto --mode cloud  # headless cloud setup")
        print("  python3 setup-tui.py --models-dir /path/to/models  # custom model dir")
        print("  python3 setup-tui.py --list            # print model catalog")
        print("")
        print("Options:")
        print("  --auto           Run without prompts (headless)")
        print("  --mode MODE      'local' or 'cloud' (only with --auto)")
        print("  --models-dir DIR Override model file directory")
        print("  --list           Print catalog and exit")
        print("  -h, --help       Show this help")
        print("")
        print("Environment:")
        print("  RELAY_HOME       Output directory (default: inside relay repo if detected,")
        print("                   otherwise ~/.relay)")
        return

    if "--list" in sys.argv:
        for m in CATALOG:
            print(f"{m['key']:24s} {m['quant']:10s} {m['notes']}")
        return

    # Resolve --models-dir
    global MODELS_DEFAULT
    for i, arg in enumerate(sys.argv):
        if arg == "--models-dir" and i + 1 < len(sys.argv):
            MODELS_DEFAULT = Path(sys.argv[i + 1])

    hw = detect_hw()

    if "--auto" in sys.argv:
        mode = "cloud" if "--mode" in sys.argv and sys.argv.index("--mode") + 1 < len(sys.argv) and sys.argv[sys.argv.index("--mode") + 1] == "cloud" else "local"
        if mode == "cloud":
            config, compose, kind = flow_cloud(hw)
        else:
            config, compose, kind = auto_local(hw)
        write_outputs(config, compose)
        env_path, _ = _resolve_outputs()
        print(f"  {g('✓')} {len(config)} lines written to {env_path}")
        if compose:
            print(f"  {g('✓')} docker compose written")
        print(f"  {g('✓')} start scripts in {SCRIPTS_DIR}")
        print()
        if mode == "local":
            print(f"  {b('Start it:')}   {a('docker compose up -d')}")
            print(f"  {b('Test it:')}    {a('curl http://127.0.0.1:1234/v1/models')}")
        else:
            print(f"  {b('Start it:')}   {a('npm start')}")
        print()
        return

    screen_welcome(hw)

    mode = select_one(
        frame(hw, "What are we setting up?",
              d("  Two ways to use relay. Pick whichever fits — you can re-run anytime."), step=1),
        [{"label": "☁  Cloud gateway",
          "desc": "one tidy endpoint in front of OpenAI, Anthropic, DeepSeek, Groq"},
         {"label": "🖥  Local gateway",
          "desc": "run models on your own machine — private, free, yours"}])

    config, compose, kind = flow_cloud(hw) if mode == 0 else flow_local(hw)
    write_outputs(config, compose)
    screen_done(hw, config, compose, kind, step=4 if mode == 0 else 7)

if __name__ == "__main__":
    try:
        main()
    except QuitWizard:
        _emit(SHOW)
        print(f"\n  {d('No worries — nothing was changed. Come back anytime. 👋')}\n")
    except (KeyboardInterrupt, EOFError):
        _emit(SHOW)
        print(f"\n  {d('Bye! 👋')}\n")
