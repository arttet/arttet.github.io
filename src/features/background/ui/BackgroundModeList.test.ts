import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { backgroundMode } from '../backgroundMode.svelte';
import BackgroundModeList from './BackgroundModeList.svelte';

describe('BackgroundModeList', () => {
  beforeEach(() => {
    backgroundMode.value = 'particles';
  });

  it('renders all background mode options', () => {
    render(BackgroundModeList);

    expect(screen.getByText('Background effect')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Particles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Flow/i })).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('updates selected mode on click', async () => {
    render(BackgroundModeList);

    await fireEvent.click(screen.getByRole('button', { name: /Flow/i }));

    expect(backgroundMode.value).toBe('flow');
  });
});
