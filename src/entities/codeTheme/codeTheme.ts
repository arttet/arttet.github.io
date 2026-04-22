export interface CodeTheme {
  id: string;
  label: string;
  kind: 'dark' | 'light';
  /** Representative accent color for swatches and labels */
  accent: string;
  bg: string;
  fg: string;
}
