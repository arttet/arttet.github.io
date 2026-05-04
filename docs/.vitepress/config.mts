import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'docs.arttet.dev',
  description: 'A single place for writing, development, architecture, and evolution.',

  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    logo: '/logo.svg',

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Platform', link: '/platform/' },
      { text: 'Evolution', link: '/evolution/' },
    ],

    sidebar: {
      '/platform/': [
        {
          text: 'Platform',
          items: [{ text: 'Overview', link: '/platform/' }],
        },
        {
          text: 'Writer',
          items: [
            { text: 'Overview', link: '/platform/writer/' },
            { text: 'Frontmatter', link: '/platform/writer/frontmatter' },
          ],
        },
        {
          text: 'Developer',
          items: [
            { text: 'Overview', link: '/platform/developer/' },
            { text: 'Conventions', link: '/platform/developer/conventions' },
            { text: 'Workflow', link: '/platform/developer/workflow' },
            { text: 'Commands', link: '/platform/developer/commands' },
            { text: 'Testing', link: '/platform/developer/testing' },
            {
              text: 'Infrastructure',
              link: '/platform/developer/infrastructure',
            },
            { text: 'Extending', link: '/platform/developer/extending' },
            {
              text: 'Troubleshooting',
              link: '/platform/developer/troubleshooting',
            },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/platform/architecture/' },
            {
              text: 'Markdown Pipeline',
              link: '/platform/architecture/markdown-pipeline',
            },
            {
              text: 'WebGPU Pipeline',
              link: '/platform/architecture/webgpu-pipeline',
            },
            {
              text: 'Search Engine',
              link: '/platform/architecture/search-engine',
            },
            {
              text: 'Design System',
              link: '/platform/architecture/style-design',
            },
          ],
        },
      ],
      '/evolution/': [
        {
          text: 'Evolution',
          items: [
            { text: 'Overview', link: '/evolution/' },
            { text: 'Workflow', link: '/evolution/workflow' },
          ],
        },
        {
          text: 'RFCs',
          items: [
            { text: 'Index', link: '/evolution/rfc/' },
            { text: 'Template', link: '/evolution/rfc/template' },
          ],
        },
        {
          text: 'ADRs',
          items: [{ text: 'Index', link: '/evolution/adr/' }],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/arttet/arttet.github.io' },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" fill="none" role="img" aria-label="arttet"><g fill="currentColor" stroke-linejoin="round" stroke-linecap="round"><path d="M18 12L8 37L17 36L21 24L18 12Z"></path><path d="M20 10H28L39 37H30L28 34H20L21 31L26 30V25L20 10Z"></path></g></svg>',
        },
        link: 'https://arttet.dev',
        ariaLabel: 'arttet.dev',
      },
    ],

    footer: {
      copyright: 'Copyright © 2026 Artyom Tetyukhin',
    },
  },
});
