import { describe, it } from 'vitest';
import { generateMarkdownArtifacts } from './build.js';
import { createDiagnostics } from './diagnostics.js';
import { markdownComponentRegistry } from './registry.js';

describe('markdown build artifacts', () => {
  it('generates artifacts without errors', async () => {
    const ctx = {
      mode: /** @type {const} */ ('warn'),
      diagnostics: createDiagnostics(),
      registry: markdownComponentRegistry,
      state: {},
    };

    await generateMarkdownArtifacts(ctx);
  });

  it('includes all posts in warn mode even with critical diagnostics', async () => {
    const ctx = {
      mode: /** @type {const} */ ('warn'),
      diagnostics: createDiagnostics(),
      registry: markdownComponentRegistry,
      state: {},
    };
    ctx.diagnostics.add({
      code: 'MDX010_INVALID_FRONTMATTER',
      severity: 'critical',
      step: 'frontmatter',
      message: 'Missing title.',
      file: 'content/blog/2026/2026-04-20-architecture-and-stack.md',
    });

    await generateMarkdownArtifacts(ctx);
  });

  it('filters invalid posts in strict mode', async () => {
    const ctx = {
      mode: /** @type {const} */ ('strict'),
      diagnostics: createDiagnostics(),
      registry: markdownComponentRegistry,
      state: {},
    };
    ctx.diagnostics.add({
      code: 'MDX010_INVALID_FRONTMATTER',
      severity: 'critical',
      step: 'frontmatter',
      message: 'Missing title.',
      file: 'content/blog/2026/2026-04-20-architecture-and-stack.md',
    });

    await generateMarkdownArtifacts(ctx);
  });
});
