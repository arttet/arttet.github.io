// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const mockReadFileSync = vi.fn((..._args: any[]) => '{"pipelineVersion":"v1","posts":[]}');
vi.mock('node:fs', () => ({
  readFileSync: (..._args: any[]) => mockReadFileSync(..._args),
}));

describe('manifest loader', () => {
  it('returns posts from the manifest', async () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        pipelineVersion: 'v1',
        posts: [
          {
            slug: 'hello-world',
            frontmatter: { title: 'Hello World', created: '2024-01-15' },
            flags: {},
            extracted: {},
          },
        ],
      })
    );

    const { getManifestPosts } = await import('./manifest');
    const posts = getManifestPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('hello-world');
    expect(posts[0].frontmatter.title).toBe('Hello World');
  });
});
