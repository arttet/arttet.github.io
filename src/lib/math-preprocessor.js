import katex from 'katex';
import { getHighlighter, LANGS } from './highlighter.config.js';

/**
 * Svelte preprocessor that converts KaTeX math in .md files
 * BEFORE mdsvex sees the content, so backslashes are preserved.
 *
 * Skips fenced code blocks and inline code spans.
 * Handles:
 *   $$...$$  -> display math block
 *   $...$    -> inline math
 */

/**
 * @param {string} str
 */
function utf8ToBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
}

/**
 * @param {string} math
 */
function renderDisplay(math) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: true,
      throwOnError: false,
      output: 'html',
    });
    const b64Latex = utf8ToBase64(math.trim());
    const b64Html = utf8ToBase64(html);
    return `\n\n<MathCopy display={true} b64Latex="${b64Latex}" b64Html="${b64Html}" />\n\n`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('KaTeX display render failed:', e);
    return `<code>$$${math}$$</code>`;
  }
}

/**
 * @param {string} math
 */
function renderInline(math) {
  try {
    const html = katex.renderToString(math.trim(), {
      displayMode: false,
      throwOnError: false,
      output: 'html',
    });
    const b64Latex = utf8ToBase64(math.trim());
    const b64Html = utf8ToBase64(html);
    return `<MathCopy display={false} b64Latex="${b64Latex}" b64Html="${b64Html}" />`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('KaTeX inline render failed:', e);
    return `<MathCopy display={false} b64Latex="${utf8ToBase64(math.trim())}" b64Html="" />`;
  }
}

/**
 * @param {string} str
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} str
 */
function escapeJsTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * @param {string} str
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * @param {string} html
 * @param {string} lang
 */
function enhancePre(html, lang) {
  return html.replace(/<pre\b([^>]*)>/, (match, attrs = '') => {
    void match;
    let nextAttrs = String(attrs)
      .replace(/\s+tabindex=(?:"[^"]*"|'[^']*'|[^\s>]+)/, '')
      .replace(/\s+data-language=(?:"[^"]*"|'[^']*'|[^\s>]+)/, '');

    if (/\sclass=/.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/class="([^"]*)"/, (classMatch, classes) => {
        void classMatch;
        return `class="${classes.includes('m-0') ? classes : `${classes} m-0`}"`;
      });
    } else {
      nextAttrs += ' class="shiki m-0"';
    }

    return `<pre tabindex="-1" data-language="${lang}"${nextAttrs}>`;
  });
}

/**
 * @param {string} lang
 */
function formatLangLabel(lang) {
  /** @type {Record<string, string>} */
  const labels = {
    cpp: 'C++',
    js: 'JavaScript',
    ts: 'TypeScript',
    sh: 'Shell',
  };

  return labels[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1);
}

/**
 * @param {string} info
 * @returns {{ lang: string; title?: string }}
 */
function parseFenceInfo(info) {
  const trimmed = info.trim();
  const [lang = '', ...rest] = trimmed.split(/\s+/);
  const meta = rest.join(' ');
  const titleMatch = meta.match(/title=(?:"([^"]+)"|'([^']+)')/);

  return {
    lang,
    title: titleMatch?.[1] ?? titleMatch?.[2],
  };
}

/**
 * @param {string} block
 * @returns {{ lang: string; label: string; code: string }[]}
 */
function parseCodeTabsBlock(block) {
  const body = block.replace(/^:::code-tabs\s*\n?/, '').replace(/\n?:::\s*$/, '');
  const fencePattern = /```([^\n]*)\n([\s\S]*?)\n```/g;
  /** @type {{ lang: string; label: string; code: string }[]} */
  const tabs = [];

  for (;;) {
    const match = fencePattern.exec(body);
    if (match === null) {
      break;
    }

    const { lang, title } = parseFenceInfo(match[1] ?? '');
    if (!lang) {
      continue;
    }

    tabs.push({
      lang,
      label: title ?? formatLangLabel(lang),
      code: match[2] ?? '',
    });
  }

  return tabs;
}

/**
 * @param {{ lang: string; label: string; code: string }} tab
 * @param {Record<string, string>} themes
 */
async function renderCodeTabPanel(tab, themes) {
  const safeLang = LANGS.includes(tab.lang) ? tab.lang : 'text';
  try {
    const highlighter = await getHighlighter();
    return enhancePre(
      highlighter.codeToHtml(tab.code.trim(), { lang: safeLang, themes, defaultColor: false }),
      safeLang
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('CodeTabs highlighting failed:', e);
    return `<pre tabindex="-1" class="shiki m-0 font-mono" data-language="${safeLang}"><code>${escapeHtml(tab.code.trim())}</code></pre>`;
  }
}

/**
 * @param {string} block
 * @param {Record<string, string>} themes
 * @param {number} groupIndex
 */
async function renderCodeTabs(block, themes, groupIndex) {
  const tabs = parseCodeTabsBlock(block);
  if (tabs.length === 0) {
    return block;
  }

  const panels = await Promise.all(tabs.map((tab) => renderCodeTabPanel(tab, themes)));
  const groupId = `code-tabs-${hashString(block)}-${groupIndex}`;
  const buttons = tabs
    .map((tab, index) => {
      const tabId = `${groupId}-tab-${index}`;
      const panelId = `${groupId}-panel-${index}`;
      const activeClass =
        index === 0
          ? 'text-[--color-accent] border-b-2 border-[--color-accent]'
          : 'text-[--code-accent] opacity-70';
      return `<button type="button" role="tab" id="${tabId}" aria-controls="${panelId}" aria-selected="${index === 0}" tabindex="0" data-code-tab class="px-4 py-2 text-xs font-mono transition-colors duration-[100ms] ${activeClass}">${escapeHtml(tab.label)}</button>`;
    })
    .join('');
  const panel = panels
    .map((html, index) => {
      const tabId = `${groupId}-tab-${index}`;
      const panelId = `${groupId}-panel-${index}`;
      return `<div class="relative group" role="tabpanel" id="${panelId}" aria-labelledby="${tabId}" data-code-tabs-content${index === 0 ? '' : ' hidden'}>${html}</div>`;
    })
    .join('');
  const html = `<div class="not-prose my-6 rounded-lg border border-[--color-border] overflow-hidden" data-code-tabs><div role="tablist" aria-label="Code examples" class="flex items-center bg-[--code-bg] border-b border-[--color-border] px-1">${buttons}</div>${panel}</div>`;

  return `\n\n<StaticHtml html={\`${escapeJsTemplateLiteral(html)}\`} />\n\n`;
}

/**
 * @param {string} content
 * @param {Record<string, string>} themes
 */
async function processCodeTabs(content, themes) {
  const blocks = content.match(/:::code-tabs\s*\n[\s\S]*?\n:::/g) ?? [];
  let processed = content;
  const renderedBlocks = await Promise.all(
    blocks.map(async (block, index) => [block, await renderCodeTabs(block, themes, index)])
  );

  for (const [block, rendered] of renderedBlocks) {
    processed = processed.replace(block, rendered);
  }

  return processed;
}

/**
 * @param {string} content
 * @returns {{ type: 'text' | 'code'; value: string }[]}
 */
function splitByCodeBlocks(content) {
  /** @type {{ type: 'text' | 'code'; value: string }[]} */
  const segments = [];
  const codePattern = /(`{3,}[\s\S]*?`{3,}|`[^`\n]+?`)/g;
  let lastIndex = 0;

  for (;;) {
    const match = codePattern.exec(content);
    if (match === null) {
      break;
    }
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return segments;
}

/**
 * @param {string} text
 */
function processMath(text) {
  let result = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => renderDisplay(math));
  result = result.replace(/(?<![\\$])\$(?!\$)((?:[^$\n\\]|\\[^\n])+?)\$(?!\$)/g, (_, math) =>
    renderInline(math)
  );
  return result;
}

/**
 * @param {string} content
 * @param {string} script
 */
function prependScriptAfterFrontmatter(content, script) {
  const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/);
  if (!frontmatterMatch) {
    return `${script}\n\n${content}`;
  }

  const frontmatter = frontmatterMatch[0];
  const rest = content.slice(frontmatter.length);
  return `${frontmatter}${script}\n\n${rest}`;
}

/**
 * @param {string} content
 * @param {string} markup
 */
function prependMarkupAfterFrontmatter(content, markup) {
  const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/);
  if (!frontmatterMatch) {
    return `${markup}\n\n${content}`;
  }

  const frontmatter = frontmatterMatch[0];
  const rest = content.slice(frontmatter.length);
  return `${frontmatter}${markup}\n\n${rest}`;
}

/**
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
export function mathPreprocess() {
  return {
    async markup({ content, filename }) {
      if (!filename?.endsWith('.md')) {
        return;
      }

      const segments = splitByCodeBlocks(content);
      let processed = segments
        .map((seg) => (seg.type === 'text' ? processMath(seg.value) : seg.value))
        .join('');
      const themes = Object.fromEntries(
        (await import('../shared/config/codeThemes.js')).codeThemes.map((t) => [t.id, t.id])
      );
      processed = await processCodeTabs(processed, themes);

      /** @type {string[]} */
      const imports = [];
      const needsKaTeXStyles = processed.includes('<MathCopy');

      if (needsKaTeXStyles) {
        imports.push("  import MathCopy from '$shared/ui/MathCopy.svelte';");
        imports.push("  import KaTeXStyles from '$shared/ui/KaTeXStyles.svelte';");
      }

      if (processed.includes('<StaticHtml')) {
        imports.push("  import StaticHtml from '$shared/ui/StaticHtml.svelte';");
      }

      if (imports.length > 0) {
        const scriptTagMatch = processed.match(/<script[^>]*>/);
        if (scriptTagMatch) {
          const [tag] = scriptTagMatch;
          const existingLines = new Set(
            (processed.match(/import .+?;\n?/g) ?? []).map((line) => line.trim())
          );
          const importsToInsert = imports
            .filter((line) => !existingLines.has(line.trim()))
            .join('\n');

          if (importsToInsert) {
            processed = processed.replace(tag, `${tag}\n${importsToInsert}`);
          }
        } else {
          processed = prependScriptAfterFrontmatter(
            processed,
            `<script>\n${imports.join('\n')}\n</script>`
          );
        }
      }

      if (needsKaTeXStyles && !processed.includes('<KaTeXStyles')) {
        const closingScriptTag = processed.match(/<\/script>/);
        if (closingScriptTag) {
          processed = processed.replace(
            closingScriptTag[0],
            `${closingScriptTag[0]}\n\n<KaTeXStyles />`
          );
        } else {
          processed = prependMarkupAfterFrontmatter(processed, '<KaTeXStyles />');
        }
      }

      return { code: processed };
    },
  };
}
