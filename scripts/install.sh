#!/usr/bin/env bash
# Relay one-liner installer
# curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/scripts/install.sh | bash
set -e

RELAY_DIR="${RELAY_DIR:-$HOME/relay}"
REPO_URL="https://github.com/achuthanmukundan00/relay.git"

# ── Colour helpers ──────────────────────────────────────────────────────
if [ -t 1 ]; then
  BLD="\033[1m";  DIM="\033[2m"
  GRN="\033[32m"; CYN="\033[36m"; YLW="\033[33m"; RED="\033[31m"
  BLU="\033[38;5;75m"
  RST="\033[0m"
else
  BLD=""; DIM=""; GRN=""; CYN=""; YLW=""; RED=""; BLU=""; RST=""
fi

printf "\n  ${BLU}${BLD}relay${RST} ${DIM}installer${RST}\n\n"

# 1. Node.js check
if ! command -v node &>/dev/null; then
  printf "  ${RED}✗${RST} Node.js not found.\n"
  printf "  ${DIM}Relay needs Node.js 22 or newer.${RST}\n"
  printf "  ${DIM}Download it:${RST} ${CYN}https://nodejs.org${RST}\n"
  printf "  ${DIM}Then run this script again.${RST}\n\n"
  exit 1
fi
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 22 ] 2>/dev/null; then
  printf "  ${YLW}⚠${RST}  Node.js $(node -v) is a bit old. v22+ recommended.\n"
  printf "  ${DIM}Things should still work, but upgrade if you hit issues.${RST}\n"
fi
printf "  ${GRN}✓${RST} Node.js $(node -v)\n"

# 2. Git check
if ! command -v git &>/dev/null; then
  printf "  ${RED}✗${RST} git not found. Install it and try again.\n\n"
  exit 1
fi

# 3. Clone or update
if [ -d "$RELAY_DIR/.git" ]; then
  printf "  ${GRN}✓${RST} Relay found at ${DIM}%s${RST}\n" "$RELAY_DIR"
  cd "$RELAY_DIR"
  printf "  ${DIM}→ pulling latest…${RST}\n"
  git pull --ff-only 2>/dev/null || true
else
  printf "  ${DIM}→ cloning to %s…${RST}\n" "$RELAY_DIR"
  mkdir -p "$(dirname "$RELAY_DIR")"
  git clone "$REPO_URL" "$RELAY_DIR"
  cd "$RELAY_DIR"
fi

# 4. Install dependencies
printf "  ${DIM}→ installing dependencies…${RST}\n"
npm install --silent

# 5. Launch setup wizard
printf "\n  ${BLU}${BLD}Launching setup wizard…${RST}\n\n"
exec node --experimental-strip-types src/main.ts setup
