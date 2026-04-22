class BoolState {
  #v = $state(false);
  get value() {
    return this.#v;
  }
  set value(v: boolean) {
    this.#v = v;
  }
}

class PositionsState {
  #v = $state<{ x: number; y: number }[]>([]);
  get value() {
    return this.#v;
  }
  set value(v: { x: number; y: number }[]) {
    this.#v = v;
  }
}

export const navAnchored = new BoolState();
export const navAnchorPositions = new PositionsState();
