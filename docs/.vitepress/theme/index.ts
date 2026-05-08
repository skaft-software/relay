import { h, type App } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import RelayLogo from './RelayLogo.vue'
import GatewayDiagram from './GatewayDiagram.vue'
import CompatibilityVisual from './components/CompatibilityVisual.vue'
import ProblemVisual from './components/ProblemVisual.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () =>
        h('div', { class: 'relay-nav-logo' }, [
          h(RelayLogo, { size: 24 }),
          h('span', { class: 'relay-nav-text' }, 'Relay'),
        ]),
      'home-hero-image': () =>
        h(GatewayDiagram, { width: 420, height: 248 }),
    })
  },
  enhanceApp({ app }: { app: App }) {
    app.component('CompatibilityVisual', CompatibilityVisual)
    app.component('ProblemVisual', ProblemVisual)
  },
} satisfies Theme
