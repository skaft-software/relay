<template>
  <figure class="compat-visual" aria-label="Relay translation pipeline">
    <div class="compat-flow">
      <div class="compat-node compat-node-client">
        <span class="compat-label">Clients</span>
        <strong>OpenAI / Anthropic</strong>
        <code>SDK requests, tools, streams</code>
      </div>

      <div class="compat-arrow" aria-hidden="true">→</div>

      <div class="compat-node compat-node-relay">
        <span class="compat-label">Relay</span>
        <strong>Normalize boundary</strong>
        <code>messages, SSE, tools, errors</code>
      </div>

      <div class="compat-arrow" aria-hidden="true">→</div>

      <div class="compat-node compat-node-upstream">
        <span class="compat-label">Backend</span>
        <strong>llama.cpp or Cloud API</strong>
        <code>local GPU or hosted inference</code>
      </div>
    </div>

    <div class="compat-return" aria-hidden="true">
      <span></span>
      <code>canonical response back to the agent</code>
      <span></span>
    </div>

    <figcaption class="compat-caption" v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    caption?: string
  }>(),
  {
    caption: 'Gateway mode manages local llama.cpp models. Cloud mode proxies OpenAI, Anthropic, DeepSeek, or Groq. Same API surface either way.',
  },
)
</script>

<style scoped>
.compat-visual {
  --vp-c-text-1: #f4f7fb;
  --vp-c-text-2: #c3cad6;
  --vp-c-text-3: #8b95a5;
  --vp-c-brand-2: #8fb8e9;

  margin: 0;
}

.compat-flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr) 28px minmax(0, 1fr);
  align-items: stretch;
  gap: 10px;
}

.compat-node {
  min-width: 0;
  min-height: 122px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(86, 141, 208, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.012)),
    #0d0d11;
}

.compat-node-relay {
  border-color: rgba(86, 141, 208, 0.52);
  background:
    linear-gradient(180deg, rgba(86, 141, 208, 0.16), rgba(86, 141, 208, 0.04)),
    #0d0d11;
  box-shadow: 0 0 0 1px rgba(86, 141, 208, 0.12), 0 18px 40px rgba(86, 141, 208, 0.08);
}

.compat-label,
.compat-node code,
.compat-return code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.compat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-2);
}

.compat-node strong {
  display: block;
  color: var(--vp-c-text-1);
  font-size: 15px;
  line-height: 1.25;
}

.compat-node code {
  display: block;
  padding: 0;
  color: var(--vp-c-text-2);
  background: transparent;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.compat-arrow {
  align-self: center;
  justify-self: center;
  color: rgba(86, 141, 208, 0.65);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
}

.compat-return {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.compat-return span {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(86, 141, 208, 0.22));
}

.compat-return span:last-child {
  background: linear-gradient(90deg, rgba(86, 141, 208, 0.22), transparent);
}

.compat-return code {
  padding: 0;
  color: var(--vp-c-text-3);
  background: transparent;
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.compat-caption {
  margin: 14px auto 0;
  max-width: 560px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
}

@media (max-width: 720px) {
  .compat-flow {
    grid-template-columns: 1fr;
  }

  .compat-node {
    min-height: 0;
  }

  .compat-arrow {
    transform: rotate(90deg);
  }

  .compat-return {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .compat-return span {
    display: none;
  }

  .compat-return code {
    white-space: normal;
    text-align: center;
  }
}
</style>
