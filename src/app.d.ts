/// <reference types="@sveltejs/enhanced-img" />

declare module '@fontsource-variable/jetbrains-mono';
declare module '@fontsource-variable/geist';
declare module '*.css?url' {
  const href: string;
  export default href;
}
