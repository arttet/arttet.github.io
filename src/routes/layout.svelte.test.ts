import { fireEvent, render, screen } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pageState, onNavigateMock, afterNavigateMock, setThemesMock, readingModeState } =
  vi.hoisted(() => ({
    pageState: {
      url: new URL('https://arttet.github.io/about'),
    },
    onNavigateMock: vi.fn(),
    afterNavigateMock: vi.fn(),
    setThemesMock: vi.fn(),
    readingModeState: { value: true },
  }));

vi.mock('$app/navigation', () => ({
  onNavigate: onNavigateMock,
  afterNavigate: afterNavigateMock,
}));

vi.mock('$app/state', () => ({
  page: pageState,
}));

vi.mock('$features/background/model/background.svelte', () => ({
  backgroundState: { mode: 'particles' },
}));

vi.mock('$features/theme/model/readingMode.svelte', () => ({
  readingMode: readingModeState,
}));

vi.mock('$lib/highlighter', () => ({
  setThemes: setThemesMock,
}));

import Layout from './+layout.svelte';

const emptySnippet = (() => '') as unknown as Snippet;

function createViewTransitionMock() {
  return vi.fn((cb?: ViewTransitionUpdateCallback | StartViewTransitionOptions) => {
    if (typeof cb === 'function') {
      void cb();
    }

    return {
      finished: Promise.resolve(undefined),
      ready: Promise.resolve(undefined),
      updateCallbackDone: Promise.resolve(undefined),
      skipTransition: vi.fn(),
      types: new Set(),
    } as ViewTransition;
  }) as unknown as typeof document.startViewTransition;
}

describe('root layout', () => {
  beforeEach(() => {
    onNavigateMock.mockReset();
    afterNavigateMock.mockReset();
    setThemesMock.mockReset();
    pageState.url = new URL('https://arttet.github.io/about');
    readingModeState.value = true;
    document.head.innerHTML = '';
  });

  it('renders layout shell and non-blog seo', async () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    let afterNavigateCallback: ((nav: { to: { url: URL } | null }) => void) | undefined;
    afterNavigateMock.mockImplementation((cb) => {
      afterNavigateCallback = cb;
    });

    render(Layout, { children: emptySnippet });

    expect(setThemesMock).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search (⌘K)')).toBeInTheDocument();
    expect(document.head.querySelector('meta[name="description"]')).toBeInTheDocument();
    expect(document.querySelector('main#main-content')).toHaveAttribute('tabindex', '-1');

    await fireEvent.mouseMove(window, { clientY: 10 });
    await fireEvent.mouseLeave(window);
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    await fireEvent.scroll(window);

    afterNavigateCallback?.({ to: { url: new URL('https://arttet.github.io/about') } });
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });

    scrollToMock.mockClear();
    afterNavigateCallback?.({
      to: { url: new URL('https://arttet.github.io/about#section') },
    });
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it('registers view transition navigation hook and hides layout seo on blog pages', async () => {
    pageState.url = new URL('https://arttet.github.io/blog/2026-04-12-blog-initialization');

    document.startViewTransition = createViewTransitionMock();

    render(Layout, { children: emptySnippet });

    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(onNavigateMock).toHaveBeenCalled();
  });

  it('renders background canvas when reading mode is disabled and runs navigation callback branches', async () => {
    readingModeState.value = false;
    document.startViewTransition = createViewTransitionMock();

    render(Layout, { children: emptySnippet });

    expect(
      document.querySelector('canvas') ?? document.querySelector('div[aria-hidden="true"]')
    ).toBeInTheDocument();

    const navigation = { complete: Promise.resolve() };
    const callback = onNavigateMock.mock.lastCall?.[0];
    expect(typeof callback).toBe('function');
    await expect(
      (callback as (navigation: { complete: Promise<void> }) => Promise<unknown> | undefined)(
        navigation
      )
    ).resolves.toBeUndefined();
    expect(document.startViewTransition).toHaveBeenCalled();
  });
});
