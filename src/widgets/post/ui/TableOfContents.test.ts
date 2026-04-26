import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TableOfContents from './TableOfContents.svelte';

vi.mock('$app/state', () => ({
  page: { params: { slug: 'test-post' }, url: new URL('http://localhost/') },
}));

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let capturedCallback: IntersectionObserverCallback | null = null;

vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor(cb: IntersectionObserverCallback) {
      capturedCallback = cb;
    }
    observe = mockObserve;
    unobserve = vi.fn();
    disconnect = mockDisconnect;
  }
);

describe('TableOfContents', () => {
  let prose: HTMLElement;

  beforeEach(() => {
    prose = document.createElement('div');
    prose.className = 'prose';
    document.body.appendChild(prose);
    capturedCallback = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (prose.parentNode) {
      document.body.removeChild(prose);
    }
  });

  it('renders nothing when prose has fewer than 2 h2 headings', () => {
    prose.innerHTML = '<h2>Only Heading</h2>';
    render(TableOfContents);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders nothing when no prose element exists', () => {
    document.body.removeChild(prose);
    render(TableOfContents);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    document.body.appendChild(prose);
  });

  it('renders nav when prose has 2 or more h2 headings', () => {
    prose.innerHTML = '<h2>Section A</h2><h2>Section B</h2>';
    render(TableOfContents);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section A' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section B' })).toBeInTheDocument();
  });

  it('ignores h3 headings', () => {
    prose.innerHTML = '<h2>Top Level</h2><h3>Sub Level</h3><h2>Another</h2>';
    render(TableOfContents);
    expect(screen.getByRole('link', { name: 'Top Level' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sub Level' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Another' })).toBeInTheDocument();
  });

  it('generates slug id for h2 headings without id', () => {
    prose.innerHTML = '<h2>My Section</h2><h2>Another Section</h2>';
    render(TableOfContents);
    expect((prose.querySelector('h2') as HTMLElement).id).toBe('my-section');
  });

  it('preserves existing id on h2 headings', () => {
    prose.innerHTML = '<h2 id="custom">Custom ID</h2><h2>Second</h2>';
    render(TableOfContents);
    expect((prose.querySelector('h2') as HTMLElement).id).toBe('custom');
  });

  it('links each h2 to its id anchor', () => {
    prose.innerHTML = '<h2 id="intro">Intro</h2><h2 id="outro">Outro</h2>';
    render(TableOfContents);
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('href', '#intro');
    expect(screen.getByRole('link', { name: 'Outro' })).toHaveAttribute('href', '#outro');
  });

  it('starts IntersectionObserver for each h2 heading', () => {
    prose.innerHTML = '<h2>A</h2><h2>B</h2>';
    render(TableOfContents);
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('marks a heading active when the observer reports it intersecting', () => {
    prose.innerHTML = '<h2 id="alpha">Alpha</h2><h2 id="beta">Beta</h2>';
    render(TableOfContents);

    expect(capturedCallback).toBeTruthy();
    flushSync(() => {
      capturedCallback?.(
        [
          {
            isIntersecting: true,
            target: { id: 'beta' } as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    const activeLink = screen.getByRole('link', { name: 'Beta' });
    expect(activeLink.className).toContain('border-accent');
  });

  it('ignores observer entries that are not intersecting', () => {
    prose.innerHTML = '<h2 id="alpha">Alpha</h2><h2 id="beta">Beta</h2>';
    render(TableOfContents);

    flushSync(() => {
      capturedCallback?.(
        [
          {
            isIntersecting: false,
            target: { id: 'beta' } as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    const link = screen.getByRole('link', { name: 'Beta' });
    expect(link.className).not.toContain('border-accent');
  });
});
