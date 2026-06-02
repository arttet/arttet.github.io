/**
 * @param {string} str
 */
export function utf8ToBase64(str) {
  return Buffer.from(str).toString('base64');
}

export { escapeHtml } from '../../../../src/lib/markdown/core/shiki-engine.js';

/**
 * Wrap raw HTML so mdsvex injects it via `{@html}` at runtime.
 * Uses JSON.stringify for safe quoting (no template-literal escaping needed).
 *
 * @param {string} html
 * @returns {string}
 */
export function trustedSvelteHtml(html) {
  return `{@html ${JSON.stringify(html)}}`;
}

/**
 * @param {string} content
 * @returns {{ type: 'text' | 'code'; value: string }[]}
 */
export function splitByCodeBlocks(content) {
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
 * @param {string} content
 * @param {string} script
 */
export function prependScriptAfterFrontmatter(content, script) {
  const frontmatterMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/);
  if (!frontmatterMatch) {
    return `${script}\n\n${content}`;
  }

  const frontmatter = frontmatterMatch[0];
  const rest = content.slice(frontmatter.length);
  return `${frontmatter}${script}\n\n${rest}`;
}

/**
 * @param {string} input
 * @param {number} start
 * @param {number} end
 * @param {string} replacement
 */
export function replaceRange(input, start, end, replacement) {
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}
