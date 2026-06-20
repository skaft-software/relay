import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Relay',
  description: 'OpenAI/Anthropic-compatible gateway for local model servers',
  base: '/relay/',
  cleanUrls: true,
  appearance: 'dark',
  themeConfig: {
    siteTitle: '',
    nav: [
      { text: 'Docs', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Guide', link: '/configuration' },
      { text: 'GitHub', link: 'https://github.com/achuthanmukundan00/relay' },
    ],
    sidebar: [
      {
        text: 'Relay',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Model Setup', link: '/model-setup' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Lazy LLM Lifecycle', link: '/lazy-llm-lifecycle' },
          { text: 'API Compatibility', link: '/api-compatibility' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Systemd Deployment', link: '/systemd' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Agents', link: '/agents' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/achuthanmukundan00/relay' },
    ],
  },
});
