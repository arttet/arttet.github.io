import { getHighlighter, LANGS } from '../../../../src/lib/highlighter.config.js';
import { escapeHtml, escapeJsTemplateLiteral } from '../preprocess-utils.js';

/**
 * @param {string} content
 * @param {Record<string, string>} themes
 */
export async function processCodeTabsContent(content, themes) {
  const blocks = content.match(/:::code-tabs\s*\n[\s\S]*?\n:::/g) ?? [];
  let processed = content;
  const renderedBlocks = await Promise.all(
    blocks.map(async (block, index) => [block, await renderCodeTabs(block, themes, index)])
  );

  for (const [block, rendered] of renderedBlocks) {
    processed = processed.replace(block, () => rendered);
  }

  return processed;
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
 * @param {string} str
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
