import { codePass } from './passes/content/code.js';
import { mermaidPass } from './passes/content/mermaid.js';
import { readingTimePass } from './passes/content/reading-time.js';
import { rehypeHeadingsPass } from './passes/content/rehype-headings.js';
import { securityGuardsPass } from './passes/security/security-guards.js';

/**
 * @returns {import('./engine.js').MarkdownPass[]}
 */
export function contentPasses() {
  return [readingTimePass(), rehypeHeadingsPass(), codePass(), mermaidPass()];
}

/**
 * @returns {import('./engine.js').MarkdownPass[]}
 */
export function securityPasses() {
  return [securityGuardsPass()];
}
