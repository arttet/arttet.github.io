import { browser } from '$app/environment';
import { site } from '$shared/config/site';
import { storage } from '$shared/lib/storage';

type Theme = 'dark' | 'light';

const KEY = site.theme.storageKeys.theme;

class ThemeState {
  #current = $state<Theme>((storage.get(KEY) as Theme) ?? 'dark');

  get current() {
    return this.#current;
  }

  toggle() {
    const next: Theme = this.#current === 'dark' ? 'light' : 'dark';
    this.#current = next;
    storage.set(KEY, next);
    if (browser) {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  }
}

export const theme = new ThemeState();
