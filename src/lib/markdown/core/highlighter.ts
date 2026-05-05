export { setThemes } from './shiki-config.js';
export {
  LANGS,
  LANG_SET,
  getHighlighter,
  loadLanguage,
  highlightCode,
  highlightOnDemand,
} from './shiki-engine.js';

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
