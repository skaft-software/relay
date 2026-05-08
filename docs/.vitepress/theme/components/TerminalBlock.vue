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
    <pre><code><slot></slot></code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)
let timeout: ReturnType<typeof setTimeout> | null = null

function copy(): void {
  const codeEl = document.querySelector('.relay-terminal pre code')
  if (!codeEl) return
  const text = codeEl.textContent || ''
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
