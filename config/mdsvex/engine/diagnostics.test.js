import { describe, expect, it } from 'vitest';
import {
  createDiagnostics,
  createDiagnosticsReport,
  renderDiagnosticsMarkdown,
} from './diagnostics.js';

describe('markdown diagnostics', () => {
  it('returns diagnostics in stable order', () => {
    const diagnostics = createDiagnostics();

    diagnostics.add({
      code: 'MDX003_RAW_HTML',
      severity: 'critical',
      step: 'raw-html-guard',
      message: 'Raw HTML is blocked.',
      file: 'b.md',
    });
    diagnostics.add({
      code: 'MDX001_UNKNOWN_COMPONENT',
      severity: 'warning',
      step: 'component-guard',
      message: 'Unknown component.',
      file: 'a.md',
      line: 2,
    });
    diagnostics.add({
      code: 'MDX001_UNKNOWN_COMPONENT',
      severity: 'info',
      step: 'component-guard',
      message: 'Unknown component.',
      file: 'a.md',
      line: 1,
    });

    expect(
      diagnostics
        .list()
        .map((diagnostic) => [
          diagnostic.file,
          diagnostic.line,
          diagnostic.severity,
          diagnostic.code,
        ])
    ).toEqual([
      ['a.md', 1, 'info', 'MDX001_UNKNOWN_COMPONENT'],
      ['a.md', 2, 'warning', 'MDX001_UNKNOWN_COMPONENT'],
      ['b.md', undefined, 'critical', 'MDX003_RAW_HTML'],
    ]);
  });

  it('uses severity as descending tie-breaker for the same location', () => {
    const diagnostics = createDiagnostics();

    diagnostics.add({
      code: 'MDX001_UNKNOWN_COMPONENT',
      severity: 'info',
      step: 'component-guard',
      message: 'Unknown component.',
      file: 'a.md',
      line: 1,
      column: 1,
    });
    diagnostics.add({
      code: 'MDX003_RAW_HTML',
      severity: 'critical',
      step: 'raw-html-guard',
      message: 'Raw HTML is blocked.',
      file: 'a.md',
      line: 1,
      column: 1,
    });

    expect(diagnostics.list().map((diagnostic) => diagnostic.severity)).toEqual([
      'critical',
      'info',
    ]);
  });

  it('creates a deterministic diagnostics report', () => {
    const report = createDiagnosticsReport(
      [
        {
          code: 'MDX004_IMAGE_MISSING_ALT',
          severity: 'warning',
          step: 'image-guard',
          message: 'Image alt text is required.',
          file: 'post.md',
          line: 8,
          column: 3,
        },
        {
          code: 'MDX003_RAW_HTML',
          severity: 'critical',
          step: 'raw-html-guard',
          message: 'Raw HTML is blocked.',
          file: 'post.md',
          line: 2,
          column: 1,
        },
      ],
      { pipelineVersion: 'test-version' }
    );

    expect(report).toEqual({
      pipelineVersion: 'test-version',
      summary: {
        info: 0,
        warning: 1,
        error: 0,
        critical: 1,
      },
      diagnostics: [
        {
          code: 'MDX003_RAW_HTML',
          severity: 'critical',
          step: 'raw-html-guard',
          message: 'Raw HTML is blocked.',
          file: 'post.md',
          line: 2,
          column: 1,
        },
        {
          code: 'MDX004_IMAGE_MISSING_ALT',
          severity: 'warning',
          step: 'image-guard',
          message: 'Image alt text is required.',
          file: 'post.md',
          line: 8,
          column: 3,
        },
      ],
    });
  });

  it('renders diagnostics markdown', () => {
    const markdown = renderDiagnosticsMarkdown({
      pipelineVersion: 'test-version',
      summary: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 1,
      },
      diagnostics: [
        {
          code: 'MDX003_RAW_HTML',
          severity: 'critical',
          step: 'raw-html-guard',
          message: 'Raw HTML is blocked.',
          file: 'post.md',
          line: 2,
          column: 1,
        },
      ],
    });

    expect(markdown).toContain('Pipeline version: `test-version`');
    expect(markdown).toContain('post.md:2:1 CRITICAL MDX003_RAW_HTML');
  });

  it('renders an empty diagnostics markdown report', () => {
    expect(
      renderDiagnosticsMarkdown({
        pipelineVersion: 'test-version',
        summary: {
          info: 0,
          warning: 0,
          error: 0,
          critical: 0,
        },
        diagnostics: [],
      })
    ).toContain('No diagnostics.');
  });
});
