import { COMPONENT_KIND, deepFreeze } from '../constants.js';

/**
 * @typedef {object} RegistryEntry
 * @property {string} kind
 * @property {string[]} allowedProps
 * @property {{ detect: string; import: string }} [runtime]
 */

/**
 * Runtime-injected components declare a `runtime` field so the preprocessor
 * can emit the corresponding import when the component is used in markdown.
 */
const rawRegistry = /** @type {Record<string, RegistryEntry>} */ ({
  CodeBlock: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['lang', 'code', 'title', 'highlights', 'showLineNumbers'],
  },
  CodeTabs: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['title', 'tabs'],
  },
  MermaidBlock: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['source'],
  },
  MathCopy: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['display', 'b64Latex', 'b64Html'],
    runtime: {
      detect: 'MathCopy',
      import: '$lib/markdown/ui/MathCopy.svelte',
    },
  },
  KaTeXStyles: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: [],
  },
  StaticHtml: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['html'],
  },
});

export const markdownComponentRegistry = /** @type {Record<string, RegistryEntry>} */ (
  deepFreeze(rawRegistry)
);

/**
 * @param {string} content
 * @returns {string[]}
 */
export function collectRuntimeImports(content) {
  /** @type {string[]} */
  const imports = [];

  for (const [name, entry] of Object.entries(markdownComponentRegistry)) {
    if (!entry.runtime) {
      continue;
    }
    const { detect, import: importPath } = entry.runtime;
    if (content.includes(`<${detect}`)) {
      imports.push(`  import ${name} from '${importPath}';`);
    }
  }

  return imports;
}
