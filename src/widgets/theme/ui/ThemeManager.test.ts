import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserMock, themeMock } = vi.hoisted(() => ({
  browserMock: { value: true },
  themeMock: { current: 'dark' },
}));

vi.mock('$app/environment', () => ({
  get browser() {
    return browserMock.value;
  },
}));

vi.mock('$features/theme/model/theme.svelte', () => ({
  get theme() {
    return themeMock;
  },
}));

import ThemeManager from './ThemeManager.svelte';

describe('ThemeManager', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.head.innerHTML = '';
    browserMock.value = true;
    themeMock.current = 'dark';
  });

  it('applies dark theme mode', () => {
    render(ThemeManager);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.head.innerHTML).not.toContain('.mock-theme{}');
  });

  it('applies light theme mode', () => {
    themeMock.current = 'light';
    render(ThemeManager);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does not apply classes outside the browser', () => {
    browserMock.value = false;
    render(ThemeManager);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.head.innerHTML).not.toContain('.mock-theme{}');
  });
});
