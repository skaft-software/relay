# Lazy LLM Lifecycle

Relay can optionally manage the lifecycle of local llama.cpp model servers — starting, stopping, and switching models on demand.

## Overview

When RELAY_MODEL_LIFECYCLE_ENABLED is true, Relay:

1. Tracks which model is currently loaded
2. Starts models on dedicated ports (8081, 8082, ...)
3. Switches models when a client requests a different one
4. Shuts down idle models after a configurable timeout

## Model Map

Configure models in RELAY_MODEL_MAP as a JSON object:

STARSHIP_SHELL=zsh
MANPATH=:/usr/share/man:/usr/local/share/man:/Applications/Ghostty.app/Contents/Resources/ghostty/../man:
REMOTE_RELAY_BASE_URL=https://ai.watchyourtemper.com
GHOSTTY_RESOURCES_DIR=/Applications/Ghostty.app/Contents/Resources/ghostty
DEEPSEEK_API_KEY=sk-REDACTED
TERM_PROGRAM=ghostty
SHELL=/bin/zsh
TERM=xterm-ghostty
HOMEBREW_REPOSITORY=/opt/homebrew
TMPDIR=/var/folders/d1/k5vl2s3n5nggpnfg963q1vwr0000gn/T/
TERM_PROGRAM_VERSION=1.3.1
FPATH=/opt/homebrew/share/zsh/site-functions:/usr/local/share/zsh/site-functions:/usr/share/zsh/site-functions:/usr/share/zsh/5.9/functions
PI_CODING_AGENT=true
LOCAL_PROXY_PORT=1234
USER=achumukundan
OPENAI_API_KEY=sk-REDACTED
COMMAND_MODE=unix2003
SSH_AUTH_SOCK=/private/tmp/com.apple.launchd.cowldiFg6X/Listeners
__CF_USER_TEXT_ENCODING=0x1F5:0x0:0x52
PATH=/Users/achumukundan/.pi/agent/bin:/Users/achumukundan/.bun/bin:/Users/achumukundan/Library/Python/3.9/bin:/opt/homebrew/opt/openjdk@17/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/System/Cryptexes/App/usr/bin:/usr/bin:/bin:/usr/sbin:/sbin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/local/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/bin:/var/run/com.apple.security.cryptexd/codex.system/bootstrap/usr/appleinternal/bin:/opt/pmk/env/global/bin:/Library/Apple/usr/bin:/Users/achumukundan/.cargo/bin:/Users/achumukundan/.local/bin:/Applications/Ghostty.app/Contents/MacOS
_=/usr/bin/env
GHOSTTY_SHELL_FEATURES=path,title
__CFBundleIdentifier=com.mitchellh.ghostty
CONTEXT7_API_KEY=ctx7sk-REDACTED
CLAUDE_CODE_AUTO_COMPACT_WINDOW=1000000
PWD=/Users/achumukundan/workspace/git/hamr
OPENROUTER_API_KEY=sk-REDACTED
LANG=en_CA.UTF-8
XPC_FLAGS=0x0
ANTHROPIC_API_KEY=sk-REDACTED
XPC_SERVICE_NAME=0
HOME=/Users/achumukundan
SHLVL=2
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
TERMINFO=/Applications/Ghostty.app/Contents/Resources/terminfo
LLM_MODEL=Qwen3.6-35B-A3B-UD-IQ3_XXS.gguf
HOMEBREW_PREFIX=/opt/homebrew
CF_ACCESS_CLIENT_ID=fe9181e1cad51b266dff2fda0306ec22.access
STARSHIP_SESSION_KEY=2187211733128101
XAI_API_KEY=xai-REDACTED
LOGNAME=achumukundan
LLM_BASE_URL=https://ai.watchyourtemper.com/v1
XDG_DATA_DIRS=/usr/local/share:/usr/share:/Applications/Ghostty.app/Contents/Resources/ghostty/..
GHOSTTY_BIN_DIR=/Applications/Ghostty.app/Contents/MacOS
BUN_INSTALL=/Users/achumukundan/.bun
CF_ACCESS_CLIENT_SECRET=2686515372b3f5de624c31bdd48bd3398ecb3c9d0999d7c6c9ac4448b788e767
INFOPATH=/opt/homebrew/share/info:
HOMEBREW_CELLAR=/opt/homebrew/Cellar
OSLogRateLimit=64
AUTOCAREER_USE_SYNAX=true
COLORTERM=truecolor

Each model entry requires:
- cmd — shell script to start the model server
- ctx_size — context window size

Optional fields:
- timeout_sec — startup timeout override (default: RELAY_MODEL_START_TIMEOUT_MS)
- multimodal — true if model supports vision
- port — fixed port override
- switchGraceMs — grace period before killing old instance after switch

## Start Scripts

Model start scripts must accept the LLAMA_PORT environment variable:



## Switching

Two switch policies are available:

### Eager (default)
Kills the old model before starting the new one. Uses 1x VRAM.

### Graceful
Starts the new model on its own port, waits for it to become healthy, then kills the old model. Keeps the old model alive for a configurable grace period for instant switch-back. Requires 2x VRAM.

Set via RELAY_SWITCH_POLICY.

## Pre-Warming

When RELAY_SWITCH_PREWARM is enabled, Relay caches conversation prefixes from successful requests. On model switch, it sends these prefixes to the new model (with max_tokens=1) to pre-fill the KV cache, making the first real request instant.

## Orphan Cleanup

Relay kills any existing llama-server processes on its port range (8080-8091) at startup. This prevents stale processes from previous instances from consuming VRAM or causing port conflicts.

## Idle Shutdown

After RELAY_MODEL_IDLE_SHUTDOWN_MS of inactivity, Relay unloads models to free VRAM. The current model stays loaded; only warm/grace-period models are cleaned up.

## Docker

Relay runs in Docker with host networking and PID namespace sharing:



This gives Relay direct access to localhost ports and the ability to manage model processes.
