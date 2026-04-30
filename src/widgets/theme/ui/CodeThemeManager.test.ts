import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { applyCodeTheme, generateThemeCSS, browserMock, themeMock } = vi.hoisted(() => ({
  applyCodeTheme: vi.fn(),
  generateThemeCSS: vi.fn(() => '.mock-theme{}'),
  browserMock: { value: true },
  themeMock: { current: 'dark' },
}));

vi.mock('$app/environment', () => ({
  get browser() {
    return browserMock.value;
  },
}));

vi.mock('$features/theme/model/codeTheme.svelte', () => ({
  applyCodeTheme,
  darkCodeTheme: { value: 'github-dark' },
  lightCodeTheme: { value: 'github-light' },
}));

vi.mock('$features/theme/model/theme.svelte', () => ({
  get theme() {
    return themeMock;
  },
}));

vi.mock('$shared/lib/theme-utils', () => ({
  generateThemeCSS,
}));

import CodeThemeManager from './CodeThemeManager.svelte';

describe('CodeThemeManager', () => {
  beforeEach(() => {
    applyCodeTheme.mockClear();
    generateThemeCSS.mockClear();
    document.head.innerHTML = '';
    browserMock.value = true;
    themeMock.current = 'dark';
  });

  it('applies dark code theme and injects code theme css', () => {
    render(CodeThemeManager);

    expect(applyCodeTheme).toHaveBeenCalledWith('github-dark');
    expect(generateThemeCSS).toHaveBeenCalled();
    expect(document.head.innerHTML).toContain('.mock-theme{}');
  });

  it('applies light code theme', () => {
    themeMock.current = 'light';
    render(CodeThemeManager);

    expect(applyCodeTheme).toHaveBeenCalledWith('github-light');
  });

  it('keeps ssr style injection without applying the browser attribute', () => {
    browserMock.value = false;
    render(CodeThemeManager);

    expect(applyCodeTheme).not.toHaveBeenCalled();
    expect(generateThemeCSS).toHaveBeenCalled();
    expect(document.head.innerHTML).toContain('.mock-theme{}');
  });
});
