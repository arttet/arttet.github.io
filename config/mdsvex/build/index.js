import { SEVERITY } from "../constants.js";
import {
  createDiagnosticsReport,
  renderDiagnosticsMarkdown,
} from "../engine/diagnostics.js";
import {
  createGeneratedArtifacts,
  writeGeneratedArtifacts,
  generatedArtifactsDir,
} from "./artifacts.js";
import {
  filterValidPosts,
  validateCanonicalUniqueness,
  validateDuplicateSlugs,
} from "./filter.js";
import { createKnowledgeGraph } from "./knowledge-graph.js";
import { createContentManifest } from "./manifest.js";
import { scanPosts } from "./scan.js";

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
  const debug = process.env.MARKDOWN_DEBUG === "true";
  if (debug) {
    // oxlint-disable-next-line no-console
    console.log("[markdown-artifacts] Generating artifacts...");
  }

  const {
    posts,
    fileMap,
    diagnostics: scanDiagnostics,
  } = await scanPosts(build, config);
  for (const diagnostic of scanDiagnostics) {
    build.diagnostics.add(diagnostic);
  }
  validateDuplicateSlugs(posts, fileMap, build);
  validateCanonicalUniqueness(posts, fileMap, build);
  const diagnostics = build.diagnostics.list();
  const validPosts = filterValidPosts(posts, diagnostics, build.mode);
  const buildEpoch = process.env.SOURCE_DATE_EPOCH
    ? Number(process.env.SOURCE_DATE_EPOCH)
    : undefined;
  const manifest = createContentManifest(validPosts, { buildEpoch });
  const knowledgeGraph = createKnowledgeGraph(validPosts);
  const report = createDiagnosticsReport(diagnostics, {
    pipelineVersion: manifest.pipelineVersion,
  });

  if (debug) {
    const counts = report.summary;
    // oxlint-disable-next-line no-console
    console.log(
      `[markdown-artifacts] Posts: ${validPosts.length} (scanned: ${posts.length})`,
    );

    // oxlint-disable-next-line no-console
    console.log(
      `[markdown-artifacts] Diagnostics: ${counts.critical} critical, ${counts.error} error, ${counts.warning} warning, ${counts.info} info`,
    );

    /** @type {Record<string, string | undefined>} */
    const severityLabels = {
      [SEVERITY.CRITICAL]: "CRITICAL:",
      [SEVERITY.ERROR]:    "ERROR:   ",
      [SEVERITY.WARNING]:  "WARNING: ",
    };
    for (const d of diagnostics) {
      const label = severityLabels[d.severity];
      if (label) {
        // oxlint-disable-next-line no-console
        console.log(
          `[markdown-artifacts] ${label} ${d.code}: ${d.message} (${d.file ?? "no file"})`,
        );
      }
    }
  }

  const artifacts = createGeneratedArtifacts({
    manifest,
    diagnostics: report,
    knowledgeGraph,
  });

  await writeGeneratedArtifacts(artifacts);

  if (debug) {
    for (const a of artifacts) {
      // oxlint-disable-next-line no-console
      console.log(
        `[markdown-artifacts] Written: ${generatedArtifactsDir}/${a.path}`,
      );
    }

    if (diagnostics.length > 0) {
      // oxlint-disable-next-line no-console
      console.log("[markdown-artifacts] Full diagnostics report:");
      // oxlint-disable-next-line no-console
      console.log(renderDiagnosticsMarkdown(report));
    }
  }
}
