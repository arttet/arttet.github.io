import {
  prependMarkupAfterFrontmatter,
  prependScriptAfterFrontmatter,
  replaceRange,
} from './preprocess-utils.js';

/**
 * @param {string} content
 */
function findSvelteInstanceScriptOpen(content) {
  const lower = content.toLowerCase();
  const ignoredRanges = collectIgnoredRanges(content);
  let fromIndex = 0;

  for (;;) {
    const start = lower.indexOf('<script', fromIndex);
    if (start === -1) {
      return null;
    }

    const ignoredRange = findContainingRange(ignoredRanges, start);
    if (ignoredRange) {
      fromIndex = ignoredRange.end;
      continue;
    }

    const afterName = lower[start + '<script'.length];
    if (afterName && !/\s|>/.test(afterName)) {
      fromIndex = start + 1;
      continue;
    }

    const end = findTagEnd(content, start);
    if (end === -1) {
      return null;
    }

    const tag = content.slice(start, end + 1);
    const attrs = tag.slice('<script'.length, -1);
    const parsedAttrs = parseAttributes(attrs);

    if (!parsedAttrs.has('src') && !hasModuleScriptAttribute(parsedAttrs)) {
      return { tag, start, end: end + 1 };
    }

    fromIndex = end + 1;
  }
}

/**
 * @param {string} content
 * @param {number} fromIndex
 */
function findSvelteScriptClose(content, fromIndex = 0) {
  const lower = content.toLowerCase();
  const start = lower.indexOf('</script', fromIndex);
  if (start === -1) {
    return null;
  }

  const end = lower.indexOf('>', start);
  return end === -1 ? null : { tag: content.slice(start, end + 1), start, end: end + 1 };
}

/**
 * @param {string} content
 * @param {string[]} imports
 */
export function insertSvelteImports(content, imports) {
  let processed = content;
  let instanceScriptOpen = findSvelteInstanceScriptOpen(processed);

  if (imports.length === 0) {
    return { code: processed, instanceScriptOpen };
  }

  if (instanceScriptOpen) {
    const existingLines = new Set(
      (processed.match(/import .+?;\n?/g) ?? []).map((line) => line.trim())
    );
    const importsToInsert = imports.filter((line) => !existingLines.has(line.trim())).join('\n');

    if (importsToInsert) {
      processed = replaceRange(
        processed,
        instanceScriptOpen.start,
        instanceScriptOpen.end,
        `${instanceScriptOpen.tag}\n${importsToInsert}`
      );
      instanceScriptOpen = findSvelteInstanceScriptOpen(processed);
    }
  } else {
    processed = prependScriptAfterFrontmatter(
      processed,
      `<script>\n${imports.join('\n')}\n</script>`
    );
    instanceScriptOpen = findSvelteInstanceScriptOpen(processed);
  }

  return { code: processed, instanceScriptOpen };
}

/**
 * @param {string} content
 * @param {{ end: number } | null} instanceScriptOpen
 */
export function insertKatexStyles(content, instanceScriptOpen) {
  if (content.includes('<KaTeXStyles')) {
    return content;
  }

  const closingScriptTag = findSvelteScriptClose(content, instanceScriptOpen?.end ?? 0);
  if (closingScriptTag) {
    return replaceRange(
      content,
      closingScriptTag.start,
      closingScriptTag.end,
      `${closingScriptTag.tag}\n\n<KaTeXStyles />`
    );
  }

  return prependMarkupAfterFrontmatter(content, '<KaTeXStyles />');
}

/**
 * @param {string} content
 */
function collectIgnoredRanges(content) {
  /** @type {{ start: number; end: number }[]} */
  const ranges = [];

  for (const pattern of [/<!--[\s\S]*?-->/g, /(`{3,}[\s\S]*?`{3,}|`[^`\n]+?`)/g]) {
    for (;;) {
      const match = pattern.exec(content);
      if (!match) {
        break;
      }
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  return ranges.toSorted((a, b) => a.start - b.start);
}

/**
 * @param {{ start: number; end: number }[]} ranges
 * @param {number} index
 */
function findContainingRange(ranges, index) {
  return ranges.find((range) => index >= range.start && index < range.end);
}

/**
 * @param {string} content
 * @param {number} start
 */
function findTagEnd(content, start) {
  let quote = '';

  for (let i = start; i < content.length; i += 1) {
    const char = content[i];
    if (quote) {
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i;
    }
  }

  return -1;
}

/**
 * @param {string} attrs
 */
function parseAttributes(attrs) {
  /** @type {Map<string, string | true>} */
  const parsed = new Map();
  let index = 0;

  while (index < attrs.length) {
    while (/\s/.test(attrs[index] ?? '')) {
      index += 1;
    }

    const nameStart = index;
    while (index < attrs.length && !/[\s=]/.test(attrs[index])) {
      index += 1;
    }

    if (index === nameStart) {
      break;
    }

    const name = attrs.slice(nameStart, index).toLowerCase();
    while (/\s/.test(attrs[index] ?? '')) {
      index += 1;
    }

    if (attrs[index] !== '=') {
      parsed.set(name, true);
      continue;
    }

    index += 1;
    while (/\s/.test(attrs[index] ?? '')) {
      index += 1;
    }

    const quote = attrs[index] === '"' || attrs[index] === "'" ? attrs[index] : '';
    if (quote) {
      index += 1;
      const valueStart = index;
      while (index < attrs.length && attrs[index] !== quote) {
        index += 1;
      }
      parsed.set(name, attrs.slice(valueStart, index));
      index += 1;
    } else {
      const valueStart = index;
      while (index < attrs.length && !/\s/.test(attrs[index])) {
        index += 1;
      }
      parsed.set(name, attrs.slice(valueStart, index));
    }
  }

  return parsed;
}

/**
 * @param {Map<string, string | true>} attrs
 */
function hasModuleScriptAttribute(attrs) {
  const context = attrs.get('context');
  return attrs.has('module') || (typeof context === 'string' && context.toLowerCase() === 'module');
}
