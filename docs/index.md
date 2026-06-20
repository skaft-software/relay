---
layout: home

hero:
  text: One gateway. Any model. Local or cloud.
  tagline: Relay is a protocol adapter that sits between your coding agent and your models — local llama.cpp servers or cloud APIs (OpenAI, Anthropic, DeepSeek, Groq). One endpoint, one API key, no glue code.
---

<div class="relay-section">

<ProblemVisual />

<div class="relay-pipeline-section">
  <p class="relay-section-label">Translation Pipeline</p>
  <CompatibilityVisual />
</div>

<p class="relay-section-label">What Relay Normalizes</p>

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
  <div class="relay-callout-label">Why Relay instead of wiring things up yourself?</div>
  <p><strong>LLM backends are great at inference. Relay handles everything around it.</strong> API contract compliance, streaming event ordering, tool call shape normalization, error codes, model metadata, auto lifecycle, session isolation, rate limiting, and observability. One endpoint for any model — local or cloud — that your agent can actually talk to.</p>
</div>

<p class="relay-section-label">Quickstart</p>

<TerminalBlock>

```bash
# Install and run the setup wizard (auto-detects your hardware)
curl -fsSL https://raw.githubusercontent.com/achuthanmukundan00/relay/main/scripts/install.sh | bash

# After setup, start Relay
npm start          # bare metal
# or
docker compose up -d   # Docker (recommended for Linux GPU)

# Verify it's working
curl http://127.0.0.1:1234/v1/models
open http://127.0.0.1:1234          # status dashboard
```

</TerminalBlock>

<div class="relay-note">
  <strong>Already have an agent runtime?</strong> Relay works underneath any OpenAI or Anthropic-compatible client — opencode, Cursor, Claude Code, Continue, Aider, and more. Point them at <code>http://127.0.0.1:1234/v1</code>.
</div>

</div>

<hr class="relay-divider" />
