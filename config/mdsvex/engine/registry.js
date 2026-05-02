import { COMPONENT_KIND } from '../constants.js';

export const markdownComponentRegistry = {
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
  },
  KaTeXStyles: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: [],
  },
  StaticHtml: {
    kind: COMPONENT_KIND.BLOCK,
    allowedProps: ['html'],
  },
};
