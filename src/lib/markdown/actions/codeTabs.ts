function clampIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

const activeClasses = ['text-[--color-accent]', 'border-b-2', 'border-[--color-accent]'];
const inactiveClasses = ['text-[--code-accent]', 'opacity-70'];

export function codeTabs(node: HTMLElement, enabled = true) {
  if (!enabled) {
    return { update() {}, destroy() {} };
  }
  const cleanups: (() => void)[] = [];

  function initGroup(group: HTMLElement) {
    const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-code-tab]'));
    const panels = Array.from(group.querySelectorAll<HTMLElement>('[data-code-tabs-content]'));

    if (tabs.length === 0 || tabs.length !== panels.length) {
      return;
    }

    function activate(index: number) {
      const active = clampIndex(index, tabs.length);

      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === active;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = 0;
        tab.classList.toggle(activeClasses[0], selected);
        tab.classList.toggle(activeClasses[1], selected);
        tab.classList.toggle(activeClasses[2], selected);
        tab.classList.toggle(inactiveClasses[0], !selected);
        tab.classList.toggle(inactiveClasses[1], !selected);
      });

      panels.forEach((panel, panelIndex) => {
        panel.hidden = panelIndex !== active;
      });
    }

    const selected = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    activate(selected >= 0 ? selected : 0);

    tabs.forEach((tab, index) => {
      const onClick = () => activate(index);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(index);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          tabs[clampIndex(index + 1, tabs.length)]?.focus();
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          tabs[clampIndex(index - 1, tabs.length)]?.focus();
        } else if (event.key === 'Home') {
          event.preventDefault();
          tabs[0]?.focus();
        } else if (event.key === 'End') {
          event.preventDefault();
          tabs.at(-1)?.focus();
        }
      };

      tab.addEventListener('click', onClick);
      tab.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        tab.removeEventListener('click', onClick);
        tab.removeEventListener('keydown', onKeyDown);
      });
    });
  }

  for (const group of node.querySelectorAll<HTMLElement>('[data-code-tabs]')) {
    initGroup(group);
  }

  return {
    update() {},
    destroy() {
      for (const cleanup of cleanups) {
        cleanup();
      }
    },
  };
}
