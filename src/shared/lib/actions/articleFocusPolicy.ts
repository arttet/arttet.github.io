export function articleFocusPolicy(node: HTMLElement) {
  function sync() {
    for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      link.tabIndex = -1;
    }
  }

  sync();

  return {
    update() {
      sync();
    },
  };
}
