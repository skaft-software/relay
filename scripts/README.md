# scripts/

Relay's helper scripts. They fall into three groups — only the first ships to
npm end users (via the `package.json` `files` allowlist); the rest are dev /
ops tools used from a checkout.

## Shipped to end users (referenced by the `relay` CLI at runtime)

| Script | Purpose |
|---|---|
| `doctor.ts` | `relay doctor` — static pre-flight + runtime health checks |
| `probe-gpu.sh` | Detects GPU/driver/VRAM; called by the setup wizard |
| `size-model.py` | Computes optimal `--ctx-size` / offload for a GGUF on this hardware |
| `fetch-catalog.py` | Regenerates `docs/model-catalog.json` from upstream sources |
| `check-ports.sh` | Reports port conflicts before Relay starts |
| `logs.sh` | Tails / filters Relay logs |

## Install + smoke (run from a checkout or via curl)

| Script | Purpose |
|---|---|
| `install.sh` | The one-liner installer (`curl \| bash`). Bootstraps Node, clones the repo, optionally builds llama.cpp, launches the setup wizard. **Canonical installer — there is no other.** |
| `smoke-openai.ts` | `npm run smoke:openai` — live OpenAI-API smoke test against a running Relay |
| `smoke-anthropic.ts` | `npm run smoke:anthropic` — live Anthropic-API smoke test |
| `verify-runtime.sh` | Empirical VRAM/OOM test: launches llama-server, fills KV cache, compares to `size-model.py` prediction |

## Deployment / dev ops (not shipped)

| Script | Purpose |
|---|---|
| `deploy-to-opt.sh` | Sync a pinned git ref to `/opt/relay` for a managed deployment |
| `setup-model.sh` | Legacy standalone model sizer (superseded by the setup TUI + `provision`; kept for scripting) |
| `diagnose-truncation.sh` | Dumps truncation diagnostics for a request |

## Notes

- The `relay` bin (`bin/relay.js`) dispatches `relay doctor` and `relay provision`
  to `doctor.ts` and `src/provision.ts` respectively.
- `npm run` scripts (see `package.json`) wrap the smoke/doctor/catalog commands
  for the dev workflow and hardcode `--env-file=.env` (repo root). The `relay`
  bin resolves the env file itself so it works from a global install too.
