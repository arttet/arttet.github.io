import { codeDetectPass } from '../passes/content/code-detect.js';
import { codePass } from '../passes/content/code.js';
import { codeTabsDetectPass } from '../passes/content/code-tabs-detect.js';
import { frontmatterPass } from '../passes/content/frontmatter.js';
import { imagesGuardPass } from '../passes/content/images.js';
import { headingsPass } from '../passes/content/headings.js';
import { imagesDetectPass } from '../passes/content/images-detect.js';
import { linksPass } from '../passes/content/links.js';
import { mathDetectPass } from '../passes/content/math-detect.js';
import { mermaidPass } from '../passes/content/mermaid.js';
import { readingTimePass } from '../passes/content/reading-time.js';
import { rehypeHeadingsPass } from '../passes/content/rehype-headings.js';
import { extractionPass } from '../passes/optimization/extraction.js';
import { tocPass } from '../passes/content/toc.js';
import { imagesPass } from '../passes/optimization/images.js';
import { securityGuardsPass } from '../passes/security/security-guards.js';

/**
 * @returns {import('./index.js').MarkdownPass[]}
 */
export function optimizationPasses() {
  return [imagesPass()];
}

/**
 * @returns {import('./index.js').MarkdownPass[]}
 */
export function contentPasses() {
  return [
    frontmatterPass(),
    readingTimePass(),
    imagesGuardPass(),
    mathDetectPass(),
    mermaidPass(),
    codeDetectPass(),
    codeTabsDetectPass(),
    imagesDetectPass(),
    linksPass(),
    extractionPass(),
    headingsPass(),
    rehypeHeadingsPass(),
    tocPass(),
    codePass(),
  ];
}

/**
 * @returns {import('./index.js').MarkdownPass[]}
 */
export function securityPasses() {
  return [securityGuardsPass()];
}
