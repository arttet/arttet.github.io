import { SEVERITY } from '../constants.js';
import { cwd } from 'node:process';

const severityRank = {
  [SEVERITY.INFO]: 0,
  [SEVERITY.WARNING]: 1,
  [SEVERITY.ERROR]: 2,
  [SEVERITY.CRITICAL]: 3,
};

/**
 * @typedef {'info' | 'warning' | 'error' | 'critical'} DiagnosticSeverity
 */

/**
 * @typedef {Object} Diagnostic
 * @property {string} code
 * @property {DiagnosticSeverity} severity
 * @property {string} step
 * @property {string} message
 * @property {string=} file
 * @property {number=} line
 * @property {number=} column
 */

/**
 * @typedef {Object} DiagnosticsSummary
 * @property {number} info
 * @property {number} warning
 * @property {number} error
 * @property {number} critical
 */

/**
 * @typedef {Object} DiagnosticsReport
 * @property {string} pipelineVersion
 * @property {DiagnosticsSummary} summary
 * @property {Diagnostic[]} diagnostics
 */

/**
 * @param {Diagnostic[]} diagnostics
 * @returns {Diagnostic[]}
 */
function sortDiagnostics(diagnostics) {
  return diagnostics.toSorted((a, b) => {
    const file = (a.file ?? '').localeCompare(b.file ?? '');
    if (file !== 0) {
      return file;
    }

    const line = (a.line ?? 0) - (b.line ?? 0);
    if (line !== 0) {
      return line;
    }

    const column = (a.column ?? 0) - (b.column ?? 0);
    if (column !== 0) {
      return column;
    }

    const severity = severityRank[b.severity] - severityRank[a.severity];
    if (severity !== 0) {
      return severity;
    }

    return a.code.localeCompare(b.code);
  });
}

/**
 * @param {Diagnostic[]} diagnostics
 */
export function createDiagnostics(diagnostics = []) {
  return Object.freeze({
    /**
     * @param {Diagnostic} diagnostic
     */
    add(diagnostic) {
      diagnostics.push(diagnostic);
    },

    /**
     * @returns {Diagnostic[]}
     */
    list() {
      return sortDiagnostics(diagnostics);
    },

    /**
     * @param {DiagnosticSeverity} severity
     * @returns {boolean}
     */
    has(severity) {
      return diagnostics.some((d) => d.severity === severity);
    },
  });
}

/**
 * @param {Diagnostic[]} diagnostics
 * @param {{ pipelineVersion: string }} options
 * @returns {DiagnosticsReport}
 */
export function createDiagnosticsReport(diagnostics, options) {
  const sorted = sortDiagnostics(diagnostics);

  return {
    pipelineVersion: options.pipelineVersion,
    summary: summarizeDiagnostics(sorted),
    diagnostics: sorted,
  };
}

/**
 * @param {DiagnosticsReport} report
 * @returns {string}
 */
export function renderDiagnosticsMarkdown(report) {
  const lines = [
    '# Markdown Diagnostics',
    '',
    `Pipeline version: \`${report.pipelineVersion}\``,
    '',
    '## Summary',
    '',
    `- Critical: ${report.summary.critical}`,
    `- Error: ${report.summary.error}`,
    `- Warning: ${report.summary.warning}`,
    `- Info: ${report.summary.info}`,
    '',
    '## Diagnostics',
    '',
  ];

  if (report.diagnostics.length === 0) {
    lines.push('No diagnostics.');
    return `${lines.join('\n')}\n`;
  }

  for (const diagnostic of report.diagnostics) {
    lines.push(
      `- ${formatDiagnosticLocation(diagnostic)} ${diagnostic.severity.toUpperCase()} ${diagnostic.code} [${diagnostic.step}]: ${diagnostic.message}`
    );
  }

  return `${lines.join('\n')}\n`;
}

/**
 * @param {Diagnostic[]} diagnostics
 * @returns {DiagnosticsSummary}
 */
function summarizeDiagnostics(diagnostics) {
  const summary = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };

  for (const diagnostic of diagnostics) {
    summary[diagnostic.severity] += 1;
  }

  return summary;
}

/**
 * @param {Diagnostic} diagnostic
 * @returns {string}
 */
const CWD = cwd();

/**
 * @param {string | undefined} file
 */
function scrubPath(file) {
  if (!file) {
    return '<unknown>';
  }
  if (file.startsWith(CWD)) {
    return file.slice(CWD.length + 1);
  }
  return file;
}

/**
 * @param {Diagnostic} diagnostic
 */
function formatDiagnosticLocation(diagnostic) {
  const file = scrubPath(diagnostic.file);
  const line = diagnostic.line ?? 1;
  const column = diagnostic.column ?? 1;

  return `${file}:${line}:${column}`;
}
