<template>
  <div class="gateway-diagram" :style="containerStyle">
    <svg
      :width="width"
      :height="height"
      viewBox="0 0 420 248"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Grid pattern -->
        <pattern id="gd-grid" width="18" height="18" patternUnits="userSpaceOnUse">
          <path
            d="M 18 0 L 0 0 0 18"
            fill="none"
            stroke="rgba(86,141,208,0.05)"
            stroke-width="0.5"
          />
        </pattern>

        <!-- Relay box gradient -->
        <linearGradient id="gd-relay-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(86,141,208,0.16)" />
          <stop offset="100%" stop-color="rgba(86,141,208,0.05)" />
        </linearGradient>

        <!-- Glow filter -->
        <filter id="gd-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Arrow marker -->
        <marker
          id="gd-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(86,141,208,0.35)" />
        </marker>
      </defs>

      <!-- Background -->
      <rect width="420" height="248" fill="#0a0a0c" rx="8" />
      <rect width="420" height="248" fill="url(#gd-grid)" rx="8" />

      <!-- Outer border -->
      <rect
        x="0.5" y="0.5" width="419" height="247" rx="7.5"
        stroke="rgba(86,141,208,0.10)"
        stroke-width="1"
      />

      <!-- Layer 1: Clients -->
      <rect
        x="44" y="10" width="332" height="34" rx="4"
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.05)"
        stroke-width="0.5"
      />
      <text
        x="210" y="22"
        text-anchor="middle"
        fill="#71717a"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="10"
        letter-spacing="0.5"
      >OpenAI SDK</text>
      <text
        x="210" y="36"
        text-anchor="middle"
        fill="#71717a"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="10"
        letter-spacing="0.5"
      >Anthropic SDK &nbsp;·&nbsp; Coding Agents</text>

      <!-- Arrow 1 -->
      <line
        x1="210" y1="48" x2="210" y2="69"
        stroke="rgba(86,141,208,0.28)"
        stroke-width="1"
        marker-end="url(#gd-arrow)"
      />

      <!-- Layer 2: Relay (highlighted) -->
      <rect
        x="64" y="72" width="292" height="52" rx="5"
        fill="url(#gd-relay-bg)"
        stroke="#568dd0"
        stroke-width="1"
        filter="url(#gd-glow)"
      />
      <!-- Relay icon: hexagon + R -->
      <polygon
        points="210,86 217,90 217,99 210,103 203,99 203,90"
        fill="rgba(86,141,208,0.24)"
        stroke="#568dd0"
        stroke-width="0.8"
        transform="translate(-74,0)"
      />
      <text
        x="136" y="98"
        text-anchor="middle"
        fill="#75a7df"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="9"
        font-weight="700"
      >R</text>

      <text
        x="210" y="96"
        text-anchor="middle"
        fill="#75a7df"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="13"
        font-weight="700"
      >Relay</text>
      <text
        x="210" y="114"
        text-anchor="middle"
        fill="#568dd0"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="9"
      >normalize &nbsp;·&nbsp; stream &nbsp;·&nbsp; tools &nbsp;·&nbsp; errors</text>

      <!-- Arrow 2 -->
      <line
        x1="210" y1="128" x2="210" y2="149"
        stroke="rgba(86,141,208,0.28)"
        stroke-width="1"
        marker-end="url(#gd-arrow)"
      />

      <!-- Layer 3: Upstream -->
      <rect
        x="44" y="152" width="332" height="34" rx="4"
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.05)"
        stroke-width="0.5"
      />
      <text
        x="210" y="165"
        text-anchor="middle"
        fill="#71717a"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="10"
        letter-spacing="0.5"
      >llama.cpp</text>
      <text
        x="210" y="179"
        text-anchor="middle"
        fill="#71717a"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="10"
        letter-spacing="0.5"
      >vLLM &nbsp;·&nbsp; local inference server</text>

      <!-- Arrow 3 -->
      <line
        x1="210" y1="190" x2="210" y2="209"
        stroke="rgba(86,141,208,0.18)"
        stroke-width="1"
        marker-end="url(#gd-arrow)"
      />

      <!-- Layer 4: Model -->
      <rect
        x="84" y="212" width="252" height="26" rx="3"
        fill="rgba(255,255,255,0.015)"
        stroke="rgba(255,255,255,0.035)"
        stroke-width="0.5"
      />
      <text
        x="210" y="229"
        text-anchor="middle"
        fill="#52525b"
        font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"
        font-size="9.5"
        letter-spacing="0.5"
      >GGUF &nbsp;/&nbsp; local model</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    width?: number
    height?: number
  }>(),
  {
    width: 420,
    height: 248,
  },
)

const containerStyle = computed(() => ({
  maxWidth: `${props.width}px`,
  width: '100%',
}))
</script>

<style scoped>
.gateway-diagram {
  margin: 0 auto;
}

/* Subtle pulse on Relay glow — restrained, slow, barely noticeable */
@keyframes relay-pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

.gateway-diagram :deep(rect[filter='url(#gd-glow)']) {
  animation: relay-pulse 4s ease-in-out infinite;
}
</style>
