function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') {
    return;
  }
  const link = event.target instanceof HTMLAnchorElement ? event.target : null;
  if (!link?.hasAttribute('data-heading-anchor')) {
    return;
  }

  const id = link.hash.slice(1);
  requestAnimationFrame(() => {
    link.focus({ preventScroll: true });
    if (id) {
      window.dispatchEvent(new CustomEvent('article-anchor-activate', { detail: { id } }));
    }
  });
}

export function articleFocusPolicy(node: HTMLElement) {
  function sync() {
    for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (link.hasAttribute('data-heading-anchor')) {
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
