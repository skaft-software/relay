---
layout: home

hero:
  text: Your GPU can run great AI models.
  tagline: Your coding agent just can't talk to them. Relay is the missing piece — it detects your hardware, sizes your models, generates perfect configs, and translates every API call so your agent just works.
---

<div class="relay-section">

<ProblemVisual />

<div class="relay-pipeline-section">
  <p class="relay-section-label">How It Works</p>
  <CompatibilityVisual />
</div>

<p class="relay-section-label">What Relay Solves</p>

<div class="relay-problem">
  <div class="relay-problem-copy">
    <h2>Your agent and your model don't speak the same language.</h2>
    <p>
      Coding agents expect exact OpenAI or Anthropic API contracts. Your local model
      speaks something close, but different enough to break things. One missing field,
      one out-of-order SSE event, one wrong error shape — your agent silently degrades.
    </p>
    <p>
      <strong>Relay translates everything in both directions.</strong> Chat completions,
      responses, Anthropic messages, tool calls, streaming — normalized to the exact
      shapes your agent expects. No per-model patches. No agent-side workarounds.
    </p>
  </div>
</div>

<div class="relay-problem">
  <div class="relay-problem-copy">
    <h2>Will this model work on my hardware?</h2>
    <p>
      You shouldn't need to understand MoE expert offloading, KV cache quantization,
      or VRAM headroom. You just want to know if a model runs well on your GPU and
      at what context size.
    </p>
    <p>
      <strong>Relay reads your actual GGUF files, measures your GPU, and computes
      the optimal flags for YOUR hardware.</strong> It tells you which models fit,
      at what context size, before you start anything. No guesswork.
    </p>
  </div>
</div>

<div class="relay-problem">
  <div class="relay-problem-copy">
    <h2>Getting local models working takes hours.</h2>
    <p>
      Find the GGUF. Download it. Figure out flags. Set up llama.cpp. Write a start
      script. Configure ports. Choose KV cache quantization. Test. Fix. Repeat.
    </p>
    <p>
      <strong>Relay's setup wizard does it all in one command.</strong> It finds your
      GGUF files, sizes each one, generates start scripts with every flag dialed in,
      and writes your config. Re-run <code>--auto</code> anytime you add new models.
    </p>
  </div>
</div>

<p class="relay-section-label">Capabilities</p>

<h2 class="relay-section-title">Everything your agent expects, from any backend</h2>

<div class="relay-norm-grid">

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">OpenAI + Anthropic APIs</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Streaming SSE normalization</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Tool call compatibility</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Error shape normalization</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Auto model start / stop / switch</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Session-aware context isolation</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Cloud API proxy mode</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Hardware-aware auto-setup</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">HTML status dashboard</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Health, metrics, observability</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Docker + one-liner install</span>
</div>

</div>

<div class="relay-callout">
  <div class="relay-callout-label">Two ways to run</div>
  <p><strong>Gateway mode</strong> manages local llama.cpp models — auto-detects your GPU, sizes every GGUF, generates start scripts, and handles the full lifecycle. <strong>Cloud mode</strong> proxies OpenAI, Anthropic, DeepSeek, or Groq through a single endpoint. Same API surface either way. Your agent doesn't know or care where the model lives.</p>
</div>

<p class="relay-section-label">Quickstart</p>

<TerminalBlock>

```bash
# One command. That's it.
curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/scripts/install.sh | bash

# After setup, start Relay
docker compose up -d

# Point your agent at  http://127.0.0.1:1234/v1
```

</TerminalBlock>

<div class="relay-note">
  <strong>Already have an agent runtime?</strong> Relay works underneath any OpenAI or Anthropic-compatible client — opencode, Cursor, Claude Code, Continue, Aider, and more. Point them at <code>http://127.0.0.1:1234/v1</code>.
</div>

</div>

<hr class="relay-divider" />
