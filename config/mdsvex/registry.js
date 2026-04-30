export const markdownComponentRegistry = {
  CodeBlock: {
    kind: 'block',
    allowedProps: ['lang', 'code', 'title', 'highlights', 'showLineNumbers'],
  },
  CodeTabs: {
    kind: 'block',
    allowedProps: ['title', 'tabs'],
  },
  MermaidBlock: {
    kind: 'block',
    allowedProps: ['source'],
  },
  MathCopy: {
    kind: 'block',
    allowedProps: ['display', 'b64Latex', 'b64Html'],
  },
  KaTeXStyles: {
    kind: 'block',
    allowedProps: [],
  },
  StaticHtml: {
    kind: 'block',
    allowedProps: ['html'],
  },
};
