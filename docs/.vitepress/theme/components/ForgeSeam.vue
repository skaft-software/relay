<template>
  <div ref="rootEl" class="forge-seam" aria-hidden="true">
    <canvas ref="canvasEl" class="forge-seam__canvas"></canvas>
    <div v-if="fallback" class="forge-seam__fallback"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const rootEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)

let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null
let vao: WebGLVertexArrayObject | null = null
let raf = 0
let start = 0
let resizeObs: ResizeObserver | null = null
let intersectObs: IntersectionObserver | null = null
let visible = true
let reduced = false
let uRes: WebGLUniformLocation | null = null
let uTime: WebGLUniformLocation | null = null

const VERT = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`

// The Seam — cold brushed steel bisected by an incandescent forge seam.
const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_res;
uniform float u_time;

float hash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 cp = uv - 0.5;
  cp.x *= asp;
  float t = u_time;

  // ---- the membrane (Relay): a wavering vertical seam dividing two domains ----
  float warp = 0.05 * sin(cp.y * 2.6 + t * 0.22)
             + 0.09 * (fbm(vec2(cp.y * 1.5 + t * 0.08, 3.0)) - 0.5);
  float seamX = 0.14 + warp;
  float dx = cp.x - seamX;          // < 0 : human / process   ·   > 0 : machine intelligence
  float d = abs(dx);

  // ---- human / process domain: cold steel + ordered engineering grid ----
  float grain = fbm(vec2(cp.x * 2.6, cp.y * 120.0));
  float macro = fbm(cp * 1.7 + 11.0);
  vec3 humanCol = mix(vec3(0.018, 0.022, 0.029), vec3(0.066, 0.082, 0.108), grain * 0.5 + macro * 0.30);
  vec2 gg = cp * 11.0 + vec2(2.0, 5.0);
  vec2 gw = fwidth(gg);
  vec2 gd = abs(fract(gg) - 0.5) / gw;
  float gridLine = 1.0 - min(min(gd.x, gd.y), 1.0);
  humanCol += gridLine * vec3(0.085, 0.12, 0.17);

  // ---- machine intelligence domain: roiling Blackwall turbulence ----
  vec2 q = cp * 2.0 + vec2(1.0, 0.0);
  q += 0.7 * vec2(fbm(q + t * 0.14), fbm(q + vec2(5.2, 1.3) - t * 0.11));
  float churn = pow(clamp(fbm(q * 1.7 + t * 0.18), 0.0, 1.0), 1.4);
  vec3 aiCol = vec3(0.030, 0.007, 0.004);
  aiCol = mix(aiCol, vec3(0.40, 0.05, 0.02), churn);
  aiCol = mix(aiCol, vec3(1.0, 0.34, 0.09), churn * churn * 0.85);
  aiCol *= 0.65 + 0.7 * exp(-max(dx, 0.0) * 2.0);   // intelligence presses brighter at the membrane

  // ---- blend the two domains across the membrane ----
  float side = smoothstep(-0.04, 0.06, dx);
  vec3 col = mix(humanCol, aiCol, side);

  // ---- the seam: incandescent membrane where intelligence meets process ----
  float heatVar = 0.5 + 0.5 * fbm(vec2(cp.y * 1.8 - t * 0.1, 7.0));
  float flow = 0.85 + 0.15 * sin(cp.y * 8.0 - t * 1.4);
  float heat = exp(-d * 9.0 / heatVar) * flow;
  float core = exp(-d * 82.0);

  // heat-haze shimmer at the membrane
  float haze = exp(-d * 5.0);
  col += haze * (noise(cp * 32.0 + t * 0.8) * 0.05 - 0.025);

  // thermal ramp on the seam
  vec3 ember    = vec3(1.0, 0.32, 0.075);
  vec3 emberHot = vec3(1.0, 0.60, 0.24);
  vec3 whiteHot = vec3(1.0, 0.94, 0.85);
  col = mix(col, ember * 0.9, smoothstep(0.16, 0.58, heat));
  col = mix(col, emberHot,    smoothstep(0.52, 0.95, heat));
  col += whiteHot * core * 1.30;
  col += ember * exp(-d * 3.0) * 0.10 * heatVar;

  // vignette + film grain
  float vig = smoothstep(1.35, 0.2, length(cp * vec2(0.7, 1.5)));
  col *= mix(0.5, 1.0, vig);
  col += (hash(uv * u_res.xy + t * 57.0) - 0.5) * 0.04;

  fragColor = vec4(max(col, 0.0), 1.0);
}`

function compile(type: number, src: string): WebGLShader | null {
  if (!gl) return null
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[ForgeSeam] shader compile failed:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function resize(): void {
  const canvas = canvasEl.value
  const root = rootEl.value
  if (!gl || !canvas || !root) return
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  const w = Math.max(1, Math.floor(root.clientWidth * dpr))
  const h = Math.max(1, Math.floor(root.clientHeight * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  gl.viewport(0, 0, w, h)
}

function frame(now: number): void {
  if (!gl || !program) return
  if (!start) start = now
  resize()
  gl.useProgram(program)
  gl.uniform2f(uRes, gl.drawingBufferWidth, gl.drawingBufferHeight)
  gl.uniform1f(uTime, (now - start) * 0.001)
  gl.bindVertexArray(vao)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  if (visible && !reduced) raf = requestAnimationFrame(frame)
}

function init(): void {
  const canvas = canvasEl.value
  if (!canvas) return
  gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
  if (!gl) { fallback.value = true; return }

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) { fallback.value = true; return }

  program = gl.createProgram()
  if (!program) { fallback.value = true; return }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[ForgeSeam] link failed:', gl.getProgramInfoLog(program))
    fallback.value = true
    return
  }
  uRes = gl.getUniformLocation(program, 'u_res')
  uTime = gl.getUniformLocation(program, 'u_time')
  vao = gl.createVertexArray()

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  init()
  if (rootEl.value) {
    resizeObs = new ResizeObserver(() => { if (reduced || !visible) requestAnimationFrame(frame) })
    resizeObs.observe(rootEl.value)
    intersectObs = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
      if (visible && !reduced && !raf) raf = requestAnimationFrame(frame)
    }, { threshold: 0 })
    intersectObs.observe(rootEl.value)
  }
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  resizeObs?.disconnect()
  intersectObs?.disconnect()
  if (gl) {
    if (program) gl.deleteProgram(program)
    if (vao) gl.deleteVertexArray(vao)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  gl = null
})
</script>

<style scoped>
.forge-seam {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.forge-seam__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.forge-seam__fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 60% at 50% 50%, rgba(255, 106, 44, 0.18), transparent 55%),
    linear-gradient(180deg, #07080a, #050507);
}
</style>
