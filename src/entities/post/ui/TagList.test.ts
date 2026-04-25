import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TagList from './TagList.svelte';

describe('TagList', () => {
  it('renders all tags when count is within max', () => {
    render(TagList, { tags: ['svelte', 'typescript'], max: 3 });
    expect(screen.getByText('#svelte')).toBeInTheDocument();
    expect(screen.getByText('#typescript')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hides excess tags and shows +N more button', () => {
    render(TagList, { tags: ['a', 'b', 'c', 'd'], max: 3 });
    expect(screen.getByText('#a')).toBeInTheDocument();
    expect(screen.queryByText('#d')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+1 more/i })).toBeInTheDocument();
  });

  it('expands all tags on +N more click', async () => {
    render(TagList, { tags: ['a', 'b', 'c', 'd'], max: 3 });
    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByText('#d')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+1 more/i })).not.toBeInTheDocument();
  });

  it('shows show less button after expansion', async () => {
    render(TagList, { tags: ['a', 'b', 'c', 'd'], max: 3 });
    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('collapses tags on show less click', async () => {
    render(TagList, { tags: ['a', 'b', 'c', 'd'], max: 3 });
    await fireEvent.click(screen.getByRole('button', { name: /\+1 more/i }));
    await fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.queryByText('#d')).not.toBeInTheDocument();
  });

  it('links each tag to /blog/tag/{tag}', () => {
    render(TagList, { tags: ['svelte'], max: 3 });
    expect(screen.getByRole('link', { name: '#svelte' })).toHaveAttribute(
      'href',
      '/blog/tag/svelte'
    );
  });

  it('uses max=3 as default', () => {
    render(TagList, { tags: ['a', 'b', 'c', 'd'] });
    expect(screen.queryByText('#d')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+1 more/i })).toBeInTheDocument();
  });
});
