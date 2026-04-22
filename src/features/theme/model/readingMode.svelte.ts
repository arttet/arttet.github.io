import { site } from '$shared/config/site';
import { storage } from '$shared/lib/storage';

const KEY = site.theme.storageKeys.readingMode;

class ReadingModeState {
  #v = $state(storage.get(KEY) === 'true');

  get value() {
    return this.#v;
  }

  set value(v: boolean) {
    this.#v = v;
    storage.set(KEY, String(v));
  }

  toggle() {
    this.value = !this.#v;
  }
}

export const readingMode = new ReadingModeState();
