<template>
  <figure class="compat-visual" aria-label="Relay translation pipeline: OpenAI request through normalization to llama.cpp response">
    <!-- Hidden accessible description -->
    <span class="sr-only">
      Relay normalizes between client protocols and local model servers. Clients send
      OpenAI or Anthropic shaped requests. Relay normalizes them, routes to a local
      upstream like llama.cpp, and returns canonical responses.
    </span>

    <!-- Canvas rendering area for measured text blocks -->
    <div class="compat-canvas" ref="canvasWrapper">
      <canvas
        ref="canvasEl"
        :width="canvasWidth"
        :height="canvasHeight"
        class="compat-canvas-el"
        aria-hidden="true"
      ></canvas>
    </div>

    <!-- Semantic fallback for screen readers / SSR -->
    <figcaption class="compat-caption" v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  prepareMeasuredTextWithSegments,
  layoutMeasuredLines,
} from '../measured-text'

const props = withDefaults(
  defineProps<{
    caption?: string
  }>(),
  {
    caption: 'Relay normalizes OpenAI/Anthropic requests to local upstream servers like llama.cpp and returns canonical responses.',
  },
)

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const FONT_MONO = '11px "JetBrains Mono", ui-monospace, monospace'
const FONT_LABEL = 'bold 10px Inter, system-ui, sans-serif'
const CANVAS_PADDING = 32
const BLOCK_GAP = 10
const BLOCK_WIDTH = 170
const LINE_HEIGHT = 16
const LABEL_HEIGHT = 14

// ---------------------------------------------------------------------------
// Data blocks representing the translation pipeline
// ---------------------------------------------------------------------------

interface BlockDef {
  label: string
  lines: string[]
  accent: string // CSS rgb string like '86 141 208'
  dim?: boolean
}

const blocks: BlockDef[] = [
  {
    label: 'OpenAI Client',
    lines: [
      'POST /v1/chat/',
      '  completions',
      '{',
      '  "model":"gpt-4",',
      '  "messages":[...]',
      '}',
    ],
    accent: '118 156 184',
  },
  {
    label: 'Relay',
    lines: [
      'normalize()',
      '  headers → auth',
      '  body → canonical',
      '  streaming → SSE',
      'route to upstream',
    ],
    accent: '86 141 208',
  },
  {
    label: 'llama.cpp',
    lines: [
      'POST /completion',
      '{',
      '  "prompt": "...",',
      '  "n_predict": 512',
      '}',
      '  → token stream',
    ],
    accent: '91 126 187',
  },
  {
    label: 'Anthropic Client',
    lines: [
      'POST /v1/messages',
      '{',
      '  "model":"claude-3",',
      '  "messages":[...]',
      '}',
    ],
    accent: '188 146 103',
  },
]

// ---------------------------------------------------------------------------
// Canvas setup
// ---------------------------------------------------------------------------

const canvasEl = ref<HTMLCanvasElement | null>(null)
const canvasWrapper = ref<HTMLElement | null>(null)
const canvasWidth = ref(760)
const canvasHeight = ref(340)

const totalBlocks = blocks.length
const totalBlockWidth = totalBlocks * BLOCK_WIDTH + (totalBlocks - 1) * BLOCK_GAP
const computedCanvasWidth = CANVAS_PADDING * 2 + totalBlockWidth

// Update canvas width
function updateCanvasWidth(): void {
  if (canvasWrapper.value) {
    const wrapperWidth = canvasWrapper.value.clientWidth
    canvasWidth.value = Math.min(wrapperWidth, 760)
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function draw(): void {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const dpr = window.devicePixelRatio || 1

  // Scale canvas for HiDPI
  if (canvas.width !== w * dpr) {
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.scale(dpr, dpr)
  }

  // Clear
  ctx.clearRect(0, 0, w, h)

  // Compute block positions (center in canvas)
  const startX = Math.max(CANVAS_PADDING, (w - totalBlockWidth) / 2)
  const startY = 50

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const bx = startX + i * (BLOCK_WIDTH + BLOCK_GAP)
    const by = startY

    drawBlock(ctx, bx, by, block)
  }

  // Draw arrows between blocks
  drawArrows(ctx, startX, startY)
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  block: BlockDef,
): void {
  const rgb = block.accent
  const dim = block.dim ?? false

  // Block background
  const blockHeight = LABEL_HEIGHT + block.lines.length * LINE_HEIGHT + 16
  ctx.fillStyle = `rgba(8, 8, 12, 0.92)`
  ctx.strokeStyle = dim
    ? `rgba(${rgb} / 0.12)`
    : `rgba(${rgb} / 0.28)`
  ctx.lineWidth = 1
  roundRect(ctx, bx, by, BLOCK_WIDTH, blockHeight, 6)
  ctx.fill()
  ctx.stroke()

  // Label
  ctx.fillStyle = dim ? `rgba(${rgb} / 0.3)` : `rgba(${rgb} / 0.85)`
  ctx.font = FONT_LABEL
  ctx.fillText(block.label, bx + 8, by + LABEL_HEIGHT)

  // Lines
  ctx.fillStyle = dim ? 'rgba(212, 212, 216, 0.25)' : 'rgba(212, 212, 216, 0.8)'
  ctx.font = FONT_MONO

  for (let j = 0; j < block.lines.length; j++) {
    const lineText = block.lines[j]
    // Use Pretext to measure this line for stable rendering
    const prepared = prepareMeasuredTextWithSegments(lineText, FONT_MONO, {
      whiteSpace: 'pre-wrap',
    })
    let displayText = lineText
    if (prepared) {
      const layoutResult = layoutMeasuredLines(prepared, BLOCK_WIDTH - 16, LINE_HEIGHT)
      if (layoutResult.lines.length > 0) {
        displayText = layoutResult.lines[0].text
      }
    }
    const ly = by + LABEL_HEIGHT + 10 + j * LINE_HEIGHT + LINE_HEIGHT * 0.7
    ctx.fillText(displayText, bx + 8, ly)
  }
}

function drawArrows(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
): void {
  for (let i = 0; i < blocks.length - 1; i++) {
    const fromX = startX + i * (BLOCK_WIDTH + BLOCK_GAP) + BLOCK_WIDTH
    const toX = startX + (i + 1) * (BLOCK_WIDTH + BLOCK_GAP)
    const midY = startY + 80

    // Arrow line
    ctx.strokeStyle = 'rgba(86, 141, 208, 0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(fromX + 2, midY)
    ctx.lineTo(toX - 2, midY)
    ctx.stroke()

    // Arrowhead
    ctx.fillStyle = 'rgba(86, 141, 208, 0.28)'
    ctx.beginPath()
    ctx.moveTo(toX - 2, midY)
    ctx.lineTo(toX - 8, midY - 4)
    ctx.lineTo(toX - 8, midY + 4)
    ctx.closePath()
    ctx.fill()
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateCanvasWidth()
  canvasHeight.value = 240
  draw()

  if (canvasWrapper.value) {
    resizeObserver = new ResizeObserver(() => {
      updateCanvasWidth()
      draw()
    })
    resizeObserver.observe(canvasWrapper.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

watch(
  () => [props.caption],
  () => draw(),
)
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.compat-visual {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.compat-canvas {
  width: 100%;
  max-width: 760px;
  overflow: hidden;
}

.compat-canvas-el {
  display: block;
  width: 100%;
  height: auto;
}

.compat-caption {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-align: center;
  max-width: 600px;
}

@media (max-width: 768px) {
  .compat-canvas {
    max-width: 100%;
  }
}
</style>
