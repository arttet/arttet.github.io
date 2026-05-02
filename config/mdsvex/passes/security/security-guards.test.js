import { describe, expect, it } from 'vitest';
import { createDiagnostics } from '../../engine/diagnostics.js';
import { markdownComponentRegistry } from '../../engine/registry.js';
import { validateMarkdownTree } from './security-guards.js';

/**
 * @param {import('../../engine/index.js').MarkdownMode} [mode]
 * @returns {import('../../engine/index.js').MarkdownPipelineContext}
 */
function createContext(mode = 'warn') {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}

/**
 * @param {string} value
 * @param {number} [line]
 * @param {number} [column]
 */
function htmlNode(value, line = 1, column = 1) {
  return {
    type: 'html',
    value,
    position: { start: { line, column } },
  };
}

/**
 * @param {import('./security-guards.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

describe('security guards pass', () => {
  it('reports unsafe raw HTML without changing warn-mode behavior', () => {
    const ctx = createContext();

    validateMarkdownTree(root([htmlNode('<SCRIPT>alert(1)</SCRIPT>')]), ctx, 'post.md');

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX003_RAW_HTML',
        severity: 'critical',
        file: 'post.md',
        line: 1,
        column: 1,
        message: expect.stringContaining('would be skipped in strict mode'),
      }),
    ]);
  });

  it('reports event handlers separated by a slash', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([htmlNode('<button/onclick=alert(1)>Click</button>')]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX004_UNSAFE_EVENT_HANDLER',
        message: expect.stringContaining('event handler'),
      }),
    ]);
  });

  it('reports unsafe urls in markdown links', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([
        {
          type: 'link',
          url: 'javascript:alert(1)',
          position: { start: { line: 2, column: 3 } },
        },
      ]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX002_UNSAFE_URL',
      }),
    ]);
  });

  it('reports unsafe urls within raw html tags', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([htmlNode('<a href="javascript:alert(1)">Click</a>')]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX002_UNSAFE_URL',
      }),
    ]);
  });

  it('allows safe URLs', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([
        { type: 'link', url: 'https://example.com' },
        { type: 'link', url: '/blog/post' },
        { type: 'link', url: './local' },
        { type: 'link', url: '../parent' },
        { type: 'link', url: 'mailto:test@example.com' },
      ]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports unknown markdown components', () => {
    const ctx = createContext();

    validateMarkdownTree(root([htmlNode('<ChartBlock value={1} />')]), ctx, 'post.md');

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX001_UNKNOWN_COMPONENT',
        message: expect.stringContaining('<ChartBlock>'),
      }),
    ]);
  });

  it('reports unknown props on registered markdown components', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([htmlNode('<MathCopy display={true} unsafe={true} />')]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX005_UNKNOWN_COMPONENT_PROP',
        message: expect.stringContaining('unsafe'),
      }),
    ]);
  });

  it('allows registered generated components with known props', () => {
    const ctx = createContext();

    validateMarkdownTree(
      root([
        htmlNode('<MathCopy display={true} b64Latex="abc" b64Html="def" />'),
        htmlNode('<StaticHtml html={`<p>safe generated output</p>`} />'),
        htmlNode('<KaTeXStyles />'),
      ]),
      ctx,
      'post.md'
    );

    expect(ctx.diagnostics.list()).toEqual([]);
  });
});
