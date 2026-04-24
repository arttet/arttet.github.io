// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { resolvePostsFromEntries } from './api';

describe('resolvePostsFromEntries', () => {
  it('normalizes, sorts, and filters content entries', () => {
    const reportIssue = vi.fn();
    const entries = [
      [
        '/src/content/blog/2026/2026-04-10-zeta.md',
        {
          title: 'Zeta',
          created: '2026-04-10',
          tags: ['testing'],
          readingTime: 4,
        },
      ],
      [
        '/src/content/blog/2026/2026-04-11-alpha.md',
        {
          title: 'Alpha',
          created: '2026-04-11',
          tags: ['svelte'],
          readingTime: 2,
        },
      ],
      [
        '/src/content/blog/2026/2026-04-09-draft.md',
        {
          title: 'Draft',
          created: '2026-04-09',
          tags: ['draft'],
          readingTime: 1,
          draft: true,
        },
      ],
      [
        '/src/content/blog/2026/2026-04-08-invalid.md',
        {
          title: '',
          created: 'not-a-date',
          tags: 'broken',
          readingTime: Number.NaN,
        },
      ],
    ] as unknown as Parameters<typeof resolvePostsFromEntries>[0];

    const posts = resolvePostsFromEntries(entries, reportIssue);

    expect(posts.map((post) => post.slug)).toEqual(['2026-04-11-alpha', '2026-04-10-zeta']);
    expect(posts.every((post) => !post.draft)).toBe(true);
    expect(reportIssue).toHaveBeenCalledWith(
      expect.stringContaining(
        'Skipping invalid post "/src/content/blog/2026/2026-04-08-invalid.md"'
      )
    );
  });

  it('reports duplicate slugs after normalization', () => {
    const reportIssue = vi.fn();

    const posts = resolvePostsFromEntries(
      [
        [
          '/src/content/blog/2026/2026-04-12-duplicate.md',
          {
            title: 'First duplicate',
            created: '2026-04-12',
            tags: ['blog'],
            readingTime: 2,
          },
        ],
        [
          '/src/content/blog/archive/2026-04-12-duplicate.md',
          {
            title: 'Second duplicate',
            created: '2026-04-11',
            tags: ['blog'],
            readingTime: 3,
          },
        ],
      ],
      reportIssue
    );

    expect(posts).toHaveLength(2);
    expect(reportIssue).toHaveBeenCalledWith(
      '[content] Duplicate post slug detected: "2026-04-12-duplicate"'
    );
  });
});
