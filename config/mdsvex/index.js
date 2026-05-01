import { createMarkdownEngine } from './engine.js';
import { codeStep } from './steps/code.js';
import { mermaidStep } from './steps/mermaid.js';
import { readingTimeStep } from './steps/reading-time.js';
import { rehypeHeadingsStep } from './steps/rehype-headings.js';
import { securityGuardsStep } from './steps/security-guards.js';

export async function createMarkdownConfig() {
  return createMarkdownEngine({
    mode: 'warn',
  })
    .use(readingTimeStep())
    .use(securityGuardsStep())
    .use(mermaidStep())
    .use(rehypeHeadingsStep())
    .use(codeStep())
    .toMdsvexConfig();
}
