/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 * @property {{ start: { line: number; column: number } }=} position
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @returns {import('../../engine.js').MarkdownPass}
 */
export function frontmatterPass() {
  return {
    name: 'frontmatter',
    phase: /** @type {const} */ ('validate'),
    mdsvex(ctx) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createFrontmatterRemarkPlugin(ctx),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 */
function createFrontmatterRemarkPlugin(ctx) {
  return function frontmatterAttacher() {
    /**
     * @param {MarkdownNode} _tree
     * @param {{ path?: string; history?: string[]; data?: { fm?: Record<string, unknown> } }} file
     */
    return function frontmatterTransformer(_tree, file) {
      validateFrontmatter(ctx, file.data?.fm, file.path ?? file.history?.[0]);
    };
  };
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {unknown} fm
 * @param {string=} file
 */
export function validateFrontmatter(ctx, fm, file) {
  if (!fm || typeof fm !== 'object') {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: 'Frontmatter is missing or not an object.',
      file,
    });
    return;
  }

  /** @type {Record<string, unknown>} */
  const data = /** @type {Record<string, unknown>} */ (fm);

  validateRequiredString(ctx, data, 'title', file);
  validateStringArray(ctx, data, 'tags', file);
  validateIsoDate(ctx, data, 'created', true, file);
  validateIsoDate(ctx, data, 'updated', false, file);
  validateOptionalBoolean(ctx, data, 'draft', file);
  validateOptionalString(ctx, data, 'summary', file);
  validateOptionalBoolean(ctx, data, 'toc', file);
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {string=} file
 */
function validateRequiredString(ctx, data, key, file) {
  const value = data[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: `Frontmatter "${key}" must be a non-empty string.`,
      file,
    });
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {string=} file
 */
function validateStringArray(ctx, data, key, file) {
  const value = data[key];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((v) => typeof v !== 'string' || v.trim().length === 0)
  ) {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: `Frontmatter "${key}" must be a non-empty array of non-empty strings.`,
      file,
    });
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {boolean} required
 * @param {string=} file
 */
function validateIsoDate(ctx, data, key, required, file) {
  const value = data[key];
  if (value === undefined) {
    if (required) {
      addDiagnostic(ctx, {
        code: 'MDX010_INVALID_FRONTMATTER',
        message: `Frontmatter "${key}" is required and must be a valid ISO 8601 date (YYYY-MM-DD).`,
        file,
      });
    }
    return;
  }
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: `Frontmatter "${key}" must be a valid ISO 8601 date (YYYY-MM-DD).`,
      file,
    });
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {string=} file
 */
function validateOptionalString(ctx, data, key, file) {
  const value = data[key];
  if (value !== undefined && typeof value !== 'string') {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: `Frontmatter "${key}" must be a string when provided.`,
      file,
    });
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {string=} file
 */
function validateOptionalBoolean(ctx, data, key, file) {
  const value = data[key];
  if (value !== undefined && typeof value !== 'boolean') {
    addDiagnostic(ctx, {
      code: 'MDX010_INVALID_FRONTMATTER',
      message: `Frontmatter "${key}" must be a boolean when provided.`,
      file,
    });
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {{ code: string; message: string; file?: string }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: 'critical',
    step: 'frontmatter',
    message:
      ctx.mode === 'warn'
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
  });
}
