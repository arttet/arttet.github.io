import { createDiagnosticsReport } from '../engine/diagnostics.js';
import { createGeneratedArtifacts, writeGeneratedArtifacts } from './artifacts.js';
import { filterValidPosts, validateDuplicateSlugs } from './filter.js';
import { createKnowledgeGraph } from './knowledge-graph.js';
import { createContentManifest } from './manifest.js';
import { scanPosts } from './scan.js';

/**
 * Orchestrate the build-time markdown pipeline:
 *   scan → filter (slug guard) → manifest → knowledge-graph → diagnostics → write artifacts.
 *
 * Pure-functional except for the final filesystem write at the end.
 *
 * @param {import('../engine/index.js').MarkdownPipelineContext} ctx
 */
export async function generateMarkdownArtifacts(ctx) {
  const { posts, fileMap } = await scanPosts();
  validateDuplicateSlugs(posts, ctx, fileMap);
  const diagnostics = ctx.diagnostics.list();
  const validPosts = filterValidPosts(posts, diagnostics, ctx.mode);
  const manifest = createContentManifest(validPosts);
  const knowledgeGraph = createKnowledgeGraph(validPosts);
  const report = createDiagnosticsReport(diagnostics, {
    pipelineVersion: manifest.pipelineVersion,
  });

  const artifacts = createGeneratedArtifacts({ manifest, diagnostics: report, knowledgeGraph });
  await writeGeneratedArtifacts(artifacts);
}
