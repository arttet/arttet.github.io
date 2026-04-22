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
        [1.0, 1.0, 0.0], // yellow
        [0.0, 1.0, 1.0], // cyan
        [1.0, 0.0, 0.67], // magenta
        [0.0, 0.8, 1.0], // sky blue
        [1.0, 0.8, 0.0], // amber
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
