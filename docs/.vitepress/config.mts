import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Relay',
  description: 'Protocol adapter for local and cloud LLMs — OpenAI and Anthropic compatible',
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
          { text: 'Setup Wizard', link: '/model-setup' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Model Lifecycle', link: '/lazy-llm-lifecycle' },
          { text: 'API Compatibility', link: '/api-compatibility' },
          { text: 'Agents & Clients', link: '/agents' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
          { text: 'Public Deployment', link: '/deploy-public' },
          { text: 'Deployment', link: '/deploy-systemd' },
          { text: 'Architecture', link: '/architecture' },
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
