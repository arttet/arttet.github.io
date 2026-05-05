/** @type {string[]} */
let themeIds = [];

/**
 * @param {string[]} ids
 */
export function setThemes(ids) {
  themeIds = ids;
}

/**
 * @returns {string[]}
 */
export function getThemeIds() {
  return themeIds;
}
