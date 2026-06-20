#!/usr/bin/env python3
"""
╔══════════════════════════════════════════╗
║     🦙  llama setup · relay edition     ║
║   one command → model on your hardware  ║
╚══════════════════════════════════════════╝

Detects your GPU, shows curated models that fit, downloads + configures in one go.
No flags. No math. Just pick a model.
"""
import os, sys, subprocess, json, re, time, shutil, textwrap, signal
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
SIZE_MODEL = SCRIPT_DIR / "size-model.py"
MODELS_DIR = Path.home() / "models"
DEFAULT_BRANCH = "main"

GB = 1073741824

# ── Colors ──────────────────────────────────────────────────────────
C = {"R": "\033[0;31m", "G": "\033[0;32m", "Y": "\033[1;33m",
     "B": "\033[0;34m", "M": "\033[0;35m", "C": "\033[0;36m",
     "W": "\033[1;37m", "D": "\033[0m", "BOLD": "\033[1m",
     "DIM": "\033[2m", "REV": "\033[7m"}

def c(color, text): return f"{C.get(color,'')}{text}{C['D']}"
def green(t): return c("G", t)
def yellow(t): return c("Y", t)
def cyan(t): return c("C", t)
def red(t): return c("R", t)
def bold(t): return c("BOLD", t)
def dim(t): return c("DIM", t)
def magenta(t): return c("M", t)

# ── Spinner ─────────────────────────────────────────────────────────
class Spinner:
    def __init__(self, msg=""):
        self.frames = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
        self.i = 0; self.msg = msg; self.running = False
    def start(self, msg=None):
        if msg: self.msg = msg
        self.running = True
        signal.signal(signal.SIGALRM, self._tick)
        signal.setitimer(signal.ITIMER_REAL, 0.08, 0.08)
    def _tick(self, *args):
        if self.running:
            sys.stderr.write(f"\r{cyan(self.frames[self.i % len(self.frames)])} {self.msg}  ")
            sys.stderr.flush()
            self.i += 1
    def stop(self, ok=True):
        self.running = False
        signal.setitimer(signal.ITIMER_REAL, 0)
        mark = green("✓") if ok else red("✗")
        sys.stderr.write(f"\r{mark} {self.msg}  \n")
        sys.stderr.flush()

spinner = Spinner()

# ── Hardware detection ──────────────────────────────────────────────
def detect():
    """Detect GPU vendor, VRAM, DRAM."""
    vendor = "unknown"
    vram = 0
    try:
        subprocess.run(["nvidia-smi"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
        vendor = "nvidia"
        out = subprocess.check_output(["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"], text=True, timeout=5)
        vram = int(out.strip().split("\n")[0]) * 1048576
    except: pass
    
    if vendor == "unknown":
        try:
            subprocess.run(["rocm-smi"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
            vendor = "amd"
            out = subprocess.check_output(["rocm-smi", "--showmeminfo", "vram"], stderr=subprocess.DEVNULL, text=True, timeout=5)
            m = re.search(r"VRAM Total Memory \(B\):\s*(\d+)", out)
            if m: vram = int(m.group(1))
        except: pass
    
    if vram == 0:
        vram = 8 * GB  # guess
    
    dram = 0
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    dram = int(line.split()[1]) * 1024
    except: pass
    if dram == 0: dram = 16 * GB
    
    return vendor, vram, dram

# ── Catalog ─────────────────────────────────────────────────────────
CATALOG = [
    {"name": "Apodex 2B",        "key": "apodex-2b",
     "repo": "FlameF0X/Apodex-1.0-2B-SFT-Q4_K_M-GGUF", "file": "apodex-1.0-2b-sft-q4_k_m.gguf",
     "emoji": "⚡", "desc": "Tiny code model, fits anywhere", "min_vram": 3, "arch": "qwen35", "multimodal": False},
    
    {"name": "Apodex 4B",        "key": "apodex-4b",
     "repo": "FlameF0X/Apodex-1.0-4B-SFT-Q4_K_M-GGUF", "file": "apodex-1.0-4b-sft-q4_k_m.gguf",
     "emoji": "🔧", "desc": "Strong coder, fits 6GB+", "min_vram": 5, "arch": "qwen35", "multimodal": False},
    
    {"name": "Gemma 4 E4B",      "key": "gemma-4-e4b",
     "repo": "unsloth/gemma-4-E4B-it-GGUF", "file": "gemma-4-E4B-it-Q4_K_M.gguf",
     "emoji": "👁️", "desc": "Vision model, Q4 for 8GB cards", "min_vram": 7, "arch": "gemma4", "multimodal": True,
     "draft_repo": "unsloth/gemma-4-E4B-it-GGUF", "draft_file": "mtp-gemma-4-E4B-it.gguf"},
    
    {"name": "Gemma 4 E4B Q3",   "key": "gemma-4-e4b-q3",
     "repo": "unsloth/gemma-4-E4B-it-GGUF", "file": "gemma-4-E4B-it-Q3_K_M.gguf",
     "emoji": "👁️", "desc": "Vision model, Q3 for max context on 8GB", "min_vram": 6, "arch": "gemma4", "multimodal": True,
     "draft_repo": "unsloth/gemma-4-E4B-it-GGUF", "draft_file": "mtp-gemma-4-E4B-it.gguf"},
    
    {"name": "GLM-4.7 Flash 23B","key": "glm47-flash",
     "repo": "unsloth/GLM-4.7-Flash-REAP-23B-A3B-GGUF", "file": "GLM-4.7-Flash-REAP-23B-A3B-UD-Q4_K_XL.gguf",
     "emoji": "🧠", "desc": "23B MoE, DeepSeek arch, 12GB+", "min_vram": 12, "arch": "deepseek2", "multimodal": False},
    
    {"name": "Qwen3.6 35B",      "key": "qwen36-35b",
     "repo": "unsloth/Qwen3.6-35B-A3B-GGUF", "file": "Qwen3.6-35B-A3B-UD-IQ3_XXS.gguf",
     "emoji": "🌟", "desc": "35B MoE generalist, 12GB+", "min_vram": 12, "arch": "qwen35moe", "multimodal": False},
    
    {"name": "Qwen3-Coder 30B",  "key": "qwen3coder-30b",
     "repo": "unsloth/Qwen3-Coder-30B-A3B-Instruct-1M-GGUF", "file": "Qwen3-Coder-30B-A3B-Instruct-1M-UD-Q4_K_XL.gguf",
     "emoji": "💻", "desc": "30B MoE coder, 1M ctx, 16GB+", "min_vram": 14, "arch": "qwen3moe", "multimodal": False},
    
    {"name": "Qwen3-Next 80B",   "key": "qwen3next-80b",
     "repo": "unsloth/Qwen3-Next-80B-A3B-Instruct-GGUF", "file": "Qwen3-Next-80B-A3B-Instruct-UD-IQ2_XXS.gguf",
     "emoji": "🚀", "desc": "80B MoE, largest that fits 16GB", "min_vram": 15, "arch": "qwen3next", "multimodal": False},
]

def fits(model, vram_gb):
    return vram_gb >= model["min_vram"]

# ── Menu ───────────────────────────────────────────────────────────
def clear(): os.system("clear 2>/dev/null || true")

def header(vendor, vram_gb, dram_gb):
    vendor_icon = {"nvidia": "🔺 NVIDIA", "amd": "🔴 AMD", "unknown": "🖥️  GPU"}
    print()
    print(bold(magenta("  ╔══════════════════════════════════════╗")))
    print(bold(magenta("  ║")) + bold("     🦙  llama setup · relay edition     ") + bold(magenta("║")))
    print(bold(magenta("  ╚══════════════════════════════════════╝")))
    print()
    print(f"  {vendor_icon.get(vendor, '🖥️')}  │  {green(f'{vram_gb:.0f} GB VRAM')}  │  {cyan(f'{dram_gb:.0f} GB RAM')}")
    print(f"  {dim('─' * 44)}")
    print()

def show_menu(vram_gb):
    print(bold("  Pick a model:"))
    print()
    for i, m in enumerate(CATALOG, 1):
        ok = fits(m, vram_gb)
        icon = m["emoji"]
        status = green("✔ fits") if ok else red(f"✘ needs {m['min_vram']}GB+")
        mm = " 🖼️" if m["multimodal"] else ""
        name = bold(m['name']) if ok else dim(m['name'])
        print(f"  {bold(str(i))}. {icon} {name}{mm}")
        print(f"     {dim(m['desc'])} — {status}")
        print()
    
    print(f"  {dim('─' * 44)}")
    print(f"  {bold('0')}. {dim('quit')}")
    print()

def pick_model(vram_gb):
    while True:
        clear()
        header(*DETECTED)
        show_menu(vram_gb)
        try:
            choice = input(f"  {cyan('→')} ").strip()
            if choice == "0" or choice.lower() == "q":
                print(f"\n  {yellow('bye! 👋')}\n")
                sys.exit(0)
            idx = int(choice) - 1
            if 0 <= idx < len(CATALOG):
                m = CATALOG[idx]
                if not fits(m, vram_gb):
                    print(f"\n  {red('This model needs')} {m['min_vram']}GB+ VRAM {red('but you have')} {vram_gb:.0f}GB.")
                    print(f"  {yellow('Pick a smaller model or press Enter to continue.')}")
                    input()
                    continue
                return m
        except (ValueError, EOFError):
            pass
        print(f"  {red('Pick a number from the list!')}")
        time.sleep(0.5)

# ── Download ────────────────────────────────────────────────────────
def download_model(model):
    dest_dir = MODELS_DIR / model["repo"].replace("/", "_")
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / model["file"]
    
    if dest.exists():
        print(f"  {green('✓')} Already downloaded: {dim(str(dest))}")
        return str(dest), None
    
    url = f"https://huggingface.co/{model['repo']}/resolve/main/{model['file']}?download=true"
    print(f"  {cyan('↓')} Downloading {bold(model['file'])}...")
    print(f"  {dim(url)}")
    
    # Run curl with progress on stderr, quiet on stdout
    rc = os.system(f"curl -L -C - --retry 5 --retry-delay 10 --progress-bar "
                    f"-o '{dest}.part' '{url}' 2>&2")
    
    if rc == 0 and dest.with_suffix(dest.suffix + ".part").exists():
        os.rename(str(dest) + ".part", str(dest))
        size_gb = dest.stat().st_size / GB
        print(f"  {green('✓')} Downloaded: {size_gb:.1f} GB")
        return str(dest), None
    else:
        print(f"  {red('✗')} Download failed")
        return None, None

def download_draft(model):
    if "draft_repo" not in model:
        return None
    
    dest_dir = MODELS_DIR / model["draft_repo"].replace("/", "_")
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / model["draft_file"]
    
    if dest.exists():
        return str(dest)
    
    url = f"https://huggingface.co/{model['draft_repo']}/resolve/main/{model['draft_file']}?download=true"
    print(f"  {cyan('↓')} Draft: {dim(model['draft_file'])}")
    rc = os.system(f"curl -L -C - --retry 5 --retry-delay 10 -sS "
                    f"-o '{dest}.part' '{url}' 2>&2")
    if rc == 0 and dest.with_suffix(dest.suffix + ".part").exists():
        os.rename(str(dest) + ".part", str(dest))
        return str(dest)
    return None

# ── Size ────────────────────────────────────────────────────────────
def size_model(model_path, draft_path, conservative=True):
    cmd = [sys.executable, str(SIZE_MODEL), model_path, "--write-script"]
    if conservative: cmd.append("--conservative")
    if draft_path: cmd.extend(["--draft", draft_path])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        print(result.stdout)
        if result.returncode != 0:
            print(red(f"Size computation warning: {result.stderr[:200]}"))
        # Parse ctx_size
        m = re.search(r"max_ctx=(\d+)", result.stdout)
        ctx = int(m.group(1)) if m else 0
        # Parse expert flag
        is_cpu_moe = "--cpu-moe" in result.stdout
        n_cpu_moe = 0
        nm = re.search(r"n-cpu-moe (\d+)", result.stdout)
        if nm: n_cpu_moe = int(nm.group(1))
        return ctx, is_cpu_moe, n_cpu_moe
    except Exception as e:
        print(red(f"Size computation failed: {e}"))
        return 0, False, 0

# ── Main ────────────────────────────────────────────────────────────
def main():
    global DETECTED
    os.chdir(REPO_ROOT)
    
    # Parse CLI: --model <name> --no-tui for scripted use
    cli_model = None; no_tui = False; cli_safe = False
    args = sys.argv[1:]; i = 0
    while i < len(args):
        if args[i] == "--model" and i+1 < len(args): cli_model = args[i+1]; i += 2
        elif args[i] == "--no-tui": no_tui = True; i += 1
        elif args[i] == "--safe": cli_safe = True; i += 1
        elif args[i] == "--list":
            for m in CATALOG: print(f"{m['key']:20s} {m['emoji']} {m['name']}")
            sys.exit(0)
        else: i += 1
    
    clear()
    print()
    spinner_msg = "Detecting your hardware..."
    sys.stderr.write(f"  {cyan('⠋')} {spinner_msg}")
    sys.stderr.flush()
    
    vendor, vram, dram = detect()
    vram_gb = vram / GB
    dram_gb = dram / GB
    DETECTED = (vendor, vram_gb, dram_gb)
    
    sys.stderr.write(f"\r  {green('✓')} {spinner_msg}\n")
    sys.stderr.flush()
    time.sleep(0.3)
    
    # Pick model: CLI arg or interactive
    if cli_model:
        model = next((m for m in CATALOG if m["key"] == cli_model), None)
        if not model:
            print(f"  {red('Unknown model:')} {cli_model}")
            print(f"  {dim('Use --list to see available models.')}")
            sys.exit(1)
        if not fits(model, vram_gb):
            print(f"  {red('Model needs')} {model['min_vram']}GB+ VRAM {red('but you have')} {vram_gb:.0f}GB.")
    elif no_tui:
        print(f"  {red('--no-tui requires --model <name>')}")
        sys.exit(1)
    else:
        model = pick_model(vram_gb)
    
    clear()
    header(*DETECTED)
    
    print(f"  {bold('Setting up:')} {model['emoji']} {bold(model['name'])}")
    print(f"  {dim(model['desc'])}")
    print()
    
    # Download
    model_path, _ = download_model(model)
    if not model_path:
        print(f"\n  {red('Setup failed — could not download model.')}")
        sys.exit(1)
    
    draft_path = download_draft(model)
    print()
    
    # Size
    print(f"  {cyan('🔍')} Computing optimal settings for your {vram_gb:.0f}GB GPU...")
    print()
    ctx, is_cpu_moe, n_cpu_moe = size_model(model_path, draft_path, conservative=True)
    print()
    
    # Done
    bn = Path(model_path).stem
    script_path = Path.home() / f"start-llama-{bn}.sh"
    
    clear()
    header(*DETECTED)
    
    # ── Detect existing relay installation ────────────────────────
    relay_env = None; relay_running = False
    for p in [Path("/etc/relay/relay.env"), REPO_ROOT / "deploy" / "relay.env.example"]:
        if p.exists(): relay_env = p; break
    try:
        subprocess.run(["systemctl","is-active","--quiet","relay.service"], timeout=5)
        relay_running = True
    except: pass
    
    print(f"  {green('✨')} {bold(model['name'])} is ready!")
    print()
    if ctx > 0:
        print(f"  {bold('Context:')}  {green(f'{ctx:,}')} tokens")
        if is_cpu_moe:
            print(f"  {bold('Experts:')}  {yellow('all on CPU')}")
        elif n_cpu_moe > 0:
            print(f"  {bold('Experts:')}  {yellow(f'{n_cpu_moe} layers on CPU')}")
        else:
            print(f"  {bold('Experts:')}  {green('all on GPU')}")
    print()
    print(f"  {bold('Start:')}    {dim(script_path)}")
    
    mm_flag = ',"multimodal":true' if model.get("multimodal") else ""
    new_entry = f'{{"{model["key"]}": {{"cmd":"{script_path}","ctx_size":{ctx}{mm_flag}}}}}'
    
    # ── Relay-aware registration ─────────────────────────────────
    if relay_env:
        can_write = os.access(relay_env, os.W_OK)
        can_read = os.access(relay_env, os.R_OK)
        print(f"\n  {magenta('Relay found:')} {dim(str(relay_env))}", end="")
        if not can_write:
            print(f" {dim('(needs sudo)')}")
        else:
            print()
        print(f"  {yellow('Register')} {bold(model['name'])} {yellow('with relay?')} {dim('[y/N]')} ", end="")
        sys.stdout.flush()
        try: ans = input().strip().lower()
        except: ans = "n"
        
        if ans in ("y","yes"):
            if can_read and can_write:
                try:
                    lines = relay_env.read_text().split("\n")
                    out = []
                    for line in lines:
                        if line.startswith("RELAY_MODEL_MAP=") and not line.startswith("#"):
                            stripped = line.rstrip()
                            if stripped.endswith("'}"):
                                line = stripped[:-2] + "," + new_entry[1:]
                            elif stripped.endswith("'"):
                                # RELAY_MODEL_MAP='' — replace with new entry
                                line = line.rstrip()[:-1] + new_entry[1:]
                        out.append(line)
                    relay_env.write_text("\n".join(out) + "\n")
                    print(f"  {green('✓')} Registered!")
                    if relay_running:
                        print(f"  {yellow('⟳')} Restart: {dim('sudo systemctl restart relay.service')}")
                except Exception as e:
                    print(f"  {red('⚠')} Could not update: {e}")
            else:
                print(f"  {yellow('⚠')} Needs sudo. Run this:")
                print(f"  {dim('echo "RELAY_MODEL_MAP=')}'{new_entry}'{dim('" | sudo tee -a')} {relay_env}")
            
            if relay_running and not can_write:
                print(f"  {yellow('Then restart:')} {dim('sudo systemctl restart relay.service')}")
        else:
            print(f"  {dim('Skipped. Add later:')}")
            print(f"  {dim('RELAY_MODEL_MAP=')}'{new_entry}'")
    else:
        print(f"\n  {yellow('No relay found.')}")
        print(f"  {dim('Install: sudo ./scripts/install-systemd.sh')}")
        print(f"  {dim('Then add: RELAY_MODEL_MAP=')}'{new_entry}'")
    
    print()
    print(f"  {green('🦙 happy prompting!')}")
    print()

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: print(f"\n  {yellow('bye! 👋')}\n"); sys.exit(0)
