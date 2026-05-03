import { DIAGNOSTIC_CODES } from '../../constants.js';

export const RAW_HTML_PATTERNS = Object.freeze([
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*script\b/i, label: '<script>' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*style\b/i, label: '<style>' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /\{@html\b/i, label: '{@html}' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*iframe\b/i, label: '<iframe>' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*object\b/i, label: '<object>' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*embed\b/i, label: '<embed>' },
  { code: DIAGNOSTIC_CODES.RAW_HTML, pattern: /<\s*img\b/i, label: '<img>' },
  {
    code: DIAGNOSTIC_CODES.UNSAFE_EVENT_HANDLER,
    pattern: /[\s/](?:on:[\w|:-]+|on\w+)\s*=/i,
    label: 'event handler',
  },
]);
