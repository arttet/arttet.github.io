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
    node.innerHTML =
      '<h2><a data-heading-anchor="" href="#section" tabindex="-1">#</a>Section</h2>';

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
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const node = document.createElement('div');
    node.innerHTML = '<h2><a data-heading-anchor="" href="#section">#</a>Section</h2>';
    document.body.appendChild(node);
    const action = articleFocusPolicy(node);
    const anchor = node.querySelector<HTMLAnchorElement>(
      '[data-heading-anchor]'
    ) as HTMLAnchorElement;

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(anchor).toHaveFocus();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'article-anchor-activate',
        detail: { id: 'section' },
      })
    );
    action.destroy();
    document.body.removeChild(node);
    dispatchSpy.mockRestore();
    raf.mockRestore();
  });

  it('ignores keydown events other than Enter', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const node = document.createElement('div');
    node.innerHTML = '<h2><a class="anchor" href="#section">#</a>Section</h2>';
    const action = articleFocusPolicy(node);
    const anchor = node.querySelector<HTMLAnchorElement>('.anchor') as HTMLAnchorElement;

    anchor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space', bubbles: true }));

    expect(raf).not.toHaveBeenCalled();
    action.destroy();
    raf.mockRestore();
  });

  it('ignores Enter if target is not an anchor element', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const node = document.createElement('div');
    node.innerHTML = '<button data-heading-anchor="">Button</button>';
    const action = articleFocusPolicy(node);
    const btn = node.querySelector('button') as HTMLButtonElement;

    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(raf).not.toHaveBeenCalled();
    action.destroy();
    raf.mockRestore();
  });

  it('ignores Enter on anchor without the data-heading-anchor attribute', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const node = document.createElement('div');
    node.innerHTML = '<a href="#section">Link</a>';
    const action = articleFocusPolicy(node);
    const link = node.querySelector('a') as HTMLAnchorElement;

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(raf).not.toHaveBeenCalled();
    action.destroy();
    raf.mockRestore();
  });

  it('handles anchor class without id/hash correctly', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const node = document.createElement('div');
    node.innerHTML = '<a data-heading-anchor="" href="">#</a>';
    document.body.appendChild(node);
    const action = articleFocusPolicy(node);
    const link = node.querySelector('[data-heading-anchor]') as HTMLAnchorElement;

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(link).toHaveFocus();
    // Dispatch event shouldn't be called since id is empty
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'article-anchor-activate' })
    );

    action.destroy();
    document.body.removeChild(node);
    dispatchSpy.mockRestore();
    raf.mockRestore();
  });

  it('does not move focus for pointer activation', () => {
    const raf = vi.fn();
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = raf;

    const node = document.createElement('div');
    node.innerHTML = '<h2><a class="anchor" href="#section">#</a>Section</h2>';
    const action = articleFocusPolicy(node);
    const anchor = node.querySelector<HTMLAnchorElement>('.anchor') as HTMLAnchorElement;

    anchor.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(raf).not.toHaveBeenCalled();
    action.destroy();
    window.requestAnimationFrame = originalRaf;
  });
});
