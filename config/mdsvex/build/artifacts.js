import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { ARTIFACTS } from '../constants.js';
import { renderDiagnosticsMarkdown } from '../engine/diagnostics.js';

export const generatedArtifactsDir = 'target/generated';

/**
 * @typedef {Object} GeneratedArtifact
 * @property {string} path
 * @property {string} content
 */

/**
 * @param {{
 *   manifest: import('./manifest.js').ContentManifest;
 *   diagnostics: import('../engine/diagnostics.js').DiagnosticsReport;
 *   knowledgeGraph: import('./knowledge-graph.js').KnowledgeGraph;
 * }} input
 * @returns {GeneratedArtifact[]}
 */
export function createGeneratedArtifacts(input) {
  return [
    {
      path: ARTIFACTS.MANIFEST,
      content: stableJson(input.manifest),
    },
    {
      path: ARTIFACTS.DIAG_JSON,
      content: stableJson(input.diagnostics),
    },
    {
      path: ARTIFACTS.DIAG_MD,
      content: renderDiagnosticsMarkdown(input.diagnostics),
    },
    {
      path: ARTIFACTS.GRAPH,
      content: stableJson(input.knowledgeGraph),
    },
  ];
}

/**
 * @param {GeneratedArtifact[]} artifacts
 * @param {{ outputDir?: string }=} options
 */
/**
 * @param {string} p
 * @returns {string}
 */
function toPosixPath(p) {
  return p.split(sep).join('/');
}

/**
 * @param {GeneratedArtifact[]} artifacts
 * @param {{ outputDir?: string }} [options]
 */
export async function writeGeneratedArtifacts(artifacts, options = {}) {
  const outputDir = options.outputDir ?? generatedArtifactsDir;

  for (const artifact of artifacts) {
    const outputPath = toPosixPath(join(outputDir, artifact.path));
    // Writes are intentionally sequential for deterministic filesystem traces.
    // oxlint-disable-next-line no-await-in-loop
    await mkdir(dirname(outputPath), { recursive: true });
    // oxlint-disable-next-line no-await-in-loop
    await writeFile(outputPath, artifact.content, 'utf8');
  }
}

/**
 * @param {unknown} value
 */
function stableJson(value) {
  return `${JSON.stringify(value, sortReplacer, 2)}\n`;
}

/**
 * @param {string} _key
 * @param {unknown} value
 */
function sortReplacer(_key, value) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b))
    );
  }
  return value;
}
