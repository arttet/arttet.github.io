// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('$entities/post/api', () => ({
  getPosts: () => [
    { slug: 'one', tags: ['svelte', 'webgpu'] },
    { slug: 'two', tags: ['svelte'] },
    { slug: 'three', tags: ['testing'] },
  ],
}));

describe('blog tag page entries', () => {
  it('generates prerender entries for all unique tags', async () => {
    const { entries } = await import('./+page');

    expect(entries()).toEqual([{ tag: 'svelte' }, { tag: 'webgpu' }, { tag: 'testing' }]);
  });
});
