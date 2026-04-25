import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TableOfContents from './TableOfContents.svelte';

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

vi.stubGlobal(
  'IntersectionObserver',
  class {
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (prose.parentNode) {
      document.body.removeChild(prose);
    }
  });

  it('renders nothing when prose has fewer than 2 headings', () => {
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

  it('renders nav when prose has 2 or more headings', () => {
    prose.innerHTML = '<h2>Section A</h2><h2>Section B</h2>';
    render(TableOfContents);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section A' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Section B' })).toBeInTheDocument();
  });

  it('renders h2 and h3 headings', () => {
    prose.innerHTML = '<h2>Top Level</h2><h3>Sub Level</h3><h2>Another</h2>';
    render(TableOfContents);
    expect(screen.getByRole('link', { name: 'Top Level' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sub Level' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Another' })).toBeInTheDocument();
  });

  it('generates slug id for headings without id', () => {
    prose.innerHTML = '<h2>My Section</h2><h3>Sub Topic</h3>';
    render(TableOfContents);
    expect((prose.querySelector('h2') as HTMLElement).id).toBe('my-section');
    expect((prose.querySelector('h3') as HTMLElement).id).toBe('sub-topic');
  });

  it('preserves existing id on headings', () => {
    prose.innerHTML = '<h2 id="custom">Custom ID</h2><h3>Second</h3>';
    render(TableOfContents);
    expect((prose.querySelector('h2') as HTMLElement).id).toBe('custom');
  });

  it('indents h3 items with 12px padding-left relative to h2', () => {
    prose.innerHTML = '<h2>Top</h2><h3>Nested</h3>';
    render(TableOfContents);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveStyle('padding-left: 0px');
    expect(items[1]).toHaveStyle('padding-left: 12px');
  });

  it('links each heading to its id anchor', () => {
    prose.innerHTML = '<h2 id="intro">Intro</h2><h3 id="detail">Detail</h3>';
    render(TableOfContents);
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('href', '#intro');
    expect(screen.getByRole('link', { name: 'Detail' })).toHaveAttribute('href', '#detail');
  });

  it('starts IntersectionObserver for each heading', () => {
    prose.innerHTML = '<h2>A</h2><h2>B</h2>';
    render(TableOfContents);
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });
});
