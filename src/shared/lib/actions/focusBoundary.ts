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
  '[tabindex]:not([tabindex^="-"])',
].join(',');

const START_ATTR = 'data-focus-boundary-start';
const END_ATTR = 'data-focus-boundary-end';

function isVisible(el: HTMLElement) {
  const style = getComputedStyle(el);

  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function focusableElements(node: HTMLElement) {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

export function focusBoundary(node: HTMLElement) {
  function focusStart() {
    const marked = node.querySelector<HTMLElement>(`[${START_ATTR}]`);
    if (marked && isVisible(marked)) {
      marked.focus();
      return;
    }

    focusableElements(node)[0]?.focus();
  }

  function focusEnd() {
    const marked = node.querySelector<HTMLElement>(`[${END_ATTR}]`);
    if (marked && isVisible(marked)) {
      marked.focus();
      return;
    }

    const focusables = focusableElements(node);
    focusables[focusables.length - 1]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || e.defaultPrevented) {
      return;
    }

    if (document.querySelector('[aria-modal="true"]')) {
      return;
    }

    const focusables = focusableElements(node);
    if (focusables.length === 0) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const markedStart = node.querySelector<HTMLElement>(`[${START_ATTR}]`);
    const markedEnd = node.querySelector<HTMLElement>(`[${END_ATTR}]`);

    if (!node.contains(active)) {
      e.preventDefault();
      if (e.shiftKey) {
        focusEnd();
      } else {
        focusStart();
      }
    } else if (e.shiftKey && active === markedStart) {
      e.preventDefault();
      focusEnd();
    } else if (!e.shiftKey && active === markedEnd) {
      e.preventDefault();
      focusStart();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
