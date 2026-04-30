const severityRank = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
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
 * @param {Diagnostic[]} diagnostics
 * @returns {Diagnostic[]}
 */
function sortDiagnostics(diagnostics) {
  return diagnostics.toSorted((a, b) => {
    const file = (a.file ?? '').localeCompare(b.file ?? '');
    if (file !== 0) return file;

    const line = (a.line ?? 0) - (b.line ?? 0);
    if (line !== 0) return line;

    const column = (a.column ?? 0) - (b.column ?? 0);
    if (column !== 0) return column;

    const severity = severityRank[b.severity] - severityRank[a.severity];
    if (severity !== 0) return severity;

    return a.code.localeCompare(b.code);
  });
}

/**
 * @param {Diagnostic[]} diagnostics
 */
export function createDiagnostics(diagnostics = []) {
  return {
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
  };
}
