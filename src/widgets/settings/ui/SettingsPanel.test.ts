import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOG_POST_ROUTE_ID } from '$shared/config/routes';
import { navAnchored } from '$features/theme/model/navAnchor.svelte';

const { pageState, readingModeMock } = vi.hoisted(() => ({
  pageState: {
    url: new URL('https://arttet.github.io/blog/2026-04-20-architecture-and-stack'),
    route: null as { id: string } | null,
  },
  readingModeMock: { value: false },
}));

vi.mock('$app/state', () => ({
  page: pageState,
}));

vi.mock('$features/theme/model/readingMode.svelte', () => ({
  readingMode: readingModeMock,
}));

import SettingsPanel from './SettingsPanel.svelte';

describe('SettingsPanel', () => {
  beforeEach(() => {
    pageState.url = new URL('https://arttet.github.io/blog/2026-04-20-architecture-and-stack');
    pageState.route = { id: BLOG_POST_ROUTE_ID };
    readingModeMock.value = false;
  });

  it('toggles open state', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    expect(navAnchored.value).toBe(true);
    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());
    // Background mode list should be visible
    await waitFor(() => {
      expect(screen.getByText('Background effect')).toBeInTheDocument();
      expect(screen.getAllByRole('separator')).toHaveLength(2);
    });
  });

  it('does not focus settings on mount', () => {
    render(SettingsPanel);
    expect(document.activeElement).not.toBe(screen.getByLabelText('Settings'));
  });

  it('hides background settings in reading mode', async () => {
    readingModeMock.value = true;
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());
    expect(screen.queryByText('Background effect')).toBeNull();
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('does not load code theme settings outside post pages', async () => {
    pageState.url = new URL('https://arttet.github.io/about');
    pageState.route = { id: '/about' };
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('Background effect')).toBeInTheDocument());
    expect(screen.queryByText('Code theme')).not.toBeInTheDocument();
  });

  it('does not load code theme settings on blog listing pages', async () => {
    pageState.url = new URL('https://arttet.github.io/blog/');
    pageState.route = { id: '/blog' };
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('Background effect')).toBeInTheDocument());
    expect(screen.queryByText('Code theme')).not.toBeInTheDocument();
  });

  it('does not load code theme settings when route is unavailable', async () => {
    pageState.url = new URL('https://arttet.github.io/missing');
    pageState.route = null;
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('Background effect')).toBeInTheDocument());
    expect(screen.queryByText('Code theme')).not.toBeInTheDocument();
  });

  it('closes on escape key and restores focus to trigger if focus was inside panel', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn); // Open the panel
    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());

    // Focus something inside the panel
    const firstItem = screen.getAllByRole('button')[1];
    firstItem.focus();

    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(navAnchored.value).toBe(false);
    expect(document.activeElement).toBe(btn);
  });

  it('closes when tabbing out of the first item with shift', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());

    const panel = screen.getByRole('none');
    const focusables = panel.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstItem = focusables[0] as HTMLElement;
    firstItem.focus();

    await fireEvent.keyDown(firstItem, { key: 'Tab', shiftKey: true });
    expect(navAnchored.value).toBe(false);
    expect(screen.queryByText('Code theme')).not.toBeInTheDocument();
  });

  it('closes when tabbing out of the last item', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());

    const panel = screen.getByRole('none');
    const focusables = panel.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const lastItem = focusables[focusables.length - 1] as HTMLElement;
    lastItem.focus();

    await fireEvent.keyDown(lastItem, { key: 'Tab', shiftKey: false });
    expect(navAnchored.value).toBe(false);
    expect(screen.queryByText('Code theme')).not.toBeInTheDocument();
  });

  it('does nothing on Tab if there are no focusable elements in panel', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings') as HTMLButtonElement;
    await fireEvent.click(btn);

    const panel = screen.getByRole('none');

    // Temporarily mock querySelectorAll on the panel
    const originalQuerySelectorAll = panel.querySelectorAll;
    panel.querySelectorAll = vi.fn().mockReturnValue([]);

    await fireEvent.keyDown(panel, { key: 'Tab' });

    // Verify it's still open
    expect(navAnchored.value).toBe(true);

    // Restore
    panel.querySelectorAll = originalQuerySelectorAll;
  });

  it('closes when clicking outside', async () => {
    render(SettingsPanel);
    const btn = screen.getByLabelText('Settings');
    await fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText('Code theme')).toBeInTheDocument());

    // Wait for clickOutside listener to be registered (it uses setTimeout 0)
    await new Promise((r) => setTimeout(r, 0));

    await fireEvent.click(document.body);
    await waitFor(() => expect(screen.queryByText('Code theme')).not.toBeInTheDocument());
  });
});
