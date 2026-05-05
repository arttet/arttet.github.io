import { describe, expect, it } from 'vitest';
import { scanPosts, normalizeFrontmatter } from './scan.js';
import { createBuildContext } from '../engine/context.js';
import { contentPasses, optimizationPasses, securityPasses } from '../engine/pass-groups.js';
import { createMarkdownEngine } from '../engine/index.js';

describe('normalizeFrontmatter', () => {
  it('converts Date created to YYYY-MM-DD', () => {
    const result = normalizeFrontmatter({
      title: 'T',
      created: new Date('2026-05-05T00:00:00.000Z'),
    });
    expect(result.created).toBe('2026-05-05');
  });

  it('converts Date updated to YYYY-MM-DD', () => {
    const result = normalizeFrontmatter({
      title: 'T',
      created: '2026-01-01',
      updated: new Date('2026-05-05T12:34:56.789Z'),
    });
    expect(result.updated).toBe('2026-05-05');
  });

  it('leaves string dates untouched', () => {
    const result = normalizeFrontmatter({
      title: 'T',
      created: '2026-01-01',
    });
    expect(result.created).toBe('2026-01-01');
  });

  it('returns a copy without mutating input', () => {
    const input = { title: 'T', created: '2026-01-01' };
    const result = normalizeFrontmatter(input);
    expect(result).not.toBe(input);
  });
});

describe('scanPosts', () => {
  it('discovers real posts from content/blog', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    const result = await scanPosts(build, config);
    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.fileMap.size).toBeGreaterThan(0);
  });

  it('sorts posts by created descending', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    const result = await scanPosts(build, config);
    for (let i = 1; i < result.posts.length; i++) {
      expect(result.posts[i - 1].created >= result.posts[i].created).toBe(true);
    }
  });

  it('does not include draft posts', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    const result = await scanPosts(build, config);
    expect(result.posts.some((p) => p.draft)).toBe(false);
  });

  it('tolerates computed frontmatter fields without false positives', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    const result = await scanPosts(build, config);
    const invalidFrontmatter = result.diagnostics.filter(
      (d) => d.code === 'MDX010_INVALID_FRONTMATTER',
    );
    expect(invalidFrontmatter).toHaveLength(0);
  });

  it('uses cache on second scan', async () => {
    const engine = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    const build1 = createBuildContext('warn');
    const result1 = await scanPosts(build1, engine.config);

    const build2 = createBuildContext('warn');
    const result2 = await scanPosts(build2, engine.config);

    expect(result2.posts.length).toBe(result1.posts.length);
  });
});
