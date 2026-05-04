import { DIAGNOSTIC_CODES, PASS_PHASES, SEVERITY, VALIDATION_MODE } from '../../constants.js';
import { resolvePassContext } from '../../engine/context.js';

import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
 */

/**
 * @returns {import('../../engine/index.js').MarkdownPass}
 */
export function headingsPass() {
  return {
    name: 'headings',
    phase: PASS_PHASES.VALIDATE,
    mdsvex(build) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createHeadingsRemarkPlugin(build),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine/context.js').BuildContext} build
 */
function createHeadingsRemarkPlugin(build) {
  return function headingsAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ path?: string; history?: string[] }} file
     */
    return function headingsTransformer(tree, file) {
      const headings = collectHeadings(tree);
      const filePath = file.path ?? file.history?.[0];
      const ctx = resolvePassContext(build, filePath);
      validateHeadingHierarchy(ctx, headings, filePath);
      validateDuplicateHeadings(ctx, tree, filePath);
    };
  };
}

/**
 * @param {MarkdownNode} node
 * @param {{ depth: number; position: { line: number; column: number } }[]} [acc]
 * @returns {{ depth: number; position: { line: number; column: number } }[]}
 */
function collectHeadings(node, acc = []) {
  if (node.type === 'heading' && typeof node.depth === 'number' && node.position) {
    acc.push({
      depth: node.depth,
      position: { line: node.position.start.line, column: node.position.start.column },
    });
  }
  for (const child of node.children ?? []) {
    collectHeadings(child, acc);
  }
  return acc;
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {{ depth: number; position: { line: number; column: number } }[]} headings
 * @param {string=} file
 */
function validateHeadingHierarchy(ctx, headings, file) {
  let h1Count = 0;
  let previousDepth = 0;

  for (const heading of headings) {
    if (heading.depth === 1) {
      h1Count += 1;
      if (h1Count > 1) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.MULTIPLE_H1,
          message: 'Multiple h1 headings are not allowed.',
          file,
          position: heading.position,
        });
      }
    }

    if (previousDepth > 0 && heading.depth > previousDepth + 1) {
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.HEADING_HIERARCHY_SKIP,
        message: `Heading hierarchy skip detected: h${previousDepth} → h${heading.depth}.`,
        file,
        position: heading.position,
      });
    }

    previousDepth = heading.depth;
  }
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {MarkdownNode} tree
 * @param {string=} file
 */
function validateDuplicateHeadings(ctx, tree, file) {
  /** @type {Map<string, { line: number; column: number }>} */
  const seen = new Map();

  walk(tree, (node) => {
    if (node.type !== 'heading') {
      return;
    }
    const text = extractText(node);
    if (!text) {
      return;
    }

    const key = text.trim().toLowerCase();
    if (seen.has(key)) {
      const first = seen.get(key);
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.DUPLICATE_HEADING,
        message: `Duplicate heading text detected: "${text.trim()}".`,
        file,
        position: node.position
          ? { line: node.position.start.line, column: node.position.start.column }
          : /** @type {{ line: number; column: number }} */ (first),
      });
    } else if (node.position) {
      seen.set(key, { line: node.position.start.line, column: node.position.start.column });
    }
  });
}

/**
 * @param {MarkdownNode} node
 * @returns {string}
 */
function extractText(node) {
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value;
  }
  return node.children?.map(extractText).join('') ?? '';
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {{ code: string; message: string; file?: string; position: { line: number; column: number } }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: SEVERITY.CRITICAL,
    pass: 'headings',
    message:
      ctx.mode === VALIDATION_MODE.WARN
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
    line: diagnostic.position.line,
    column: diagnostic.position.column,
  });
}
