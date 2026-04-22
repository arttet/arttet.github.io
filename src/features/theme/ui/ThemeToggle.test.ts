import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
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
});
