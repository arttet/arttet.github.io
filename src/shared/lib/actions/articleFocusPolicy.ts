function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return;
  const link = event.target instanceof HTMLAnchorElement ? event.target : null;
  if (!link?.classList.contains('anchor')) return;

  requestAnimationFrame(() => link.focus({ preventScroll: true }));
}

export function articleFocusPolicy(node: HTMLElement) {
  function sync() {
    for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (link.classList.contains('anchor')) {
        link.removeAttribute('tabindex');
        continue;
      }
      link.tabIndex = -1;
    }
  }

  sync();
  node.addEventListener('keydown', onKeyDown);

  return {
    update() {
      sync();
    },
    destroy() {
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}
