import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Snippet } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchModel } from '$features/search/model/searchModel.svelte';

const {
  pageState,
  onNavigateMock,
  afterNavigateMock,
  setThemesMock,
  readingModeState,
  intersectionObserveMock,
  intersectionDisconnectMock,
} = vi.hoisted(() => ({
  pageState: {
    url: new URL('https://arttet.github.io/about'),
  },
  onNavigateMock: vi.fn(),
  afterNavigateMock: vi.fn(),
  setThemesMock: vi.fn(),
  readingModeState: { value: true },
  intersectionObserveMock: vi.fn(),
  intersectionDisconnectMock: vi.fn(),
}));

let intersectionCallback: IntersectionObserverCallback | undefined;

vi.mock('$app/navigation', () => ({
  onNavigate: onNavigateMock,
  afterNavigate: afterNavigateMock,
}));

vi.mock('$app/environment', () => ({
  browser: true,
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

vi.mock('$lib/markdown/core/highlighter', () => ({
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
    intersectionObserveMock.mockReset();
    intersectionDisconnectMock.mockReset();
    intersectionCallback = undefined;
    pageState.url = new URL('https://arttet.github.io/about');
    readingModeState.value = true;
    document.head.innerHTML = '';
    searchModel.close();
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn((cb: () => void) => {
        cb();
        return 1;
      })
    );
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallback = callback;
        }
        observe = intersectionObserveMock;
        disconnect = intersectionDisconnectMock;
      }
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ posts: [] }),
        })
      )
    );
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
    expect(screen.queryByRole('link', { name: 'Skip to content' })).not.toBeInTheDocument();
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

  it('opens lazy command palette with the global keyboard shortcut', async () => {
    const openPaletteSpy = vi.spyOn(searchModel, 'openPalette').mockImplementation(async () => {
      searchModel.open = true;
    });
    render(Layout, { children: emptySnippet });

    await fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => expect(searchModel.open).toBe(true));
    openPaletteSpy.mockRestore();
  });

  it('registers view transition navigation hook and hides layout seo on blog pages', async () => {
    pageState.url = new URL('https://arttet.github.io/blog/2026-04-12-blog-initialization');

    document.startViewTransition = createViewTransitionMock();

    render(Layout, { children: emptySnippet });

    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
    expect(onNavigateMock).toHaveBeenCalled();
  });

  it('handles missing ViewTransition support gracefully', async () => {
    const { startViewTransition } = document;
    (document as any).startViewTransition = undefined;

    render(Layout, { children: emptySnippet });

    const callback = onNavigateMock.mock.lastCall?.[0];
    const result = callback({ complete: Promise.resolve() });
    expect(result).toBeUndefined();

    document.startViewTransition = startViewTransition;
  });

  it('uses setTimeout fallback when requestIdleCallback is unavailable', async () => {
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;
    (window as any).requestIdleCallback = undefined;
    (window as any).cancelIdleCallback = undefined;

    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    readingModeState.value = false;
    const { unmount } = render(Layout, { children: emptySnippet });

    expect(setTimeoutSpy).toHaveBeenCalled();
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    window.requestIdleCallback = originalRequestIdleCallback;
    window.cancelIdleCallback = originalCancelIdleCallback;
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('loads and renders Footer when the footer sentinel becomes visible', async () => {
    render(Layout, { children: emptySnippet });

    expect(screen.queryByText('©')).not.toBeInTheDocument();
    expect(intersectionObserveMock).toHaveBeenCalled();

    intersectionCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {
      disconnect: intersectionDisconnectMock,
    } as unknown as IntersectionObserver);

    await waitFor(() => {
      expect(document.querySelector('footer')).toBeInTheDocument();
    });
    expect(intersectionDisconnectMock).toHaveBeenCalled();
  });

  it('loads and renders Command Palette when searchModel.open is true', async () => {
    render(Layout, { children: emptySnippet });

    searchModel.open = true;

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Search posts' })).toBeInTheDocument();
    });
  });

  it('renders background canvas when reading mode is disabled and runs navigation callback branches', async () => {
    readingModeState.value = false;
    document.startViewTransition = createViewTransitionMock();

    render(Layout, { children: emptySnippet });

    await waitFor(() => {
      expect(
        document.querySelector('canvas') ?? document.querySelector('div[aria-hidden="true"]')
      ).toBeInTheDocument();
    });

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

  it('handles hash scroll effect', async () => {
    vi.useFakeTimers();
    pageState.url = new URL('https://arttet.github.io/about#test-id');

    const focusMock = vi.fn();
    const scrollMock = vi.fn();
    const el = document.createElement('div');
    el.id = 'test-id';
    el.focus = focusMock;
    el.scrollIntoView = scrollMock;
    document.body.appendChild(el);

    render(Layout, { children: emptySnippet });

    vi.advanceTimersByTime(150);

    expect(focusMock).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollMock).toHaveBeenCalled();

    document.body.removeChild(el);
    vi.useRealTimers();
  });

  it('renders page content before the fixed navbar in DOM focus order', () => {
    render(Layout, { children: emptySnippet });

    const main = screen.getByRole('main');
    const navHome = screen.getByRole('link', { name: 'Home' });

    expect(main.compareDocumentPosition(navHome)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
