import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import RelayLogo from './RelayLogo.vue'
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
        h(RelayLogo, { size: 120, hero: true }),
    })
  },
} satisfies Theme
