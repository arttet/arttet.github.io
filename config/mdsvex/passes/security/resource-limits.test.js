import { describe, expect, it } from 'vitest';
import { resourceLimitsPass } from './resource-limits.js';
import { createBuildContext } from '../../engine/context.js';
import { VALIDATION_MODE, RESOURCE_LIMITS } from '../../constants.js';

describe('resource limits pass', () => {
  /**
   * @param {any} tree
   * @param {import('../../constants.js').ValidationMode} [mode]
   */
  function runPass(tree, mode = VALIDATION_MODE.STRICT) {
    const build = createBuildContext(mode);
    const pass = resourceLimitsPass();
    const plugin = pass.mdsvex(build);
    // @ts-ignore — testing internal plugin structure
    const transformer = /** @type {Function} */ (plugin.remarkPlugins[0])();
    transformer(tree, { path: '/test.md' });
    return build.diagnostics.list();
  }

  it('adds no diagnostics for small trees', () => {
    const diagnostics = runPass({
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [] },
        { type: 'paragraph', children: [] },
      ],
    });
    expect(diagnostics).toHaveLength(0);
  });

  it('reports excessive heading depth', () => {
    const diagnostics = runPass({
      type: 'root',
      children: [{ type: 'heading', depth: RESOURCE_LIMITS.MAX_HEADING_DEPTH + 1, children: [] }],
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe('MDX203_RESOURCE_HEADING_DEPTH');
    expect(diagnostics[0].severity).toBe('critical');
    expect(diagnostics[0].pass).toBe('resource-limits');
  });

  it('reports too many images', () => {
    const children = Array.from({ length: RESOURCE_LIMITS.MAX_IMAGES + 1 }, () => ({
      type: 'image',
      url: 'x.png',
    }));
    const diagnostics = runPass({ type: 'root', children });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe('MDX204_RESOURCE_IMAGE_COUNT');
  });

  it('reports too many AST nodes', () => {
    const children = Array.from({ length: RESOURCE_LIMITS.MAX_AST_NODES + 1 }, (_, i) => ({
      type: 'paragraph',
      children: [{ type: 'text', value: String(i) }],
    }));
    const diagnostics = runPass({ type: 'root', children });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe('MDX202_RESOURCE_AST_NODES');
  });

  it('uses warning severity in warn mode', () => {
    const diagnostics = runPass(
      {
        type: 'root',
        children: [{ type: 'heading', depth: 10, children: [] }],
      },
      VALIDATION_MODE.WARN
    );
    expect(diagnostics[0].severity).toBe('warning');
    expect(diagnostics[0].message).toContain('would be skipped in strict mode');
  });
});
