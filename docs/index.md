---
layout: home

hero:
  text: Local Model Gateway
  tagline: A lightweight, agnostic API layer for local LLM servers. Run OpenAI- and Anthropic-compatible agents, tools, and coding assistants against your own models.
  actions:
    - theme: brand
      text: Get Started
      link: /quickstart
    - theme: alt
      text: View on GitHub
      link: https://github.com/achuthanmukundan00/relay
features:
  - title: Protocol Bridging
    details: Translates between OpenAI and Anthropic API shapes and local upstream servers like llama.cpp, keeping agent tools compatible.
  - title: Streaming Support
    details: Full SSE streaming compatibility with normalization and repair. Works with chat, completions, and responses endpoints.
  - title: Lightweight Ops
    details: Built-in health checks, capabilities introspection, request stats, and configurable observability — no external dependencies.
---

<CompatibilityVisual />

## Fast Path

```sh
git clone https://github.com/achuthanmukundan00/relay.git
cd relay
npm install
cp .env.example .env
npm run dev
```

Relay starts on `http://127.0.0.1:1234`. Verify with:

```sh
curl http://127.0.0.1:1234/health
```

## What Relay Does

- Presents OpenAI-compatible `/v1/chat/completions`, `/v1/completions`, `/v1/responses`, `/v1/embeddings`, `/v1/models`
- Presents Anthropic-compatible `/v1/messages` and `/v1/messages/count_tokens`
- Normalizes streaming responses across protocol variants
- Canonicalizes request/response shapes for broad client compatibility
- Provides lightweight ops endpoints: `/health`, `/relay/capabilities`, `/relay/stats`

## What Relay Is Not

Relay is not a model server, a hosted service, a model router, or an orchestration platform.

It is a sharp local gateway that makes your local models speak OpenAI and Anthropic.
