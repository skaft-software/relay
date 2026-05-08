---
layout: home

hero:
  text: Stop patching every agent for local models.
  tagline: Relay is a lightweight compatibility gateway for llama.cpp and local inference servers. It exposes OpenAI- and Anthropic-compatible APIs, normalizes streaming, tools, models, and errors, and lets real agents talk to your local models without custom glue code.
  actions:
    - theme: brand
      text: Quickstart
      link: /quickstart
    - theme: alt
      text: GitHub
      link: https://github.com/achuthanmukundan00/relay
---

<div class="relay-section">

<p class="relay-section-label">The Problem</p>

<h2 class="relay-section-title">Local servers are almost compatible. Agents need <em>actually</em> compatible.</h2>

<div class="relay-pain-grid">

<div class="relay-pain-card"><p>OpenAI-compatible endpoints differ subtly across local servers — header conventions, field presence, and error shapes don't match what SDKs expect.</p></div>

<div class="relay-pain-card"><p>Anthropic clients expect different message shapes, streaming event orders, and tool-call structures than what upstream servers return.</p></div>

<div class="relay-pain-card"><p>Tool calls, model IDs, SSE chunk framing, and capability metadata often cause agent loops to break or silently degrade.</p></div>

<div class="relay-pain-card"><p>Relay normalizes the boundary instead of forcing every client, SDK, and agent to special-case each local inference server.</p></div>

</div>

<div class="relay-pipeline-section">
  <p class="relay-section-label">Translation Pipeline</p>
  <CompatibilityVisual />
</div>

<p class="relay-section-label">What Relay Normalizes</p>

<h2 class="relay-section-title">A single compatibility surface across protocols</h2>

<div class="relay-norm-grid">

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">OpenAI chat completions</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Anthropic messages</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Streaming / SSE</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Tool call shapes</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Model aliases &amp; capabilities</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Upstream errors &amp; status</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Health / readiness</span>
</div>

<div class="relay-norm-card">
  <span class="relay-norm-card-icon">▸</span>
  <span class="relay-norm-card-label">Deployment config</span>
</div>

</div>

<div class="relay-callout">
  <div class="relay-callout-label">Why not direct llama.cpp?</div>
  <p><strong>llama.cpp is excellent at inference.</strong> Relay is not trying to replace it. Relay handles the compatibility layer around it: API shapes, streaming behavior, tool semantics, model metadata, and observability. Think of it as the protocol adapter that sits between <strong>raw inference</strong> and <strong>real-world agent tooling</strong>.</p>
</div>

<p class="relay-section-label">Quickstart</p>

<div class="relay-terminal">
  <div class="relay-terminal-bar">
    <span class="relay-terminal-dot"></span>
    <span class="relay-terminal-dot"></span>
    <span class="relay-terminal-dot"></span>
    <span class="relay-terminal-label">terminal</span>
  </div>

```bash
# 1. Start your local model server
llama-server --model ./model.gguf --host 127.0.0.1 --port 8080

# 2. Clone and start Relay
git clone https://github.com/achuthanmukundan00/relay.git
cd relay && npm install && cp .env.example .env && npm run dev

# 3. Verify
curl http://127.0.0.1:1234/v1/models
```

</div>

<div class="relay-note">
  <strong>Using Synax?</strong> Relay can act as the local model gateway underneath it. Synax is the agent UX and runtime; Relay is the compatibility boundary that makes local inference actually work with it.
</div>

</div>

<hr class="relay-divider" />
