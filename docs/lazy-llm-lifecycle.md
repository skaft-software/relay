# Lazy LLM Lifecycle

Relay can optionally manage the lifecycle of local llama.cpp model servers.

## Overview

When RELAY_MODEL_LIFECYCLE_ENABLED is true, Relay:
1. Tracks which model is currently loaded
2. Starts models on dedicated ports (8081, 8082, ...)
3. Switches models when a client requests a different one
4. Shuts down idle models after a configurable timeout

## Model Map

Configure models in RELAY_MODEL_MAP as a JSON object. Each entry needs a start command script and context size:



## Start Scripts

Model start scripts must accept the LLAMA_PORT environment variable for dynamic port allocation:



## Switching

Two switch policies via RELAY_SWITCH_POLICY:

**Eager** (default): Kills old model before starting new one. Uses 1x VRAM.

**Graceful**: Starts new model on its own port, waits for health, then kills old model. Keeps old model alive for a grace period for instant switch-back. Requires 2x VRAM.

## Pre-Warming

When RELAY_SWITCH_PREWARM is enabled, Relay caches conversation prefixes from successful requests. On model switch, it sends these prefixes to the new model (with max_tokens=1) to pre-fill the KV cache.

## Orphan Cleanup

Relay kills any existing llama-server processes on its port range (8080-8091) at startup. This prevents stale processes from previous instances from consuming VRAM or causing port conflicts.

## Idle Shutdown

After RELAY_MODEL_IDLE_SHUTDOWN_MS of inactivity, Relay unloads models to free VRAM. The current model stays loaded; only warm/grace-period models are cleaned up.

## Docker

Relay runs in Docker with host networking and PID namespace sharing (network_mode: host, pid: host). This gives Relay direct access to localhost ports and the ability to manage model processes.
