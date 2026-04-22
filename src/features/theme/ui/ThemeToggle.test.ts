import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.themeTransition;
  });

  it('toggles theme on click', async () => {
    // Force the non-ViewTransition branch in JSDOM
    Object.defineProperty(document, 'startViewTransition', {
      value: undefined,
      configurable: true,
    });
    render(ThemeToggle);
    const btn = screen.getByRole('button');

    await fireEvent.click(btn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('uses view transition when available', async () => {
    const finished = Promise.resolve();
    Object.defineProperty(document, 'startViewTransition', {
      value: vi.fn((cb: () => void) => {
        cb();
        return { finished };
      }),
      configurable: true,
    });

    render(ThemeToggle);
    await fireEvent.click(screen.getByRole('button'));
    await finished;

    expect(document.startViewTransition).toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue('--theme-x')).not.toBe('');
    expect(document.documentElement.style.getPropertyValue('--theme-y')).not.toBe('');
    expect(document.documentElement.dataset.themeTransition).toBeUndefined();
  });
});
