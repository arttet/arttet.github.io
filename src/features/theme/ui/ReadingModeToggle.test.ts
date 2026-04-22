import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { readingMode } from '$features/theme/model/readingMode.svelte';
import ReadingModeToggle from './ReadingModeToggle.svelte';

describe('ReadingModeToggle', () => {
  it('toggles reading mode', async () => {
    render(ReadingModeToggle);
    const button = screen.getByRole('button', { name: 'Toggle reading mode' });
    expect(button).toBeDefined();

    // Toggle
    await fireEvent.click(button);
    expect(readingMode.value).toBe(true);
  });
});
