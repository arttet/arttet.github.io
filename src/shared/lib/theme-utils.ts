import type { CodeTheme } from '$entities/codeTheme/codeTheme';

/**
 * Generates all necessary CSS rules for code themes based on the site config.
 * Includes both custom variables and Shiki multi-theme overrides.
 */
export function generateThemeCSS(themes: readonly CodeTheme[]): string {
  const defaultVars = `
    html {
      --code-bg: #080d14;
      --code-fg: #c9d1d9;
      --code-accent: var(--color-accent);
    }
  `;

  const themeRules = themes
    .map(
      (t) => `
    /* Theme: ${t.label} */
    html[data-code-theme="${t.id}"] {
      --code-bg: ${t.bg};
      --code-fg: ${t.fg};
      --code-accent: ${t.accent};
    }

    html[data-code-theme="${t.id}"] .shiki span {
      color: var(--shiki-${t.id}) !important;
    }

    html[data-code-theme="${t.id}"] .shiki {
      background-color: var(--shiki-${t.id}-bg) !important;
    }
  `
    )
    .join('\n');

  return defaultVars + themeRules;
}
