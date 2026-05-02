import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} url
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 * @property {{ start: { line: number; column: number } }=} position
 */

const BLOG_PATH_PREFIX = '/blog/';

/**
 * @param {{ knownSlugs?: Set<string> }} [options]
 * @returns {import('../../engine.js').MarkdownPass}
 */
export function linksPass(options = {}) {
  return {
    name: 'links',
    phase: /** @type {const} */ ('remark'),
    setup(ctx) {
      ctx.state.knownSlugs = options.knownSlugs ?? getKnownSlugs();
    },
    mdsvex(ctx) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createLinksRemarkPlugin(ctx),
        ]),
      };
    },
  };
}

function getKnownSlugs() {
  /** @type {Set<string>} */
  const slugs = new Set();

  const blogDir = fileURLToPath(new URL('../../../../content/blog', import.meta.url));
  for (const year of readdirSync(blogDir)) {
    const yearDir = join(blogDir, year);
    for (const file of readdirSync(yearDir)) {
      if (file.endsWith('.md')) {
        slugs.add(file.slice(0, -3));
      }
    }
  }

  return slugs;
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 */
function createLinksRemarkPlugin(ctx) {
  return function linksAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ path?: string; history?: string[]; data?: Record<string, unknown> }} file
     */
    return function linksTransformer(tree, file) {
      walk(tree, (node) => {
        if (node.type === 'link' && typeof node.url === 'string') {
          validateLinkUrl(node, ctx, file);
        }
      });
    };
  };
}

/**
 * @param {MarkdownNode} node
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {{ path?: string; history?: string[] }} file
 */
function validateLinkUrl(node, ctx, file) {
  const url = node.url ?? '';
  const filePath = file.path ?? file.history?.[0];

  if (url.startsWith(BLOG_PATH_PREFIX)) {
    const slug = url.slice(BLOG_PATH_PREFIX.length).split('/')[0];
    const knownSlugs = /** @type {Set<string>} */ (ctx.state.knownSlugs);
    if (slug && !knownSlugs.has(slug)) {
      addDiagnostic(ctx, {
        code: 'MDX011_BROKEN_INTERNAL_LINK',
        message: `Broken internal link to unknown post: ${url}.`,
        file: filePath,
        node,
      });
    }
    return;
  }

  if (url.startsWith('#')) {
    if (url.length <= 1) {
      addDiagnostic(ctx, {
        code: 'MDX012_EMPTY_ANCHOR',
        message: 'Empty anchor link is not allowed.',
        file: filePath,
        node,
      });
    }
    return;
  }
}

/**
 * @param {MarkdownNode} node
 * @param {(node: MarkdownNode) => void} visit
 */
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child, visit);
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {{ code: string; message: string; file?: string; node: MarkdownNode }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: 'critical',
    step: 'links',
    message:
      ctx.mode === 'warn'
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
    line: diagnostic.node.position?.start.line,
    column: diagnostic.node.position?.start.column,
  });
}
