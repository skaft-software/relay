#!/usr/bin/env bash
# Relay one-line installer.
#
#   curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/install.sh | bash
#
# The shell layer only bootstraps the repo and host prerequisites. The real
# setup experience lives in src/setup.ts so the TUI remains testable and
# maintainable.
set -euo pipefail

REPO_URL="${RELAY_REPO_URL:-https://github.com/achuthanmukundan00/relay.git}"
INSTALL_DIR="${RELAY_INSTALL_DIR:-$HOME/relay}"
PORT="${PORT:-1234}"
NO_START="${RELAY_NO_START:-0}"

bold="$(printf '\033[1m')"
dim="$(printf '\033[2m')"
cyan="$(printf '\033[36m')"
green="$(printf '\033[32m')"
yellow="$(printf '\033[33m')"
red="$(printf '\033[31m')"
reset="$(printf '\033[0m')"

say() { printf '  %b\n' "$*"; }
step() { printf '\n  %b== %s ==%b\n' "$cyan$bold" "$1" "$reset"; }
ok() { say "${green}[ok]${reset} $*"; }
warn() { say "${yellow}[warn]${reset} $*"; }
die() { say "${red}[err]${reset} $*"; exit 1; }
ask_yes() {
  local prompt="$1"
  local default="${2:-n}"
  local suffix="[y/N]"
  [[ "$default" == "y" ]] && suffix="[Y/n]"
  printf '  %b>%b %s %s ' "$cyan" "$reset" "$prompt" "$suffix"
  read -r reply </dev/tty || reply=""
  reply="${reply:-$default}"
  [[ "$reply" == "y" || "$reply" == "Y" || "$reply" == "yes" || "$reply" == "YES" ]]
}

have() { command -v "$1" >/dev/null 2>&1; }

banner() {
  printf '\n'
  say "${bold}${cyan}+--------------------------+${reset}"
  say "${bold}${cyan}| Relay Gateway Installer  |${reset}"
  say "${bold}${cyan}+--------------------------+${reset}"
  say "${dim}One command for Relay, llama.cpp, models, Docker, and public HTTPS.${reset}"
}

detect_platform() {
  OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64|amd64) ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
  esac

  GPU="cpu"
  DRIVER="none"
  if have nvidia-smi; then
    GPU="nvidia"
    DRIVER="cuda"
  elif have rocm-smi || ls /dev/dri/renderD* >/dev/null 2>&1; then
    GPU="amd"
    DRIVER="vulkan"
  elif [[ "$OS" == "darwin" && "$ARCH" == "arm64" ]]; then
    GPU="apple"
    DRIVER="metal"
  elif have vulkaninfo; then
    GPU="vulkan"
    DRIVER="vulkan"
  fi
}

install_docker_hint() {
  warn "Docker was not found."
  if [[ "$OS" == "linux" ]] && have curl && ask_yes "Install Docker using Docker's official convenience script?" "n"; then
    curl -fsSL https://get.docker.com | sh
    ok "Docker installed. You may need to log out and back in for group membership."
    return
  fi
  warn "Skipping Docker install. Relay can still run directly with npm start."
  say "${dim}Docker docs: https://docs.docker.com/get-docker/${reset}"
}

install_node_hint() {
  warn "Node.js 22+ was not found."
  if [[ "$OS" == "linux" ]] && have curl && ask_yes "Install Node.js 22 via NodeSource?" "y"; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    return
  fi
  die "Install Node.js 22+ and rerun this installer."
}

node_major() {
  node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0
}

clone_or_update() {
  step "Repository"
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    ok "Using existing checkout at $INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --quiet origin || warn "Could not fetch updates; continuing with local checkout."
    git -C "$INSTALL_DIR" pull --ff-only --quiet origin main || warn "Could not fast-forward; continuing without changing local work."
  elif [[ -e "$INSTALL_DIR" ]]; then
    die "$INSTALL_DIR exists but is not a git checkout. Set RELAY_INSTALL_DIR to another path."
  else
    git clone "$REPO_URL" "$INSTALL_DIR"
    ok "Cloned Relay to $INSTALL_DIR"
  fi
}

install_llama_cpp() {
  step "llama.cpp"
  local default_dir="$HOME/llama.cpp"
  local llama_bin=""
  for candidate in \
    "${RELAY_LLAMA_SERVER_PATH:-}" \
    "$default_dir/build/bin/llama-server" \
    "$default_dir/build-vulkan/bin/llama-server" \
    "$default_dir/build-cuda/bin/llama-server" \
    "$default_dir/build-metal/bin/llama-server" \
    "/usr/local/bin/llama-server"; do
    [[ -n "${candidate:-}" && -x "$candidate" ]] && llama_bin="$candidate" && break
  done

  if [[ -n "$llama_bin" ]]; then
    ok "Found llama-server at $llama_bin"
    export RELAY_LLAMA_SERVER_PATH="$llama_bin"
    return
  fi

  warn "llama-server was not found."
  if ! ask_yes "Build llama.cpp now for $GPU/$DRIVER?" "y"; then
    warn "Skipping llama.cpp build. The setup wizard can point at an existing llama-server later."
    return
  fi

  have git || die "git is required to build llama.cpp."
  have cmake || die "cmake is required to build llama.cpp."
  have make || warn "A compiler toolchain is required. Install build-essential/clang if the build fails."

  if [[ ! -d "$default_dir/.git" ]]; then
    git clone https://github.com/ggerganov/llama.cpp "$default_dir"
  else
    git -C "$default_dir" pull --ff-only --quiet || warn "Could not update llama.cpp; building current checkout."
  fi

  local build_dir="$default_dir/build"
  local cmake_flags=()
  case "$DRIVER" in
    cuda) build_dir="$default_dir/build-cuda"; cmake_flags=(-DGGML_CUDA=ON) ;;
    metal) build_dir="$default_dir/build-metal"; cmake_flags=(-DGGML_METAL=ON) ;;
    vulkan) build_dir="$default_dir/build-vulkan"; cmake_flags=(-DGGML_VULKAN=ON) ;;
  esac

  cmake -S "$default_dir" -B "$build_dir" "${cmake_flags[@]}"
  cmake --build "$build_dir" --config Release -j "$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"
  llama_bin="$build_dir/bin/llama-server"
  [[ -x "$llama_bin" ]] || die "llama.cpp build finished but llama-server was not found at $llama_bin"
  export RELAY_LLAMA_SERVER_PATH="$llama_bin"
  ok "Built llama-server at $llama_bin"
}

install_dependencies() {
  step "Prerequisites"
  detect_platform
  ok "System: $OS/$ARCH"
  ok "Acceleration: $GPU/$DRIVER"

  have git || die "git is required."
  if ! have node || [[ "$(node_major)" -lt 22 ]]; then
    install_node_hint
  fi
  ok "Node $(node -v)"

  if have docker; then
    if docker compose version >/dev/null 2>&1; then
      ok "Docker Compose available"
    else
      warn "Docker is installed but the compose plugin was not found."
    fi
  else
    install_docker_hint
  fi
}

run_setup() {
  step "Setup"
  cd "$INSTALL_DIR"
  npm install
  ok "Dependencies installed"
  PORT="$PORT" node --experimental-strip-types src/main.ts setup
}

start_relay() {
  [[ "$NO_START" == "1" ]] && return
  step "Start"
  cd "$INSTALL_DIR"
  if ask_yes "Start Relay now?" "y"; then
    if have docker && docker compose version >/dev/null 2>&1 && ask_yes "Run Relay under Docker Compose?" "n"; then
      docker compose up -d --build relay
      ok "Relay container started"
    else
      warn "Starting npm process in the foreground. Press Ctrl+C to stop it."
      npm start
    fi
  else
    say "Start later with:"
    say "  ${bold}cd $INSTALL_DIR && npm start${reset}"
  fi
}

finish() {
  local api="http://127.0.0.1:$PORT/v1"
  step "Endpoint"
  say "Local API: ${cyan}$api${reset}"
  say "Status:    ${cyan}http://127.0.0.1:$PORT/relay/status${reset}"
  say "Setup:     ${dim}cd $INSTALL_DIR && node --experimental-strip-types src/main.ts setup${reset}"
  say "Public:    ${dim}cd $INSTALL_DIR && docker compose --profile public up -d tunnel${reset}"
}

banner
install_dependencies
clone_or_update
install_llama_cpp
run_setup
finish
start_relay
