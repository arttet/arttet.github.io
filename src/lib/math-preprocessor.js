import katex from 'katex';

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
function escapeJsTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
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
 * @param {string} block
 */
function renderCodeTabs(block) {
  const tabs = parseCodeTabsBlock(block);
  if (tabs.length === 0) {
    return block;
  }

  const tabsExpr = tabs
    .map(
      (tab) =>
        `{
    lang: '${tab.lang}',
    label: '${tab.label.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',
    code: \`${escapeJsTemplateLiteral(tab.code)}\`
  }`
    )
    .join(',\n  ');

  return `\n\n<CodeTabs tabs={[\n  ${tabsExpr}\n]} />\n\n`;
}

/**
 * @param {string} content
 */
function processCodeTabs(content) {
  return content.replace(/:::code-tabs\s*\n[\s\S]*?\n:::/g, (block) => renderCodeTabs(block));
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
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
export function mathPreprocess() {
  return {
    markup({ content, filename }) {
      if (!filename?.endsWith('.md')) {
        return;
      }

      const codeTabsProcessed = processCodeTabs(content);
      const segments = splitByCodeBlocks(codeTabsProcessed);
      let processed = segments
        .map((seg) => (seg.type === 'text' ? processMath(seg.value) : seg.value))
        .join('');

      /** @type {string[]} */
      const imports = [];

      if (processed.includes('<MathCopy')) {
        imports.push("  import MathCopy from '$shared/ui/MathCopy.svelte';");
      }

      if (processed.includes('<CodeTabs')) {
        imports.push("  import CodeTabs from '$shared/ui/CodeTabs.svelte';");
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

      return { code: processed };
    },
  };
}
