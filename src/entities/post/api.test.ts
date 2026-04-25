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

  it('uses default logContentIssue without throwing', () => {
    const originalWrite = process.stderr.write;
    const writeMock = vi.fn();
    process.stderr.write = writeMock as any;

    try {
      resolvePostsFromEntries([['invalid.md', undefined]]);
      expect(writeMock).toHaveBeenCalledWith(
        expect.stringContaining('[content] Skipping invalid post "invalid.md": metadata is missing')
      );
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  it('reports missing metadata', () => {
    const reportIssue = vi.fn();
    resolvePostsFromEntries([['missing.md', undefined]], reportIssue);
    expect(reportIssue).toHaveBeenCalledWith(
      expect.stringContaining('Skipping invalid post "missing.md": metadata is missing')
    );
  });

  it('reports invalid updated date', () => {
    const reportIssue = vi.fn();
    resolvePostsFromEntries(
      [
        [
          'bad-updated.md',
          {
            title: 'Test',
            created: '2026-04-12',
            tags: ['test'],
            readingTime: 2,
            updated: 'invalid-date',
          } as any,
        ],
      ],
      reportIssue
    );
    expect(reportIssue).toHaveBeenCalledWith(
      expect.stringContaining('updated must be a valid ISO date string when provided')
    );
  });
});
