const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]',
].join(',');

export function visibleTabScope(node: HTMLElement, visible = true) {
  const originalTabIndex = new Map<HTMLElement, string | null>();
  let requestedVisible = visible;

  function focusables() {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }

  function disable(el: HTMLElement) {
    if (!originalTabIndex.has(el)) {
      originalTabIndex.set(el, el.getAttribute('tabindex'));
    }
    el.setAttribute('tabindex', '-1');
  }

  function restore(el: HTMLElement) {
    if (!originalTabIndex.has(el)) {
      return;
    }

    const previous = originalTabIndex.get(el) ?? null;
    if (previous === null) {
      el.removeAttribute('tabindex');
    } else {
      el.setAttribute('tabindex', previous);
    }
    originalTabIndex.delete(el);
  }

  function sync() {
    const enabled = requestedVisible;

    for (const el of focusables()) {
      if (enabled) {
        restore(el);
      } else {
        disable(el);
      }
    }
  }

  const observer =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(() => sync());

  observer?.observe(node);
  sync();

  return {
    update(nextVisible = true) {
      requestedVisible = nextVisible;
      sync();
    },
    destroy() {
      observer?.disconnect();
      for (const el of focusables()) {
        restore(el);
      }
    },
  };
}
