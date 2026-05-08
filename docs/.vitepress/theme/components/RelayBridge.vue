<template>
  <div
    ref="containerEl"
    class="relay-bridge"
    :class="{ 'relay-bridge--reduced': reducedMotion }"
    role="img"
    aria-label="Relay protocol bridge diagram: clients connect through Relay to local inference servers"
  >
    <canvas ref="canvasEl" class="relay-bridge__canvas" />

    <!-- CSS overlay labels -->
    <div class="relay-bridge__labels" aria-hidden="true">
      <span class="relay-bridge__label relay-bridge__label--tl">/v1/chat/completions</span>
      <span class="relay-bridge__label relay-bridge__label--tr">/v1/messages</span>
      <span class="relay-bridge__label relay-bridge__label--ml">SSE</span>
      <span class="relay-bridge__label relay-bridge__label--mr">tool_calls</span>
      <span class="relay-bridge__label relay-bridge__label--bl">model aliases</span>
      <span class="relay-bridge__label relay-bridge__label--br">health</span>
    </div>

    <!-- Relay state indicator -->
    <div class="relay-bridge__state" aria-hidden="true">
      <span class="relay-bridge__state-dot" :class="`relay-bridge__state-dot--${relayState}`"></span>
      <span class="relay-bridge__state-label">{{ relayStateLabel }}</span>
    </div>

    <!-- Fallback: shown when WebGL unavailable -->
    <div v-if="fallback" class="relay-bridge__fallback">
      <svg width="420" height="248" viewBox="0 0 420 248" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="248" fill="#0a0a0c" rx="8" />
        <rect x="0.5" y="0.5" width="419" height="247" rx="7.5" stroke="rgba(86,141,208,0.10)" stroke-width="1" />
        <!-- Clients -->
        <rect x="44" y="10" width="332" height="34" rx="4" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" />
        <text x="210" y="22" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10">OpenAI SDK</text>
        <text x="210" y="36" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10">Anthropic SDK · Coding Agents</text>
        <!-- Relay -->
        <rect x="64" y="72" width="292" height="52" rx="5" fill="rgba(86,141,208,0.16)" stroke="#568dd0" stroke-width="1" />
        <text x="210" y="96" text-anchor="middle" fill="#75a7df" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="13" font-weight="700">Relay</text>
        <text x="210" y="114" text-anchor="middle" fill="#568dd0" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="9">normalize · stream · tools · errors</text>
        <!-- Upstream -->
        <rect x="44" y="152" width="332" height="34" rx="4" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5" />
        <text x="210" y="165" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10">llama.cpp</text>
        <text x="210" y="179" text-anchor="middle" fill="#71717a" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="10">vLLM · local inference server</text>
        <!-- Model -->
        <rect x="84" y="212" width="252" height="26" rx="3" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.035)" stroke-width="0.5" />
        <text x="210" y="229" text-anchor="middle" fill="#52525b" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="9.5">GGUF / local model</text>
        <!-- Arrows -->
        <line x1="210" y1="48" x2="210" y2="69" stroke="rgba(86,141,208,0.28)" stroke-width="1" />
        <line x1="210" y1="128" x2="210" y2="149" stroke="rgba(86,141,208,0.28)" stroke-width="1" />
        <line x1="210" y1="190" x2="210" y2="209" stroke="rgba(86,141,208,0.18)" stroke-width="1" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Mesh,
  MeshBasicMaterial,
  LineBasicMaterial,
  LineSegments,
  CircleGeometry,
  PlaneGeometry,
  RingGeometry,
  EdgesGeometry,
  InstancedMesh,
  SphereGeometry,
  Group,
  Object3D,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
  MathUtils,
} from 'three'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    width?: number
    height?: number
  }>(),
  {
    width: 800,
    height: 500,
  },
)

// ---------------------------------------------------------------------------
// Refs & state
// ---------------------------------------------------------------------------
const containerEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)
const reducedMotion = ref(false)
const relayState = ref<'idle' | 'receiving' | 'normalizing' | 'forwarding' | 'responding'>('idle')
const relayStateLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: 'idle',
    receiving: 'receiving request',
    normalizing: 'normalizing stream',
    forwarding: 'forwarding upstream',
    responding: 'returning response',
  }
  return labels[relayState.value] || 'idle'
})

// ---------------------------------------------------------------------------
// Three.js objects
// ---------------------------------------------------------------------------
let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let frameId = 0
let resizeObserver: ResizeObserver | null = null

// Packets
const MAX_PACKETS = 40
const packetPaths: Vector3[][] = []
const packetProgress: number[] = []
const packetSpeeds: number[] = []
const packetDirections: number[] = [] // 0=down, 1=up

// Glow ring
let glowRing: Mesh | null = null
let glowStart = 0

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RELAY_BLUE = new Color('#568dd0')
const RELAY_BLUE_BRIGHT = new Color('#75a7df')
const RELAY_BLUE_DIM = new Color('#467ec2')
const RELAY_CYAN = new Color('#4ec9b0')
const RELAY_GREEN = new Color('#6a9955')
const BG_COLOR = new Color('#0a0a0c')
const LAYER_BG = new Color('#111115')
const GRID_COLOR = new Color('#568dd0')

// Vertical positions (world units)
const Y_CLIENT = 3.5
const Y_RELAY = 1.2
const Y_UPSTREAM = -1.2
const Y_MODEL = -3.5

// Horizontal positions
const X_LEFT = -3.5
const X_RIGHT = 3.5
const X_CENTER = 0

// Layer widths
const LAYER_WIDTH = 7.2
const LAYER_HEIGHT = 0.45
const MODEL_WIDTH = 5.2
const MODEL_HEIGHT = 0.32

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function createGrid(
  width: number,
  height: number,
  step: number,
): { geometry: BufferGeometry; material: MeshBasicMaterial | LineBasicMaterial } {
  const hw = width / 2
  const hh = height / 2
  const points: number[] = []

  for (let x = -hw; x <= hw; x += step) {
    points.push(x, -hh, 0, x, hh, 0)
  }
  for (let y = -hh; y <= hh; y += step) {
    points.push(-hw, y, 0, hw, y, 0)
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(points, 3))
  const mat = new LineBasicMaterial({
    color: RELAY_BLUE,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
  })
  return { geometry: geo, material: mat }
}

function createLayerBar(
  y: number,
  width: number = LAYER_WIDTH,
  height: number = LAYER_HEIGHT,
  accent: boolean = false,
): Group {
  const group = new Group()

  // Background panel
  const panelGeo = new PlaneGeometry(width, height)
  const panelMat = new MeshBasicMaterial({
    color: accent ? new Color('#1a1d28') : new Color('#111115'),
    transparent: true,
    opacity: accent ? 0.85 : 0.7,
    depthWrite: false,
  })
  const panel = new Mesh(panelGeo, panelMat)
  panel.position.y = y
  panel.position.z = -0.05
  group.add(panel)

  // Border edges
  const edgeGeo = new EdgesGeometry(panelGeo)
  const edgeMat = new LineBasicMaterial({
    color: accent ? RELAY_BLUE : new Color('#1e1e24'),
    transparent: true,
    opacity: accent ? 0.6 : 0.3,
    depthWrite: false,
  })
  const edges = new LineSegments(edgeGeo, edgeMat)
  edges.position.y = y
  edges.position.z = -0.04
  group.add(edges)

  return group
}

function createRelayNode(y: number): Group {
  const group = new Group()

  // Hexagon-shaped center
  const hexRadius = 0.55
  const hexGeo = new CircleGeometry(hexRadius, 6)
  const hexMat = new MeshBasicMaterial({
    color: RELAY_BLUE,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  })
  const hex = new Mesh(hexGeo, hexMat)
  hex.position.set(0, y, 0.1)
  group.add(hex)

  // Inner circle
  const innerGeo = new CircleGeometry(hexRadius * 0.55, 32)
  const innerMat = new MeshBasicMaterial({
    color: RELAY_BLUE_BRIGHT,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  })
  const inner = new Mesh(innerGeo, innerMat)
  inner.position.set(0, y, 0.12)
  group.add(inner)

  // Glow ring (outer pulse)
  const ringGeo = new RingGeometry(hexRadius * 0.65, hexRadius * 0.85, 64)
  const ringMat = new MeshBasicMaterial({
    color: RELAY_BLUE_BRIGHT,
    transparent: true,
    opacity: 0.4,
    side: 2, // DoubleSide
    depthWrite: false,
  })
  glowRing = new Mesh(ringGeo, ringMat)
  glowRing.position.set(0, y, 0.11)
  glowRing.scale.set(1, 1, 1)
  group.add(glowRing)
  glowStart = performance.now()

  // Outer ring accent
  const outerGeo = new RingGeometry(hexRadius * 0.88, hexRadius * 0.92, 64)
  const outerMat = new MeshBasicMaterial({
    color: RELAY_BLUE_DIM,
    transparent: true,
    opacity: 0.6,
    side: 2,
    depthWrite: false,
  })
  const outer = new Mesh(outerGeo, outerMat)
  outer.position.set(0, y, 0.09)
  group.add(outer)

  return group
}

function createConnectionLines(): LineSegments {
  const points: number[] = []

  // Define lane groups: each lane is a pair of lines (incoming + returning)
  const lanes = [
    { x: X_CENTER - 0.15, top: Y_CLIENT, bot: Y_RELAY },
    { x: X_CENTER + 0.15, top: Y_CLIENT, bot: Y_RELAY },
    { x: X_CENTER - 0.15, top: Y_RELAY, bot: Y_UPSTREAM },
    { x: X_CENTER + 0.15, top: Y_RELAY, bot: Y_UPSTREAM },
    { x: X_CENTER - 0.12, top: Y_UPSTREAM, bot: Y_MODEL },
    { x: X_CENTER + 0.12, top: Y_UPSTREAM, bot: Y_MODEL },
  ]

  for (const lane of lanes) {
    // Subtract layer half-heights so lines don't overlap into the bars
    const topY = lane.top - LAYER_HEIGHT / 2
    const botY = lane.bot + LAYER_HEIGHT / 2
    points.push(lane.x, topY, 0.05, lane.x, botY, 0.05)
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(points, 3))
  const mat = new LineBasicMaterial({
    color: RELAY_BLUE,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  })
  return new LineSegments(geo, mat)
}

function createPacketPaths(): Vector3[][] {
  const paths: Vector3[][] = []
  const halfLayer = LAYER_HEIGHT / 2
  const halfModel = MODEL_HEIGHT / 2

  // Lane definitions: client->relay, relay->upstream, upstream->model
  // and return: model->upstream, upstream->relay, relay->client
  const laneDefs = [
    // Downward paths
    { x: X_CENTER - 0.18, from: Y_CLIENT - halfLayer, to: Y_RELAY + halfLayer },
    { x: X_CENTER + 0.18, from: Y_CLIENT - halfLayer, to: Y_RELAY + halfLayer },
    { x: X_CENTER - 0.18, from: Y_RELAY - halfLayer, to: Y_UPSTREAM + halfLayer },
    { x: X_CENTER + 0.18, from: Y_RELAY - halfLayer, to: Y_UPSTREAM + halfLayer },
    { x: X_CENTER - 0.12, from: Y_UPSTREAM - halfLayer, to: Y_MODEL + halfModel },
    { x: X_CENTER + 0.12, from: Y_UPSTREAM - halfLayer, to: Y_MODEL + halfModel },
    // Upward paths (response)
    { x: X_CENTER - 0.18, from: Y_RELAY + halfLayer, to: Y_CLIENT - halfLayer },
    { x: X_CENTER + 0.18, from: Y_RELAY + halfLayer, to: Y_CLIENT - halfLayer },
    { x: X_CENTER - 0.18, from: Y_UPSTREAM + halfLayer, to: Y_RELAY - halfLayer },
    { x: X_CENTER + 0.18, from: Y_UPSTREAM + halfLayer, to: Y_RELAY - halfLayer },
  ]

  for (const def of laneDefs) {
    const from = new Vector3(def.x, def.from, 0.15)
    const to = new Vector3(def.x, def.to, 0.15)
    paths.push([from, to])
  }

  return paths
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
function initScene(): void {
  const canvas = canvasEl.value
  const container = containerEl.value
  if (!canvas || !container) return

  // Detect WebGL
  if (!detectWebGL()) {
    fallback.value = true
    return
  }

  const rect = container.getBoundingClientRect()
  const w = rect.width || props.width
  const h = rect.height || props.height

  // Renderer
  renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h, false)
  renderer.setClearColor(0x000000, 0)

  // Scene
  scene = new Scene()

  // Camera
  camera = new PerspectiveCamera(44, w / Math.max(h, 1), 0.1, 30)
  camera.position.set(0, 0, 10)
  camera.lookAt(0, 0, 0)

  // Grid background
  const grid = createGrid(14, 10, 0.6)
  const gridLines = new LineSegments(grid.geometry, grid.material)
  gridLines.position.z = -0.5
  scene.add(gridLines)

  // Subtle radial background glow (a large dark plane behind everything)
  const bgGeo = new PlaneGeometry(20, 20)
  const bgMat = new MeshBasicMaterial({
    color: BG_COLOR,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  })
  const bg = new Mesh(bgGeo, bgMat)
  bg.position.z = -1
  scene.add(bg)

  // Layer bars
  const clientLayer = createLayerBar(Y_CLIENT, LAYER_WIDTH, LAYER_HEIGHT)
  scene.add(clientLayer)

  const relayLayer = createLayerBar(Y_RELAY, LAYER_WIDTH, LAYER_HEIGHT + 0.12, true)
  scene.add(relayLayer)

  const upstreamLayer = createLayerBar(Y_UPSTREAM, LAYER_WIDTH, LAYER_HEIGHT)
  scene.add(upstreamLayer)

  const modelLayer = createLayerBar(Y_MODEL, MODEL_WIDTH, MODEL_HEIGHT)
  scene.add(modelLayer)

  // Relay central node
  const relayNode = createRelayNode(Y_RELAY)
  scene.add(relayNode)

  // Connection lines
  const connLines = createConnectionLines()
  scene.add(connLines)

  // Packet paths
  const paths = createPacketPaths()
  for (const p of paths) {
    packetPaths.push(p)
  }

  // Initialize packet state
  const numDownPaths = 6
  const totalPaths = packetPaths.length
  for (let i = 0; i < MAX_PACKETS; i++) {
    const pathIdx = i % totalPaths
    packetProgress.push(Math.random())
    packetSpeeds.push(0.08 + Math.random() * 0.25)
    packetDirections.push(pathIdx < numDownPaths ? 0 : 1)
  }

  // Packet meshes (instanced)
  if (MAX_PACKETS > 0) {
    const pktGeo = new SphereGeometry(0.04, 6, 6)
    const pktMat = new MeshBasicMaterial({
      color: RELAY_BLUE_BRIGHT,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
    const pktMesh = new InstancedMesh(pktGeo, pktMat, MAX_PACKETS)
    pktMesh.instanceMatrix.setUsage(2) // dynamic draw
    const dummy = new Object3D()
    for (let i = 0; i < MAX_PACKETS; i++) {
      dummy.position.set(0, -10, 0) // start off-screen
      dummy.updateMatrix()
      pktMesh.setMatrixAt(i, dummy.matrix)
    }
    pktMesh.instanceMatrix.needsUpdate = true
    scene.add(pktMesh)
  }

  // Start render loop
  frameId = requestAnimationFrame(animate)
}

function animate(time: number): void {
  if (!scene || !camera || !renderer) return

  const t = time * 0.001

  // Camera subtle drift
  if (!reducedMotion.value) {
    camera.position.x = Math.sin(t * 0.3) * 1.2
    camera.position.y = Math.cos(t * 0.25) * 0.6
    camera.lookAt(0, 0, 0)
  }

  // Glow ring pulse
  if (glowRing && !reducedMotion.value) {
    const elapsed = (time - glowStart) * 0.001
    const pulseCycle = elapsed % 6.5

    // Determine relay state based on cycle position
    if (pulseCycle < 1.0) {
      relayState.value = 'idle'
    } else if (pulseCycle < 2.2) {
      relayState.value = 'receiving'
    } else if (pulseCycle < 3.4) {
      relayState.value = 'normalizing'
    } else if (pulseCycle < 4.6) {
      relayState.value = 'forwarding'
    } else {
      relayState.value = 'responding'
    }

    // Pulse scale based on state
    const cyclePhase = (pulseCycle % 1.5) / 1.5
    let baseScale = 1.0
    let glowAlpha = 0.35

    switch (relayState.value) {
      case 'receiving':
        baseScale = 1.0 + Math.sin(cyclePhase * Math.PI) * 0.35
        glowAlpha = 0.35 + Math.sin(cyclePhase * Math.PI) * 0.4
        break
      case 'normalizing':
        baseScale = 1.0 + Math.sin(cyclePhase * Math.PI * 2) * 0.2
        glowAlpha = 0.45 + Math.sin(cyclePhase * Math.PI * 3) * 0.25
        break
      case 'forwarding':
        baseScale = 1.0 + Math.sin(cyclePhase * Math.PI) * 0.25
        glowAlpha = 0.35 + Math.sin(cyclePhase * Math.PI) * 0.35
        break
      case 'responding':
        baseScale = 1.0 + Math.sin(cyclePhase * Math.PI) * 0.2
        glowAlpha = 0.3 + Math.sin(cyclePhase * Math.PI) * 0.3
        break
      default:
        baseScale = 1.0 + Math.sin(elapsed * 1.2) * 0.08
        glowAlpha = 0.3 + Math.sin(elapsed * 1.2) * 0.08
    }

    glowRing.scale.set(baseScale, baseScale, 1)
    ;(glowRing.material as MeshBasicMaterial).opacity = MathUtils.clamp(glowAlpha, 0.18, 0.8)

    // Update glow ring position for parallax
    glowRing.position.z = 0.11 + Math.sin(elapsed * 1.5) * 0.015
  }

  // Animate packets
  if (!reducedMotion.value) {
    const sceneChildren = scene.children
    let pktMesh: InstancedMesh | null = null
    for (let i = sceneChildren.length - 1; i >= 0; i--) {
      const child = sceneChildren[i]
      if (child instanceof InstancedMesh) {
        pktMesh = child
        break
      }
    }

    if (pktMesh) {
      const dummy = new Object3D()
      const totalPaths = packetPaths.length

      for (let i = 0; i < MAX_PACKETS; i++) {
        const pathIdx = i % totalPaths
        const path = packetPaths[pathIdx]
        if (!path || path.length < 2) continue

        // Advance progress
        packetProgress[i] += packetSpeeds[i] * 0.008
        if (packetProgress[i] > 1.0) {
          packetProgress[i] -= 1.0
          // Randomize speed slightly
          packetSpeeds[i] = 0.08 + Math.random() * 0.25
        }

        const p = packetProgress[i]
        const from = path[0]
        const to = path[1]

        dummy.position.lerpVectors(from, to, p)

        // Slight wobble perpendicular to travel
        const wobble = Math.sin(t * 4 + i * 1.7) * 0.04
        dummy.position.x += wobble

        // Color packets differently based on path direction
        if (pathIdx < 6) {
          // Downward: blue/cyan
          dummy.scale.set(1, 1, 1)
        } else {
          // Upward (response): slightly green
          dummy.scale.set(0.85, 0.85, 0.85)
        }

        dummy.updateMatrix()
        pktMesh.setMatrixAt(i, dummy.matrix)
      }
      pktMesh.instanceMatrix.needsUpdate = true
    }
  }

  // Render
  renderer.render(scene, camera)
  frameId = requestAnimationFrame(animate)
}

function handleResize(): void {
  const container = containerEl.value
  if (!container || !renderer || !camera) return

  const rect = container.getBoundingClientRect()
  const w = rect.width || props.width
  const h = rect.height || props.height

  if (w <= 0 || h <= 0) return

  renderer.setSize(w, h, false)
  camera.aspect = w / Math.max(h, 1)
  camera.updateProjectionMatrix()
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const motionHandler = (e: MediaQueryListEvent) => {
    reducedMotion.value = e.matches
  }
  motionQuery.addEventListener('change', motionHandler)

  // Delay init to ensure container has dimensions
  nextTick(() => {
    setTimeout(() => {
      initScene()
    }, 50)
  })

  if (containerEl.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(containerEl.value)
  }

  // Cleanup
  const savedMotionHandler = motionHandler
  onUnmounted(() => {
    if (frameId) cancelAnimationFrame(frameId)
    if (resizeObserver) resizeObserver.disconnect()
    motionQuery.removeEventListener('change', savedMotionHandler)

    if (renderer) {
      renderer.dispose()
      renderer = null
    }
    if (scene) {
      scene.traverse((obj) => {
        if (obj instanceof Mesh || obj instanceof LineSegments) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else if (obj.material) {
            obj.material.dispose()
          }
        }
      })
      scene.clear()
      scene = null
    }
    glowRing = null
    packetPaths.length = 0
    packetProgress.length = 0
    packetSpeeds.length = 0
    packetDirections.length = 0
  })
})
</script>

<style scoped>
.relay-bridge {
  position: relative;
  width: 100%;
  aspect-ratio: 800 / 420;
  max-height: 420px;
  min-height: 280px;
  overflow: hidden;
  border-radius: 10px;
  background: #0a0a0c;
  border: 1px solid rgba(86, 141, 208, 0.12);
}

.relay-bridge__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.relay-bridge__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.relay-bridge__fallback svg {
  max-width: 100%;
  height: auto;
}

/* ---- CSS overlay labels ---- */
.relay-bridge__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.relay-bridge__label {
  position: absolute;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: rgba(86, 141, 208, 0.38);
  white-space: nowrap;
  transition: color 1.2s ease;
}

.relay-bridge__label--tl { top: 6%; left: 6%; }
.relay-bridge__label--tr { top: 6%; right: 6%; }
.relay-bridge__label--ml { top: 36%; left: 4%; }
.relay-bridge__label--mr { top: 36%; right: 4%; }
.relay-bridge__label--bl { bottom: 26%; left: 6%; }
.relay-bridge__label--br { bottom: 26%; right: 6%; }

/* ---- State indicator ---- */
.relay-bridge__state {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(10, 10, 12, 0.82);
  border: 1px solid rgba(86, 141, 208, 0.14);
  border-radius: 999px;
  padding: 4px 12px 4px 8px;
  pointer-events: none;
}

.relay-bridge__state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #568dd0;
  transition: background-color 0.5s ease, box-shadow 0.5s ease;
}

.relay-bridge__state-dot--idle {
  background: #467ec2;
  box-shadow: 0 0 4px rgba(86, 141, 208, 0.3);
}

.relay-bridge__state-dot--receiving {
  background: #75a7df;
  box-shadow: 0 0 8px rgba(86, 141, 208, 0.6);
  animation: state-pulse 0.6s ease-in-out infinite;
}

.relay-bridge__state-dot--normalizing {
  background: #568dd0;
  box-shadow: 0 0 6px rgba(86, 141, 208, 0.4);
  animation: state-pulse 0.3s ease-in-out infinite;
}

.relay-bridge__state-dot--forwarding {
  background: #4ec9b0;
  box-shadow: 0 0 8px rgba(78, 201, 176, 0.5);
  animation: state-pulse 0.8s ease-in-out infinite;
}

.relay-bridge__state-dot--responding {
  background: #6a9955;
  box-shadow: 0 0 6px rgba(106, 153, 85, 0.45);
  animation: state-pulse 1s ease-in-out infinite;
}

.relay-bridge__state-label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: rgba(212, 212, 216, 0.7);
}

@keyframes state-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.4); }
}

/* Reduced motion */
.relay-bridge--reduced .relay-bridge__state-dot--receiving,
.relay-bridge--reduced .relay-bridge__state-dot--normalizing,
.relay-bridge--reduced .relay-bridge__state-dot--forwarding,
.relay-bridge--reduced .relay-bridge__state-dot--responding {
  animation: none;
}

/* Responsive */
@media (max-width: 768px) {
  .relay-bridge {
    aspect-ratio: 800 / 340;
    min-height: 220px;
    max-height: 340px;
  }

  .relay-bridge__label {
    font-size: 8px;
  }
}
</style>
