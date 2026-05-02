import { describe, expect, it } from 'vitest';
import { createContentManifest, pipelineVersion } from './manifest.js';

describe('content manifest', () => {
  it('creates deterministic post entries with feature flags', () => {
    const manifest = createContentManifest([
      {
        slug: 'b',
        title: 'B',
        created: '2026-04-20',
        tags: ['svelte', 'blog'],
        readingTime: 2,
      },
      {
        slug: 'a',
        title: 'A',
        summary: 'Summary',
        created: '2026-04-21',
        updated: '2026-04-22',
        tags: ['z', 'a'],
        readingTime: 1,
        hasMath: true,
        hasCode: true,
        hasImages: true,
      },
    ]);

    expect(manifest.pipelineVersion).toBe(pipelineVersion);
    expect(manifest.posts.map((post) => post.slug)).toEqual(['a', 'b']);
    expect(manifest.posts[0]).toEqual({
      slug: 'a',
      title: 'A',
      summary: 'Summary',
      created: '2026-04-21',
      updated: '2026-04-22',
      tags: ['a', 'z'],
      readingTime: 1,
      metadataHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      features: {
        hasMath: true,
        hasMermaid: false,
        hasCode: true,
        hasCodeTabs: false,
        hasImages: true,
        hasOptimizedImages: false,
        hasPriorityImage: false,
        hasImageLightbox: false,
        hasInteractiveBlocks: false,
      },
      assets: [],
    });
    expect(manifest.posts[1].features).toEqual({
      hasMath: false,
      hasMermaid: false,
      hasCode: false,
      hasCodeTabs: false,
      hasImages: false,
      hasOptimizedImages: false,
      hasPriorityImage: false,
      hasImageLightbox: false,
      hasInteractiveBlocks: false,
    });
  });

  it('sorts same-day posts by slug', () => {
    const manifest = createContentManifest([
      {
        slug: 'z',
        title: 'Z',
        created: '2026-04-20',
        tags: [],
        readingTime: 1,
      },
      {
        slug: 'a',
        title: 'A',
        created: '2026-04-20',
        tags: [],
        readingTime: 1,
      },
    ]);

    expect(manifest.posts.map((post) => post.slug)).toEqual(['a', 'z']);
  });

  it('changes metadata hash when manifest-relevant metadata changes', () => {
    const [first] = createContentManifest([
      {
        slug: 'a',
        title: 'A',
        created: '2026-04-20',
        tags: ['x'],
        readingTime: 1,
      },
    ]).posts;
    const [second] = createContentManifest([
      {
        slug: 'a',
        title: 'Changed',
        created: '2026-04-20',
        tags: ['x'],
        readingTime: 1,
      },
    ]).posts;

    expect(first.metadataHash).not.toBe(second.metadataHash);
  });
});
