import { describe, expect, it, vi } from 'vitest';
import { generateMarkdownArtifacts } from './index.js';
import { createBuildContext } from '../engine/context.js';
import { contentPasses, optimizationPasses, securityPasses } from '../engine/pass-groups.js';
import { createMarkdownEngine } from '../engine/index.js';

describe('markdown build artifacts', () => {
  it('generates artifacts without errors', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();

    await generateMarkdownArtifacts(build, config);
  });

  it('includes all posts in warn mode even with critical diagnostics', async () => {
    const build = createBuildContext('warn');
    const { config } = await createMarkdownEngine({ mode: 'warn' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();
    build.diagnostics.add({
      code: 'MDX010_INVALID_FRONTMATTER',
      severity: 'critical',
      pass: 'frontmatter',
      message: 'Missing title.',
      file: 'content/blog/2026/2026-04-20-architecture-and-stack.md',
    });

    await generateMarkdownArtifacts(build, config);
  });

  it('filters invalid posts in strict mode', async () => {
    const build = createBuildContext('strict');
    const { config } = await createMarkdownEngine({ mode: 'strict' })
      .use(contentPasses())
      .use(securityPasses())
      .use(optimizationPasses())
      .toMdsvexConfig();
    build.diagnostics.add({
      code: 'MDX010_INVALID_FRONTMATTER',
      severity: 'critical',
      pass: 'frontmatter',
      message: 'Missing title.',
      file: 'content/blog/2026/2026-04-20-architecture-and-stack.md',
    });

    await generateMarkdownArtifacts(build, config);
  });

  it('logs diagnostics when MARKDOWN_DEBUG is true', async () => {
    const originalEnv = process.env.MARKDOWN_DEBUG;
    process.env.MARKDOWN_DEBUG = 'true';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const build = createBuildContext('warn');
      const { config } = await createMarkdownEngine({ mode: 'warn' })
        .use(contentPasses())
        .use(securityPasses())
        .use(optimizationPasses())
        .toMdsvexConfig();

      await generateMarkdownArtifacts(build, config);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[markdown-artifacts] Generating artifacts...'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[markdown-artifacts] Posts:'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[markdown-artifacts] Diagnostics:'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[markdown-artifacts] Written:'));
    } finally {
      process.env.MARKDOWN_DEBUG = originalEnv;
      logSpy.mockRestore();
    }
  });

  it('logs per-diagnostic details and full report when MARKDOWN_DEBUG is true with diagnostics', async () => {
    const originalEnv = process.env.MARKDOWN_DEBUG;
    process.env.MARKDOWN_DEBUG = 'true';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const build = createBuildContext('warn');
      const { config } = await createMarkdownEngine({ mode: 'warn' })
        .use(contentPasses())
        .use(securityPasses())
        .use(optimizationPasses())
        .toMdsvexConfig();
      build.diagnostics.add({
        code: 'MDX010_INVALID_FRONTMATTER',
        severity: 'warning',
        pass: 'frontmatter',
        message: 'Missing title.',
        file: 'content/blog/2026/2026-04-20-architecture-and-stack.md',
      });

      await generateMarkdownArtifacts(build, config);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[markdown-artifacts] WARNING:'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Full diagnostics report:'));
    } finally {
      process.env.MARKDOWN_DEBUG = originalEnv;
      logSpy.mockRestore();
    }
  });
});
