import { backgroundMode } from '../backgroundMode.svelte';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

class BackgroundState {
  #glassRect = $state<Rect | null>(null);

  get glassRect() {
    return this.#glassRect;
  }

  set glassRect(v: Rect | null) {
    this.#glassRect = v;
  }

  get mode() {
    return backgroundMode.value;
  }
}

export const backgroundState = new BackgroundState();
