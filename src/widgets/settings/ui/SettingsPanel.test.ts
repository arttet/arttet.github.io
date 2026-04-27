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

  it('closes on escape key and restores focus', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    btn.focus();
    await fireEvent.click(btn);

    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(navAnchored.value).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('closes when tabbing out of the first item with shift', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn);

    const firstItem = screen.getAllByRole('button')[1]; // Settings button is [0], first panel item is [1]
    firstItem.focus();

    await fireEvent.keyDown(firstItem, { key: 'Tab', shiftKey: true });
    expect(navAnchored.value).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('closes when tabbing out of the last item', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn);

    const buttons = screen.getAllByRole('button');
    const lastItem = buttons[buttons.length - 1];
    lastItem.focus();

    await fireEvent.keyDown(lastItem, { key: 'Tab', shiftKey: false });
    expect(navAnchored.value).toBe(false);
    expect(document.activeElement).toBe(btn);
  });
});
