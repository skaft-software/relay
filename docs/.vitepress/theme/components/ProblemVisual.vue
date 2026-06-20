<template>
  <section class="problem-visual" aria-labelledby="problem-title">
    <div class="problem-stage">
      <canvas ref="canvasEl" class="problem-canvas" aria-hidden="true"></canvas>

      <div class="problem-copy">
        <p class="relay-section-label">The Problem</p>
        <h2 id="problem-title" class="problem-title">
          <span>Almost compatible</span>
          <strong>is where agents break.</strong>
        </h2>
        <p class="problem-lede">
          Local model servers and cloud APIs speak familiar protocols until the details matter:
          stream events, tool calls, fields, errors, and capability metadata.
          Relay makes the boundary actually compatible — same API surface whether your model runs on your GPU or someone else's.
        </p>
      </div>
    </div>

    <div class="problem-ticker" aria-hidden="true">
      <span>headers drift</span>
      <span>tool calls fork</span>
      <span>SSE chunks wobble</span>
      <span>model IDs lie</span>
      <span>errors change shape</span>
      <span>agents need one contract</span>
    </div>

    <div class="relay-pain-grid">
      <div class="relay-pain-card"><p>OpenAI-compatible endpoints differ subtly across backends — header conventions, field presence, and error shapes don't match what SDKs expect.</p></div>
      <div class="relay-pain-card"><p>Anthropic clients expect specific message shapes, streaming event orders, and tool-call structures different from what upstream servers return.</p></div>
      <div class="relay-pain-card"><p>Tool calls, model IDs, SSE chunk framing, and capability metadata often cause agent loops to break or silently degrade across providers.</p></div>
      <div class="relay-pain-card relay-pain-card-accent"><p>Relay normalizes the boundary — local GPU or cloud API, same contract. No special-casing per backend, no agent-side workarounds.</p></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  layoutMeasuredLines,
  prepareMeasuredTextWithSegments,
} from '../measured-text'

const canvasEl = ref<HTMLCanvasElement | null>(null)
let frame = 0
let resizeObserver: ResizeObserver | null = null

const phrases = [
  'OpenAI-compatible',
  'Anthropic-shaped',
  'delta != event',
  'tool_choice drift',
  'missing usage',
  'error envelope?',
  'model aliases',
  'SSE retry',
  'schema mismatch',
  'canonical contract',
]

function paint(time = 0): void {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr
    canvas.height = height * dpr
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  ctx.lineWidth = 1

  const prepared = prepareMeasuredTextWithSegments(
    'one gateway · any model · local or cloud',
    '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    { whiteSpace: 'pre-wrap' },
  )
  const measured = layoutMeasuredLines(prepared, Math.max(220, width * 0.46), 18)
  const phraseOffset = measured.lines.length > 1 ? 18 : 0

  for (let i = 0; i < phrases.length; i++) {
    const lane = i % 5
    const xBase = (i * 137 + time * (0.012 + lane * 0.002)) % (width + 180)
    const x = xBase - 140
    const y = 28 + lane * ((height - 56) / 4)
    const alpha = 0.14 + Math.sin(time * 0.002 + i) * 0.06

    ctx.fillStyle = `rgba(117, 167, 223, ${alpha})`
    ctx.fillText(phrases[i], x, y + phraseOffset)

    ctx.strokeStyle = `rgba(86, 141, 208, ${alpha * 0.75})`
    ctx.beginPath()
    ctx.moveTo(x - 28, y + 6)
    ctx.lineTo(x - 8, y + 6)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(86, 141, 208, 0.12)'
  for (let y = 18; y < height; y += 26) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function animate(time = 0): void {
  paint(time)
  frame = window.requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvasEl.value) {
    resizeObserver = new ResizeObserver(() => paint())
    resizeObserver.observe(canvasEl.value)
  }

  paint()
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    frame = window.requestAnimationFrame(animate)
  }
})

onUnmounted(() => {
  if (frame) window.cancelAnimationFrame(frame)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.problem-visual {
  margin: 32px 0 36px;
}

.problem-stage {
  --vp-c-text-1: #f4f7fb;
  --vp-c-text-2: #c3cad6;
  --vp-c-text-3: #8691a3;
  --vp-c-brand-1: #75a7df;
  --vp-c-brand-2: #8fb8e9;

  position: relative;
  overflow: hidden;
  min-height: 300px;
  display: grid;
  align-items: center;
  border-top: 1px solid rgba(86, 141, 208, 0.22);
  border-bottom: 1px solid rgba(86, 141, 208, 0.22);
  background:
    linear-gradient(90deg, rgba(86, 141, 208, 0.12), transparent 22%, transparent 78%, rgba(188, 146, 103, 0.10)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0));
}

.problem-stage::before {
  position: absolute;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(10, 10, 12, 0.96), rgba(10, 10, 12, 0.62) 35%, rgba(10, 10, 12, 0.80)),
    repeating-linear-gradient(180deg, transparent 0 13px, rgba(255, 255, 255, 0.025) 14px);
}

.problem-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.problem-copy {
  position: relative;
  z-index: 1;
  max-width: 680px;
  padding: 44px 0;
}

.problem-copy .relay-section-label {
  margin-top: 0;
}

.problem-title {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 46px;
  line-height: 1.02;
  letter-spacing: 0;
}

.problem-title span,
.problem-title strong {
  display: block;
}

.problem-title span {
  color: var(--vp-c-text-2);
  font-weight: 650;
}

.problem-title strong {
  color: var(--vp-c-brand-1);
  font-weight: 800;
}

.problem-lede {
  max-width: 560px;
  margin-top: 20px;
  color: var(--vp-c-text-2);
  font-size: 17px;
  line-height: 1.65;
}

.problem-ticker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 14px 0;
}

.problem-ticker span {
  border: 1px solid rgba(86, 141, 208, 0.18);
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--vp-c-text-3);
  background: rgba(86, 141, 208, 0.045);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1;
}

.relay-pain-card-accent {
  border-color: rgba(86, 141, 208, 0.36);
  background:
    linear-gradient(180deg, rgba(86, 141, 208, 0.10), rgba(86, 141, 208, 0.035)),
    var(--relay-surface);
}

@media (max-width: 768px) {
  .problem-stage {
    min-height: 250px;
  }

  .problem-copy {
    padding: 32px 0;
  }

  .problem-title {
    font-size: 34px;
  }

  .problem-lede {
    font-size: 15px;
  }
}
</style>
