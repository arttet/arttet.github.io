import { site } from '$shared/config/site';
import { storage } from '$shared/lib/storage';
import type { ModeName } from './core/BackgroundScene';

const KEY = site.theme.storageKeys.backgroundMode;
const DEFAULT = site.theme.defaultBackground;
const valid: ModeName[] = ['particles', 'contours', 'flow'];

class BackgroundModeState {
  #v = $state<ModeName>(
    (valid.includes(storage.get(KEY) as ModeName)
      ? (storage.get(KEY) as ModeName)
      : DEFAULT) as ModeName
  );

  get value() {
    return this.#v;
  }

  set value(v: ModeName) {
    this.#v = v;
    storage.set(KEY, v);
  }
}

export const backgroundMode = new BackgroundModeState();
