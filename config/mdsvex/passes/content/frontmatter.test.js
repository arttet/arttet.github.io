import { describe, expect, it } from 'vitest';
import { createBuildContext } from '../../engine/context.js';
import { validateFrontmatter } from './frontmatter.js';

/**
 * @param {import('../../engine/context.js').MarkdownMode} [mode]
 * @returns {import('../../engine/context.js').BuildContext}
 */
function createTestContext(mode = 'warn') {
  return createBuildContext(mode);
}

describe('frontmatter validation', () => {
  it('passes with valid frontmatter', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, {
      title: 'Hello',
      tags: ['blog'],
      created: '2026-04-20',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('accepts ISO datetime strings from YAML date parsing', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, {
      title: 'Hello',
      tags: ['blog'],
      created: '2026-04-20T00:00:00.000Z',
      updated: '2026-04-21T00:00:00.000Z',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports missing title', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, { tags: ['blog'], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('title'),
      }),
    ]);
  });

  it('reports empty title', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, { title: '  ', tags: ['blog'], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('title'),
      }),
    ]);
  });

  it('reports empty tags array', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, { title: 'Hello', tags: [], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('tags'),
      }),
    ]);
  });

  it('reports invalid created date', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, { title: 'Hello', tags: ['blog'], created: '20-04-2026' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('created'),
      }),
    ]);
  });

  it('reports invalid updated date', () => {
    const ctx = createTestContext();
    validateFrontmatter(
      ctx,
      { title: 'Hello', tags: ['blog'], created: '2026-04-20', updated: 'tomorrow' },
      'post.md'
    );
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('updated'),
      }),
    ]);
  });

  it('reports invalid draft type', () => {
    const ctx = createTestContext();
    validateFrontmatter(
      ctx,
      { title: 'Hello', tags: ['blog'], created: '2026-04-20', draft: 'yes' },
      'post.md'
    );
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('draft'),
      }),
    ]);
  });

  it('reports invalid description type', () => {
    const ctx = createTestContext();
    validateFrontmatter(
      ctx,
      { title: 'Hello', tags: ['blog'], created: '2026-04-20', description: 42 },
      'post.md'
    );
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('description'),
      }),
    ]);
  });

  it('reports invalid canonical type', () => {
    const ctx = createTestContext();
    validateFrontmatter(
      ctx,
      { title: 'Hello', tags: ['blog'], created: '2026-04-20', canonical: 42 },
      'post.md'
    );
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('canonical'),
      }),
    ]);
  });

  it('reports invalid summary type', () => {
    const ctx = createTestContext();
    validateFrontmatter(
      ctx,
      { title: 'Hello', tags: ['blog'], created: '2026-04-20', summary: 42 },
      'post.md'
    );
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('summary'),
      }),
    ]);
  });

  it('reports missing frontmatter object', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, undefined, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('missing'),
      }),
    ]);
  });

  it('aggregates multiple errors', () => {
    const ctx = createTestContext();
    validateFrontmatter(ctx, {}, 'post.md');
    expect(ctx.diagnostics.list()).toHaveLength(2);
  });

  it('uses warning severity in warn mode', () => {
    const ctx = createTestContext('warn');
    validateFrontmatter(ctx, {}, 'post.md');
    expect(ctx.diagnostics.list()[0].severity).toBe('warning');
  });

  it('uses critical severity in strict mode', () => {
    const ctx = createTestContext('strict');
    validateFrontmatter(ctx, {}, 'post.md');
    expect(ctx.diagnostics.list()[0].severity).toBe('critical');
  });
});
