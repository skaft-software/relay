<template>
  <div :class="['relay-logo', { hero }]" :style="logoStyle">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="relay-bolt"
    >
      <defs>
        <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="hero ? '#fbbf24' : '#f59e0b'" />
          <stop offset="40%" :stop-color="hero ? '#fcd34d' : '#fbbf24'" />
          <stop offset="60%" :stop-color="hero ? '#fef3c7' : '#fde68a'" />
          <stop offset="100%" :stop-color="hero ? '#f59e0b' : '#d97706'" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="1 0"
            dur="2s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <filter id="bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#bolt-glow)">
        <path
          d="M28 3L8 27h11l-2 18 21-24H25l3-18z"
          fill="url(#bolt-grad)"
          stroke="url(#bolt-grad)"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </g>
    </svg>
    <div v-if="hero" class="relay-hero-text">Relay</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
    hero?: boolean
  }>(),
  {
    size: 28,
    hero: false,
  },
)

const logoStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size + (props.hero ? 40 : 0)}px`,
}))
</script>

<style scoped>
.relay-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.relay-logo.hero {
  margin: 0 auto;
}

.relay-bolt {
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.35));
  animation: bolt-glow-pulse 2.5s ease-in-out infinite;
}

.relay-logo.hero .relay-bolt {
  filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.5));
  animation: bolt-glow-pulse-hero 2.5s ease-in-out infinite;
}

.relay-hero-text {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 35%, #fde68a 60%, #f59e0b 100%);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-shimmer 2.5s ease-in-out infinite;
  margin-top: 8px;
  line-height: 1.1;
}

@keyframes bolt-glow-pulse {
  0%,
  100% {
    filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.6));
  }
}

@keyframes bolt-glow-pulse-hero {
  0%,
  100% {
    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.8));
  }
}

@keyframes text-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
</style>
