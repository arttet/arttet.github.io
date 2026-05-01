import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDiagnosticsReport } from './diagnostics.js';
import {
  createGeneratedArtifacts,
  generatedArtifactsDir,
  writeGeneratedArtifacts,
} from './generated-artifacts.js';
import { createKnowledgeGraph } from './knowledge-graph.js';
import { createContentManifest } from './manifest.js';

describe('generated markdown artifacts', () => {
  it('creates deterministic artifact payloads', () => {
    const artifacts = createGeneratedArtifacts(createInput());

    expect(generatedArtifactsDir).toBe('target/build/generated');
    expect(artifacts.map((artifact) => artifact.path)).toEqual([
      'content-manifest.json',
      'diagnostics.json',
      'diagnostics.md',
      'knowledge-graph.json',
    ]);
    expect(artifacts[0].content).toMatch(/"pipelineVersion": "sprint-7-manifest-v1"/);
    expect(artifacts[1].content).toMatch(/"summary": \{/);
    expect(artifacts[2].content).toContain('# Markdown Diagnostics');
    expect(artifacts[3].content).toMatch(/"version": "sprint-7-knowledge-graph-v1"/);
    expect(artifacts.every((artifact) => artifact.content.endsWith('\n'))).toBe(true);
  });

  it('writes artifacts to the configured output directory', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'markdown-artifacts-'));

    try {
      await writeGeneratedArtifacts(createGeneratedArtifacts(createInput()), { outputDir });

      await expect(readFile(join(outputDir, 'content-manifest.json'), 'utf8')).resolves.toContain(
        '"posts"'
      );
      await expect(readFile(join(outputDir, 'diagnostics.md'), 'utf8')).resolves.toContain(
        'Markdown Diagnostics'
      );
      await expect(readFile(join(outputDir, 'knowledge-graph.json'), 'utf8')).resolves.toContain(
        '"nodes"'
      );
    } finally {
      await rm(outputDir, { force: true, recursive: true });
    }
  });
});

function createInput() {
  const posts = [
    {
      slug: 'a',
      title: 'A',
      created: '2026-04-20',
      tags: ['blog'],
      readingTime: 1,
    },
  ];

  return {
    manifest: createContentManifest(posts),
    diagnostics: createDiagnosticsReport(
      [
        {
          code: 'MDX003_RAW_HTML',
          severity: 'critical',
          step: 'raw-html-guard',
          message: 'Raw HTML is blocked.',
          file: 'a.md',
          line: 1,
          column: 1,
        },
      ],
      { pipelineVersion: 'test-version' }
    ),
    knowledgeGraph: createKnowledgeGraph(posts),
  };
}
