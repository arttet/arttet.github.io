export {
  LANGS,
  LANG_SET,
  setThemes,
  getHighlighter,
  loadLanguage,
  highlightCode,
  highlightOnDemand,
} from '../../highlighter.config.js';

export type SupportedLang =
  | 'javascript'
  | 'typescript'
  | 'svelte'
  | 'rust'
  | 'go'
  | 'python'
  | 'bash'
  | 'sh'
  | 'json'
  | 'yaml'
  | 'toml'
  | 'css'
  | 'html'
  | 'markdown'
  | 'sql'
  | 'dockerfile'
  | 'cpp'
  | 'zig';
