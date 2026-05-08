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
      <path
        d="M28 3L8 27h11l-2 18 21-24H25l3-18z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
    </svg>
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
  height: `${props.size}px`,
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
  color: var(--vp-c-brand-1);
}

.relay-bolt {
  color: var(--vp-c-brand-1);
  filter: drop-shadow(0 0 8px rgba(86, 141, 208, 0.24));
}

.relay-logo.hero .relay-bolt {
  filter: drop-shadow(0 0 18px rgba(86, 141, 208, 0.36));
}
</style>
