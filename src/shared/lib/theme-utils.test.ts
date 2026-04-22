import { describe, expect, it } from 'vitest';
import type { CodeTheme } from '$entities/codeTheme/codeTheme';
import { generateThemeCSS } from './theme-utils';

describe('theme-utils', () => {
  const mockThemes: CodeTheme[] = [
    { id: 'dark-id', label: 'Dark Theme', kind: 'dark', accent: '#00ff00', bg: '#000', fg: '#fff' },
    {
      id: 'light-id',
      label: 'Light Theme',
      kind: 'light',
      accent: '#ff0000',
      bg: '#fff',
      fg: '#000',
    },
  ];

  it('generates CSS rules for all themes', () => {
    const css = generateThemeCSS(mockThemes);

    expect(css).toContain('--code-bg: #080d14');
    expect(css).toContain('html[data-code-theme="dark-id"]');
    expect(css).toContain('--code-accent: #00ff00');
    expect(css).toContain('--shiki-dark-id');
    expect(css).toContain('html[data-code-theme="light-id"]');
    expect(css).toContain('--code-bg: #fff');
  });

  it('handles empty themes array', () => {
    const css = generateThemeCSS([]);
    expect(css).toContain('html {');
    expect(css).not.toContain('html[data-code-theme]');
  });
});
