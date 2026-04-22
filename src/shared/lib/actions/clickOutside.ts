export function clickOutside(node: HTMLElement, callback: () => void) {
  const handleClick = (e: MouseEvent) => {
    if (!node.contains(e.target as Node)) {
      callback();
    }
  };

  const id = setTimeout(() => document.addEventListener('click', handleClick), 0);
  return {
    destroy() {
      clearTimeout(id);
      document.removeEventListener('click', handleClick);
    },
  };
}
