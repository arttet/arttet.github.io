import katex from 'katex';
import { splitByCodeBlocks, utf8ToBase64 } from '../_internal/preprocess-utils.js';

/**
 * @param {string} content
 */
export function processMathContent(content) {
  return splitByCodeBlocks(content)
    .map((segment) => (segment.type === 'text' ? processMath(segment.value) : segment.value))
    .join('');
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
