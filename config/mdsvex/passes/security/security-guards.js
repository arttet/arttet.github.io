import {
  BLOCKED_HTML_TAGS,
  DIAGNOSTIC_CODES,
  PASS_PHASES,
  SAFE_PROTOCOLS,
  SEVERITY,
  VALIDATION_MODE,
} from '../../constants.js';
import { resolvePassContext } from '../../engine/context.js';
import { walk } from '../_internal/walk.js';
import { RAW_HTML_PATTERNS } from './patterns.js';

export function securityGuardsPass() {
  return {
    name: 'security-guards',
    phase: PASS_PHASES.VALIDATE,
    /**
     * @param {import('../../engine/context.js').BuildContext} build
     */
    mdsvex(build) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createSecurityGuardRemarkPlugin(build),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine/context.js').BuildContext} build
 */
function createSecurityGuardRemarkPlugin(build) {
  /**
   * @returns {(tree: MarkdownNode, file?: { path?: string; history?: string[] }) => void}
   */
  return function securityGuardAttacher() {
    return function securityGuardTransformer(tree, file) {
      const filePath = file?.path ?? file?.history?.[0];
      const ctx = resolvePassContext(build, filePath);
      validateMarkdownTree(tree, ctx, filePath);
    };
  };
}

/**
 * @param {MarkdownNode} tree
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics>; state: Record<string, unknown>; registry: typeof import('../../engine/registry.js').markdownComponentRegistry }} ctx
 * @param {string=} file
 */
export function validateMarkdownTree(tree, ctx, file) {
  walk(tree, (node) => {
    if (node.type === 'html' && typeof node.value === 'string') {
      validateHtmlNode(node, ctx, file);
    }

    if ((node.type === 'link' || node.type === 'image' || node.type === 'definition') && node.url) {
      validateUrlNode(node, ctx, file);
    }
  });
}

/**
 * @param {MarkdownNode} node
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics>; state: Record<string, unknown>; registry: typeof import('../../engine/registry.js').markdownComponentRegistry }} ctx
 * @param {string=} file
 */
function validateHtmlNode(node, ctx, file) {
  const value = node.value ?? '';

  for (const rawHtml of RAW_HTML_PATTERNS) {
    if (rawHtml.pattern.test(value)) {
      addDiagnostic(ctx, {
        code: rawHtml.code,
        message: `Unsafe raw HTML is not allowed in markdown: ${rawHtml.label}.`,
        file,
        node,
      });
    }
  }

  validateHtmlUrls(value, node, ctx, file);
  validateComponents(value, node, ctx, file);
}

/**
 * @param {string} value
 * @param {MarkdownNode} node
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {string=} file
 */
function validateHtmlUrls(value, node, ctx, file) {
  for (const match of value.matchAll(
    /<([a-zA-Z0-9:-]+)((?:[^>"'{]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*?)\s*\/?>/g
  )) {
    const attrs = match[2] ?? '';
    if (!attrs) {
      continue;
    }

    for (const attrMatch of attrs.matchAll(
      /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
    )) {
      const url = attrMatch[1] ?? attrMatch[2] ?? attrMatch[3] ?? '';

      // Skip Svelte expressions
      if (url.startsWith('{') && url.endsWith('}')) {
        continue;
      }

      if (!isSafeUrl(url)) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.UNSAFE_URL,
          message: `Unsafe URL is not allowed in markdown: ${url}.`,
          file,
          node,
        });
      }
    }
  }
}

/**
 * @param {MarkdownNode} node
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {string=} file
 */
function validateUrlNode(node, ctx, file) {
  const url = node.url ?? '';
  if (!isSafeUrl(url)) {
    addDiagnostic(ctx, {
      code: DIAGNOSTIC_CODES.UNSAFE_URL,
      message: `Unsafe URL is not allowed in markdown: ${url}.`,
      file,
      node,
    });
  }
}

/**
 * @param {string} value
 * @param {MarkdownNode} node
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics>; state: Record<string, unknown>; registry: typeof import('../../engine/registry.js').markdownComponentRegistry }} ctx
 * @param {string=} file
 */
function validateComponents(value, node, ctx, file) {
  for (const match of value.matchAll(/<([A-Z][A-Za-z0-9]*)(\s(?:[^"'>]|"[^"]*"|'[^']*')*)?\/?>/g)) {
    const name = match[1] ?? '';
    const attrs = match[2] ?? '';
    if (BLOCKED_HTML_TAGS.has(name.toLowerCase())) {
      continue;
    }

    const component = getRegisteredComponent(ctx, name);

    if (!component) {
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.UNKNOWN_COMPONENT,
        message: `Unknown markdown component <${name}>.`,
        file,
        node,
      });
      continue;
    }

    for (const prop of readAttributeNames(attrs)) {
      if (!component.allowedProps.includes(prop)) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.UNKNOWN_COMPONENT_PROP,
          message: `Unknown prop "${prop}" on markdown component <${name}>.`,
          file,
          node,
        });
      }
    }
  }
}

/**
 * @param {{ registry: typeof import('../../engine/registry.js').markdownComponentRegistry }} ctx
 * @param {string} name
 */
function getRegisteredComponent(ctx, name) {
  if (!Object.hasOwn(ctx.registry, name)) {
    return null;
  }

  return /** @type {typeof ctx.registry[keyof typeof ctx.registry]} */ (
    ctx.registry[/** @type {keyof typeof ctx.registry} */ (name)]
  );
}

/**
 * @param {string} attrs
 * @returns {string[]}
 */
function readAttributeNames(attrs) {
  const regex =
    /\s+(?:([A-Za-z_:][\w:.-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}|[^\s>]+))?|\{([A-Za-z_:][\w:.-]*)\}|{\.\.\.([A-Za-z_:][\w:.-]*)\})/g;
  return Array.from(attrs.matchAll(regex), (match) => match[1] || match[2] || '...' + match[3]);
}

/**
 * @param {string} url
 */
function isSafeUrl(url) {
  const normalized = url.trim().toLowerCase();
  if (normalized === '') {
    return true;
  }

  // Allow relative URLs (anything without a protocol colon)
  if (!normalized.includes(':')) {
    return true;
  }

  // Allow fragment-only and path-relative URLs
  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return true;
  }

  // Allow specific safe protocols (whitelist)
  return SAFE_PROTOCOLS.some((p) => normalized.startsWith(p));
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {{ code: string; message: string; file?: string; node: MarkdownNode }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: ctx.mode === VALIDATION_MODE.STRICT ? SEVERITY.CRITICAL : SEVERITY.WARNING,
    pass: 'security-guards',
    message:
      ctx.mode === VALIDATION_MODE.WARN
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
    line: diagnostic.node.position?.start.line,
    column: diagnostic.node.position?.start.column,
  });
}

/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} url
 * @property {MarkdownNode[]=} children
 * @property {{ start: { line: number; column: number } }=} position
 */
