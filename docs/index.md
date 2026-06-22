---
layout: home

hero:
  text: Your GPU can run great AI models.
  tagline: Relay detects your hardware, sizes your models, generates configs, and translates every API call so your agent just works.
---

## What Relay Solves

### Your agent and your model don't speak the same language.

Coding agents expect exact OpenAI or Anthropic API contracts. Your local model speaks something close, but different enough to break things. One missing field, one out-of-order SSE event, one wrong error shape — your agent silently degrades.

**Relay translates everything in both directions.** Chat completions, responses, Anthropic messages, tool calls, streaming — normalized to the exact shapes your agent expects. No per-model patches. No agent-side workarounds.

### Will this model work on my hardware?

You shouldn't need to understand MoE expert offloading, KV cache quantization, or VRAM headroom. You just want to know if a model runs well on your GPU and at what context size.

**Relay reads your actual GGUF files, measures your GPU, and computes optimal flags for YOUR hardware.** It tells you which models fit, at what context size, before you start anything. No guesswork.

### Getting local models working takes hours.

Find the GGUF. Download it. Figure out flags. Set up llama.cpp. Write a start script. Configure ports. Choose KV cache quantization. Test. Fix. Repeat.

**Relay's setup wizard does it all.** It finds your GGUF files, sizes each one, generates start scripts with every flag dialed in, and writes your config. Re-run anytime you add new models.

## Capabilities

- OpenAI `/v1/chat/completions` + Anthropic `/v1/messages` APIs
- Streaming SSE normalization
- Tool call compatibility (both protocols)
- Error shape normalization (both protocols)
- Auto model start / stop / switch (lazy lifecycle)
- Session-aware context isolation
- Cloud API proxy mode (OpenAI, Anthropic, DeepSeek, Groq, Gemini)
- Hardware-aware auto-setup (GPU detection, VRAM sizing, MoE expert offload)
- HTML status dashboard at `/`
- Health, metrics, observability endpoints
- Docker + one-liner install

## Two Ways to Run

**Gateway mode** manages local llama.cpp models — auto-detects your GPU, sizes every GGUF, generates start scripts, and handles the full lifecycle.

**Cloud mode** proxies OpenAI, Anthropic, DeepSeek, Groq, or Gemini through a single endpoint. Same API surface either way. Your agent doesn't know or care where the model lives.

## Quickstart

```bash
# Clone and run the setup wizard
git clone https://github.com/achuthanmukundan00/relay
cd relay
npm install
node --experimental-strip-types src/main.ts setup

# Or run directly
npx relay setup

# After setup, start
docker compose up -d

# Point your agent at  http://127.0.0.1:1234/v1
```

Already have an agent runtime? Relay works underneath any OpenAI or Anthropic-compatible client — opencode, Cursor, Claude Code, Continue, Aider, and more. Point them at `http://127.0.0.1:1234/v1`.
