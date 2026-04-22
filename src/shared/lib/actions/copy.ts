export function copy(node: HTMLElement) {
  const added: { btn: HTMLButtonElement; handler: () => void }[] = [];
  const copyIcon =
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
  const checkIcon =
    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

  const addCopyButton = (
    target: HTMLElement,
    content: string,
    label: string,
    ariaLabel: string
  ) => {
    if (target.querySelector('.copy-btn')) {
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = `${copyIcon}<span>${label}</span>`;
    btn.setAttribute('aria-label', ariaLabel);

    const clickHandler = async () => {
      try {
        await navigator.clipboard.writeText(content.trim());
        btn.innerHTML = `${checkIcon}<span>Copied!</span>`;
        btn.dataset.copied = '1';
        btn.style.color = 'var(--color-accent)';
        btn.style.borderColor = 'var(--color-accent)';
        btn.style.zIndex = '100';
        btn.style.pointerEvents = 'auto';
        setTimeout(() => {
          btn.innerHTML = `${copyIcon}<span>${label}</span>`;
          delete btn.dataset.copied;
          btn.style.color = '';
          btn.style.borderColor = '';
          btn.style.zIndex = '';
          btn.style.pointerEvents = '';
        }, 1800);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Clipboard copy failed:', e);
      }
    };

    btn.addEventListener('click', clickHandler);
    target.appendChild(btn);
    added.push({ btn, handler: clickHandler });
  };

  const init = () => {
    // Shiki code blocks
    const codeBlocks = node.querySelectorAll<HTMLPreElement>('pre.shiki');

    for (const pre of codeBlocks) {
      const lang = pre.dataset.language;
      const label = lang && lang !== 'text' ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Copy';
      const text = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
      addCopyButton(pre, text, label, 'Copy code');
    }

    const copyTargets = node.querySelectorAll<HTMLElement>('[data-copy-content]');

    for (const target of copyTargets) {
      const encoded = target.dataset.copyContent;
      if (!encoded) {
        continue;
      }

      const label = target.dataset.copyLabel?.trim() || 'Copy';
      addCopyButton(target, atob(encoded), label, `Copy ${label}`);
    }
  };

  init();

  return {
    update() {
      init();
    },
    destroy() {
      for (const { btn, handler } of added) {
        btn.removeEventListener('click', handler);
        btn.remove();
      }
    },
  };
}
