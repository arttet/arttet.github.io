import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';
import SettingsPanel from './SettingsPanel.svelte';

describe('SettingsPanel', () => {
  it('toggles open state', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    expect(navAnchored.value).toBe(true);
    expect(screen.getByText('Code theme')).toBeInTheDocument();
  });

  it('closes on escape key', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(navAnchored.value).toBe(false);
  });
});
