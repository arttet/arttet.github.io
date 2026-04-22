import { browser } from '$app/environment';

/**
 * Safe localStorage wrapper with SSR support.
 */
export const storage = {
  get(key: string): string | null {
    if (!browser) {
      return null;
    }
    return localStorage.getItem(key);
  },

  set(key: string, value: string): void {
    if (!browser) {
      return;
    }
    localStorage.setItem(key, value);
  },

  remove(key: string): void {
    if (!browser) {
      return;
    }
    localStorage.removeItem(key);
  },
};
