<template>
  <div class="relay-terminal" ref="terminalEl">
    <div class="relay-terminal-bar">
      <span class="relay-terminal-dot"></span>
      <span class="relay-terminal-dot"></span>
      <span class="relay-terminal-dot"></span>
      <span class="relay-terminal-label">terminal</span>
      <button
        class="relay-terminal-copy"
        :class="{ 'relay-terminal-copy--copied': copied }"
        :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
        :title="copied ? 'Copied' : 'Copy to clipboard'"
        @click="copy"
      >
        <span v-if="copied">&#10003;</span>
        <span v-else>&#10713;</span>
      </button>
    </div>
    <pre><code><slot></slot><span class="relay-cursor" aria-hidden="true"> </span></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

function copy(): void {
  const codeEl = document.querySelector('.relay-terminal pre code')
  if (!codeEl) return
  const allText = codeEl.childNodes
  let text = ''
  for (const node of allText) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent || ''
  }
  navigator.clipboard.writeText(text).then(() => {
    setCopied()
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try { document.execCommand('copy') } catch { /* ignore */ }
    document.body.removeChild(textarea)
    setCopied()
  })
}

function setCopied(): void {
  copied.value = true
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.relay-cursor {
  display: inline-block;
  width: 8px;
  height: 14px;
  background: rgba(86, 141, 208, 0.7);
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: relay-cursor-blink 1s step-end infinite;
}

@keyframes relay-cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .relay-cursor {
    animation: none;
    opacity: 0;
  }
}
</style>
