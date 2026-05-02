import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIAGNOSTIC_CODES, PASS_PHASES, SEVERITY, VALIDATION_MODE } from '../../constants.js';

import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
 */

const BLOG_PATH_PREFIX = '/blog/';

/**
 * @param {{ knownSlugs?: Set<string> }} [options]
 * @returns {import('../../engine/index.js').MarkdownPass}
 */
export function linksPass(options = {}) {
  return {
    name: 'links',
    phase: PASS_PHASES.REMARK,
    setup(ctx) {
      const metadata = options.knownSlugs
        ? { knownSlugs: options.knownSlugs, draftSlugs: new Set() }
        : getSlugMetadata();
      ctx.state.knownSlugs = metadata.knownSlugs;
      ctx.state.draftSlugs = metadata.draftSlugs;
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

function getSlugMetadata() {
  /** @type {Set<string>} */
  const knownSlugs = new Set();
  /** @type {Set<string>} */
  const draftSlugs = new Set();

  try {
    const blogDir = fileURLToPath(new URL('../../../../content/blog', import.meta.url));
    for (const year of readdirSync(blogDir)) {
      const yearDir = join(blogDir, year);
      for (const file of readdirSync(yearDir)) {
        if (file.endsWith('.md')) {
          const slug = file.slice(0, -3);
          knownSlugs.add(slug);
          if (isDraft(join(yearDir, file))) {
            draftSlugs.add(slug);
          }
        }
      }
    }
  } catch {
    // Fallback when import.meta.url is not a file URL (e.g. test environments).
  }

  return { knownSlugs, draftSlugs };
}

/**
 * @param {string} filePath
 */
function isDraft(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return false;
    return /^draft:\s*true$/m.test(match[1]);
  } catch {
    return false;
  }
}

/**
 * @param {import('../../engine/index.js').MarkdownPipelineContext} ctx
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
 * @param {import('../../engine/index.js').MarkdownPipelineContext} ctx
 * @param {{ path?: string; history?: string[] }} file
 */
function validateLinkUrl(node, ctx, file) {
  const url = node.url ?? '';
  const filePath = file.path ?? file.history?.[0];

  if (url.startsWith(BLOG_PATH_PREFIX)) {
    const slug = url.slice(BLOG_PATH_PREFIX.length).split('/')[0];
    const knownSlugs = /** @type {Set<string>} */ (ctx.state.knownSlugs);
    const draftSlugs = /** @type {Set<string>} */ (ctx.state.draftSlugs);
    if (slug && !knownSlugs.has(slug)) {
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.BROKEN_INTERNAL_LINK,
        message: `Broken internal link to unknown post: ${url}.`,
        file: filePath,
        node,
      });
    } else if (slug && draftSlugs.has(slug)) {
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.LINK_TO_HIDDEN,
        message: `Internal link points to a draft post: ${url}.`,
        file: filePath,
        node,
      });
    }
    return;
  }

  if (url.startsWith('#')) {
    if (url.length <= 1) {
      addDiagnostic(ctx, {
        code: DIAGNOSTIC_CODES.EMPTY_ANCHOR,
        message: 'Empty anchor link is not allowed.',
        file: filePath,
        node,
      });
    }
    return;
  }
}

/**
 * @param {import('../../engine/index.js').MarkdownPipelineContext} ctx
 * @param {{ code: string; message: string; file?: string; node: MarkdownNode }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: SEVERITY.CRITICAL,
    step: 'links',
    message:
      ctx.mode === VALIDATION_MODE.WARN
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
    line: diagnostic.node.position?.start.line,
    column: diagnostic.node.position?.start.column,
  });
}
