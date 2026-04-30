import { describe, expect, it } from 'vitest';
import { createMarkdownEngine } from './engine.js';

describe('markdown engine', () => {
  it('registers steps and merges mdsvex options in dependency order', async () => {
    const config = await createMarkdownEngine()
      .use({
        name: 'base',
        phase: 'remark',
        mdsvex: () => ({ remarkPlugins: [() => undefined] }),
      })
      .use({
        name: 'child',
        phase: 'rehype',
        requires: ['base'],
        mdsvex: () => ({ rehypePlugins: [() => undefined] }),
      })
      .toMdsvexConfig();

    expect(config.extensions).toEqual(['.md']);
    expect(config.remarkPlugins).toHaveLength(1);
    expect(config.rehypePlugins).toHaveLength(1);
  });

  it('rejects duplicate steps', async () => {
    await expect(
      createMarkdownEngine()
        .use({ name: 'same', phase: 'remark' })
        .use({ name: 'same', phase: 'rehype' })
        .toMdsvexConfig()
    ).rejects.toThrow('Duplicate markdown step registered: same');
  });

  it('rejects missing dependencies', async () => {
    await expect(
      createMarkdownEngine()
        .use({ name: 'child', phase: 'remark', requires: ['missing'] })
        .toMdsvexConfig()
    ).rejects.toThrow('requires missing step "missing"');
  });

  it('rejects dependency cycles', async () => {
    await expect(
      createMarkdownEngine()
        .use({ name: 'a', phase: 'remark', requires: ['b'] })
        .use({ name: 'b', phase: 'remark', requires: ['a'] })
        .toMdsvexConfig()
    ).rejects.toThrow('dependency cycle');
  });

  it('rejects multiple highlighter definitions', async () => {
    await expect(
      createMarkdownEngine()
        .use({
          name: 'code-a',
          phase: 'rehype',
          mdsvex: () => ({ highlight: { highlighter: () => '' } }),
        })
        .use({
          name: 'code-b',
          phase: 'rehype',
          mdsvex: () => ({ highlight: { highlighter: () => '' } }),
        })
        .toMdsvexConfig()
    ).rejects.toThrow('Multiple markdown steps attempted to define a highlighter');
  });
});
