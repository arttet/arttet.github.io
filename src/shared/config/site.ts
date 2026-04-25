import type { CodeTheme } from '$entities/codeTheme/codeTheme';
import { codeThemes as rawCodeThemes } from './codeThemes.js';

const codeThemes = rawCodeThemes as readonly CodeTheme[];

export const site = {
  title: 'Artyom Tetyukhin',
  description: 'Personal blog about software engineering — the little stuff I know.',
  url: 'https://arttet.github.io',
  author: {
    name: 'Artyom Tetyukhin',
    title: 'Software Development Engineer',
    github: 'arttet',
    linkedin: 'arttet',
  },
  social: {
    github: 'https://github.com/arttet',
    // linkedin: 'https://www.linkedin.com/in/arttet/',
  },
  licenses: {
    code: {
      label: 'GPL-3.0-or-later',
      href: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
    },
    content: {
      label: 'CC BY-NC-SA 4.0',
      href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
  },
  nav: {
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'About', href: '/about' },
    ],
    hideThreshold: 80, // px from top — nav visible when mouseY < this
  },
  blog: {
    postsPerPage: 12,
  },
  about: {
    description: 'About Artyom Tetyukhin',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/arttet',
        description: 'Code, experiments, and project source.',
      },
      // {
      //   label: 'LinkedIn',
      //   href: 'https://www.linkedin.com/in/arttet/',
      //   description: 'Professional background and current work.',
      // },
    ],
    projects: [
      {
        title: 'Dotfiles',
        description: 'My personal development environment.',
        href: 'https://github.com/arttet/dotfiles',
        tags: ['nushell', 'alacritty', 'neovim', 'yazi', 'starship'],
      },
      {
        title: 'envctl',
        description:
          'A Nushell-native configuration compiler and execution engine for environment and secrets management.',
        href: 'https://github.com/arttet/envctl',
        tags: [
          'nushell',
          'configuration-management',
          'secrets-management',
          'environment-management',
        ],
      },
    ],
    projectTagClasses: {
      nushell: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      alacritty: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
      neovim: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
      yazi: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      starship: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
      'configuration-management':
        'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
      'secrets-management': 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      'environment-management':
        'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    } as Record<string, string>,
  },
  mermaid: {
    maxTextSize: 90000,
  },
  // WebGPU landing configuration — "night city from cosmos"
  particles: {
    count: 1400,
    ghostCount: 80, // invisible ghost points that flee cursor — create organic mesh breathing
    speed: 0.8,
    pointSize: 5.5,
    springK: 0.0006, // weak spring — particles drift freely, slowly return to rest
    damping: 0.993,
    cursorMode: 'attract' as 'attract' | 'repulse',
    // Per-particle colors (RGB 0–1).
    colors: {
      dark: [
        [1.0, 1.0, 0.0], // yellow
        [0.0, 1.0, 1.0], // cyan
        [1.0, 0.0, 0.67], // magenta
        [0.0, 0.8, 1.0], // sky blue
        [1.0, 0.8, 0.0], // amber
      ],
      light: [
        [0.55, 0.35, 0.75], // soft lavender
        [0.75, 0.45, 0.5], // dusty rose
        [0.8, 0.6, 0.2], // warm amber
        [0.4, 0.65, 0.5], // sage green
        [0.35, 0.5, 0.8], // muted blue
      ],
    } as Record<'dark' | 'light', [number, number, number][]>,
    edgeColor: [0.0, 1.0, 1.0] as [number, number, number], // #00ffff cyan edges
    cursorRadius: 140,
    cursorForce: 10,
    // Post-processing bloom (Three.js UnrealBloomPass equivalent)
    bloomStrength: 1.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.1, // low threshold — more elements contribute to glow
  },
  codeThemes,
  theme: {
    glass: {
      width: 400,
      height: 260,
    },
    // Defaults written to localStorage on first visit.
    // MUST stay in sync with the inline script in src/app.html
    defaults: {
      dark: 'catppuccin-mocha',
      light: 'catppuccin-latte',
    },
    // localStorage key names.
    // MUST stay in sync with the inline script in src/app.html
    storageKeys: {
      theme: 'theme',
      codeThemeDark: 'code-theme-dark',
      codeThemeLight: 'code-theme-light',
      readingMode: 'readingMode',
      backgroundMode: 'backgroundMode',
    },
    defaultBackground: 'particles' as 'particles' | 'contours' | 'flow',
  },
} as const;
