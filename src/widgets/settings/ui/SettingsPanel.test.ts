import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';

const { readingModeMock } = vi.hoisted(() => ({
  readingModeMock: { value: false },
}));

vi.mock('$features/theme/model/readingMode.svelte', () => ({
  readingMode: readingModeMock,
}));

import SettingsPanel from './SettingsPanel.svelte';

describe('SettingsPanel', () => {
  it('toggles open state', async () => {
    readingModeMock.value = false;
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    expect(navAnchored.value).toBe(true);
    expect(screen.getByText('Code theme')).toBeInTheDocument();
    // Background mode list should be visible
    expect(screen.getByText('Background effect')).toBeInTheDocument();
  });

  it('hides background settings in reading mode', async () => {
    readingModeMock.value = true;
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    expect(screen.queryByText('Background effect')).toBeNull();
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
