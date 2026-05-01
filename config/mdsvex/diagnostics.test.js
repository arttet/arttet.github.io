import { describe, expect, it } from 'vitest';
import { createDiagnostics } from './diagnostics.js';

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
});
