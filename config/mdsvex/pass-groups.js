import { codeDetectPass } from './passes/content/code-detect.js';
import { codePass } from './passes/content/code.js';
import { codeTabsDetectPass } from './passes/content/code-tabs-detect.js';
import { frontmatterPass } from './passes/content/frontmatter.js';
import { imagesDetectPass } from './passes/content/images-detect.js';
import { linksPass } from './passes/content/links.js';
import { mathDetectPass } from './passes/content/math-detect.js';
import { mermaidPass } from './passes/content/mermaid.js';
import { readingTimePass } from './passes/content/reading-time.js';
import { rehypeHeadingsPass } from './passes/content/rehype-headings.js';
import { securityGuardsPass } from './passes/security/security-guards.js';

/**
 * @returns {import('./engine.js').MarkdownPass[]}
 */
export function contentPasses() {
  return [
    frontmatterPass(),
    readingTimePass(),
    mathDetectPass(),
    mermaidPass(),
    codeDetectPass(),
    codeTabsDetectPass(),
    imagesDetectPass(),
    linksPass(),
    rehypeHeadingsPass(),
    codePass(),
  ];
}

/**
 * @returns {import('./engine.js').MarkdownPass[]}
 */
export function securityPasses() {
  return [securityGuardsPass()];
}
