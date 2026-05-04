import { createDiagnosticsReport } from '../engine/diagnostics.js';
import { createGeneratedArtifacts, writeGeneratedArtifacts } from './artifacts.js';
import { filterValidPosts, validateCanonicalUniqueness, validateDuplicateSlugs } from './filter.js';
import { createKnowledgeGraph } from './knowledge-graph.js';
import { createContentManifest } from './manifest.js';
import { scanPosts } from './scan.js';

/**
 * Orchestrate the build-time markdown pipeline:
 *   scan → filter (slug guard) → manifest → knowledge-graph → diagnostics → write artifacts.
 *
 * Pure-functional except for the final filesystem write at the end.
 *
 * @param {import('../engine/context.js').BuildContext} build
 * @param {import('mdsvex').MdsvexOptions} config
 */
export async function generateMarkdownArtifacts(build, config) {
  const { posts, fileMap, diagnostics: scanDiagnostics } = await scanPosts(build, config);
  for (const diagnostic of scanDiagnostics) {
    build.diagnostics.add(diagnostic);
  }
  validateDuplicateSlugs(posts, fileMap, build);
  validateCanonicalUniqueness(posts, fileMap, build);
  const diagnostics = build.diagnostics.list();
  const validPosts = filterValidPosts(posts, diagnostics, build.mode);
  const buildEpoch = process.env.SOURCE_DATE_EPOCH ? Number(process.env.SOURCE_DATE_EPOCH) : undefined;
  const manifest = createContentManifest(validPosts, { buildEpoch });
  const knowledgeGraph = createKnowledgeGraph(validPosts);
  const report = createDiagnosticsReport(diagnostics, {
    pipelineVersion: manifest.pipelineVersion,
  });

  const artifacts = createGeneratedArtifacts({ manifest, diagnostics: report, knowledgeGraph });
  await writeGeneratedArtifacts(artifacts);
}
