import { describe, expect, it } from 'vitest';
import { createDiagnostics } from '../../diagnostics.js';
import { markdownComponentRegistry } from '../../registry.js';
import { validateFrontmatter } from './frontmatter.js';

/**
 * @param {import('../../engine.js').MarkdownMode} [mode]
 * @returns {import('../../engine.js').MarkdownPipelineContext}
 */
function createContext(mode = 'warn') {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}

describe('frontmatter validation', () => {
  it('passes with valid frontmatter', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, {
      title: 'Hello',
      tags: ['blog'],
      created: '2026-04-20',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports missing title', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, { tags: ['blog'], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('title'),
      }),
    ]);
  });

  it('reports empty title', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, { title: '  ', tags: ['blog'], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('title'),
      }),
    ]);
  });

  it('reports missing tags', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, { title: 'Hello', created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('tags'),
      }),
    ]);
  });

  it('reports empty tags array', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, { title: 'Hello', tags: [], created: '2026-04-20' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('tags'),
      }),
    ]);
  });

  it('reports invalid created date', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, { title: 'Hello', tags: ['blog'], created: '20-04-2026' }, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('created'),
      }),
    ]);
  });

  it('reports invalid updated date', () => {
    const ctx = createContext();
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
    const ctx = createContext();
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

  it('reports invalid summary type', () => {
    const ctx = createContext();
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
    const ctx = createContext();
    validateFrontmatter(ctx, undefined, 'post.md');
    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX010_INVALID_FRONTMATTER',
        message: expect.stringContaining('missing'),
      }),
    ]);
  });

  it('aggregates multiple errors', () => {
    const ctx = createContext();
    validateFrontmatter(ctx, {}, 'post.md');
    expect(ctx.diagnostics.list()).toHaveLength(3);
  });
});
