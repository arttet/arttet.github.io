import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCodeTheme, darkCodeTheme, lightCodeTheme } from './codeTheme.svelte';

vi.mock('$app/environment', () => ({
  browser: true,
}));

describe('CodeTheme model', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-code-theme');
  });

  it('initializes with default themes', () => {
    expect(darkCodeTheme.value).toBe('catppuccin-mocha');
    expect(lightCodeTheme.value).toBe('catppuccin-latte');
  });

  it('updates and persists theme changes', () => {
    darkCodeTheme.value = 'github-dark';
    expect(localStorage.getItem('code-theme-dark')).toBe('github-dark');
    expect(darkCodeTheme.value).toBe('github-dark');
  });

  it('applies code theme to DOM', () => {
    applyCodeTheme('catppuccin-mocha');

    expect(document.documentElement.getAttribute('data-code-theme')).toBe('catppuccin-mocha');
    const styleEl = document.getElementById('code-theme-style');
    expect(styleEl).toBeDefined();
    expect(styleEl?.textContent).toContain('--shiki-catppuccin-mocha');
  });
});
