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
});
