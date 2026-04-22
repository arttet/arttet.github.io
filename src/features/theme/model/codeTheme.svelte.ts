import { browser } from '$app/environment';
import { site } from '$shared/config/site';
import { storage } from '$shared/lib/storage';

const DARK_KEY = site.theme.storageKeys.codeThemeDark;
const LIGHT_KEY = site.theme.storageKeys.codeThemeLight;
const DEFAULT_DARK = site.theme.defaults.dark;
const DEFAULT_LIGHT = site.theme.defaults.light;

class CodeThemeState {
  #key: string;
  #v = $state('');

  constructor(key: string, def: string) {
    this.#key = key;
    this.#v = storage.get(key) ?? def;
  }

  get value() {
    return this.#v;
  }

  set value(id: string) {
    this.#v = id;
    storage.set(this.#key, id);
  }
}

export const darkCodeTheme = new CodeThemeState(DARK_KEY, DEFAULT_DARK);
export const lightCodeTheme = new CodeThemeState(LIGHT_KEY, DEFAULT_LIGHT);

export function applyCodeTheme(id: string) {
  if (!browser) {
    return;
  }

  document.documentElement.setAttribute('data-code-theme', id);

  let el = document.getElementById('code-theme-style') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'code-theme-style';
    document.head.appendChild(el);
  }

  el.textContent = [
    `.shiki span { color: var(--shiki-${id}) !important; }`,
    `.shiki { background-color: var(--shiki-${id}-bg) !important; }`,
  ].join('\n');
}
