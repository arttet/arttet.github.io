import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { applyCodeTheme, generateThemeCSS } = vi.hoisted(() => ({
  applyCodeTheme: vi.fn(),
  generateThemeCSS: vi.fn(() => '.mock-theme{}'),
}));

vi.mock('$app/environment', () => ({
  browser: true,
}));

vi.mock('$features/theme/model/codeTheme.svelte', () => ({
  applyCodeTheme,
  darkCodeTheme: { value: 'github-dark' },
  lightCodeTheme: { value: 'github-light' },
}));

vi.mock('$features/theme/model/theme.svelte', () => ({
  theme: { current: 'dark' },
}));

vi.mock('$shared/lib/theme-utils', () => ({
  generateThemeCSS,
}));

import ThemeManager from './ThemeManager.svelte';

describe('ThemeManager', () => {
  beforeEach(() => {
    applyCodeTheme.mockClear();
    generateThemeCSS.mockClear();
    document.documentElement.className = '';
    document.head.innerHTML = '';
  });

  it('applies current theme mode and code theme', () => {
    render(ThemeManager);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(applyCodeTheme).toHaveBeenCalledWith('github-dark');
    expect(generateThemeCSS).toHaveBeenCalled();
    expect(document.head.innerHTML).toContain('.mock-theme{}');
  });
});
