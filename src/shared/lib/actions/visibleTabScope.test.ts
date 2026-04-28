import { describe, expect, it, vi } from 'vitest';
import { visibleTabScope } from './visibleTabScope';

const observe = vi.fn();
const disconnect = vi.fn();

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe = observe;
    disconnect = disconnect;
  }
);

describe('visibleTabScope action', () => {
  it('removes focusable children from tab order when hidden and restores them when visible', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/blog">Blog</a>
      <button type="button">Search</button>
      <a href="/legal" tabindex="-1">Legal</a>
    `;

    const action = visibleTabScope(node, false);
    const [blog, search, legal] = Array.from(node.querySelectorAll<HTMLElement>('a, button'));

    expect(blog).toHaveAttribute('tabindex', '-1');
    expect(search).toHaveAttribute('tabindex', '-1');
    expect(legal).toHaveAttribute('tabindex', '-1');

    action.update(true);

    expect(blog).not.toHaveAttribute('tabindex');
    expect(search).not.toHaveAttribute('tabindex');
    expect(legal).toHaveAttribute('tabindex', '-1');

    action.destroy();
  });

  it('restores controls immediately when the scope is marked visible', () => {
    const node = document.createElement('div');
    node.innerHTML = '<button type="button">Home</button>';

    const action = visibleTabScope(node, false);
    const button = node.querySelector('button') as HTMLButtonElement;

    expect(button).toHaveAttribute('tabindex', '-1');

    action.update(true);

    expect(button).not.toHaveAttribute('tabindex');

    action.destroy();
  });
});
