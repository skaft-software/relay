# Deployment

Relay runs in Docker. Production deployment uses Docker Compose with host networking for GPU access.

## Docker Compose (Recommended)



The compose file uses:
- network_mode: host — direct access to llama-server on localhost
- pid: host — can manage model processes
- restart: unless-stopped — survives reboots
- GPU passthrough via /dev/dri

## One-Line Install



## Systemd (Alternative)

For systems without Docker:



This installs Relay to /opt/relay with a relay user and systemd unit.

## Environment

All configuration is in .env. See docs/configuration.md for the full reference.

Key variables for model lifecycle:

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

## Updating


