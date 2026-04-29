import { describe, expect, it, vi } from 'vitest';
import { articleFocusPolicy } from './articleFocusPolicy';

describe('articleFocusPolicy action', () => {
  it('removes article links from keyboard tab order', () => {
    const node = document.createElement('div');
    node.innerHTML = '<p><a href="/inside">Inside article</a></p>';

    articleFocusPolicy(node);

    expect(node.querySelector('a')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps heading anchors in keyboard tab order', () => {
    const node = document.createElement('div');
    node.innerHTML = '<h2><a class="anchor" href="#section" tabindex="-1">#</a>Section</h2>';

    articleFocusPolicy(node);

    expect(node.querySelector('a')).not.toHaveAttribute('tabindex');
  });

  it('updates new links', () => {
    const node = document.createElement('div');
    const action = articleFocusPolicy(node);

    node.innerHTML = '<a href="/later">Later</a>';
    action.update();

    expect(node.querySelector('a')).toHaveAttribute('tabindex', '-1');
  });

  it('keeps focus on heading anchors after Enter activation', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const node = document.createElement('div');
    node.innerHTML = '<h2><a class="anchor" href="#section">#</a>Section</h2>';
    document.body.appendChild(node);
    const action = articleFocusPolicy(node);
    const anchor = node.querySelector<HTMLAnchorElement>('.anchor') as HTMLAnchorElement;

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(anchor).toHaveFocus();
    action.destroy();
    document.body.removeChild(node);
    raf.mockRestore();
  });

  it('does not move focus for pointer activation', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const node = document.createElement('div');
    node.innerHTML = '<h2><a class="anchor" href="#section">#</a>Section</h2>';
    const action = articleFocusPolicy(node);
    const anchor = node.querySelector<HTMLAnchorElement>('.anchor') as HTMLAnchorElement;

    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(raf).not.toHaveBeenCalled();
    action.destroy();
    raf.mockRestore();
  });
});
