import { describe, expect, it, vi } from 'vitest';
import { focusTrap } from './focusTrap';

describe('focusTrap action', () => {
  it('traps focus inside the element', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <button id="first">First</button>
      <button id="last">Last</button>
    `;
    document.body.appendChild(node);

    const first = node.querySelector('#first') as HTMLButtonElement;
    const last = node.querySelector('#last') as HTMLButtonElement;

    focusTrap(node);

    // Case 1: Tab on last element should focus first
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    const preventDefault = vi.spyOn(tabEvent, 'preventDefault');

    node.dispatchEvent(tabEvent);

    expect(document.activeElement).toBe(first);
    expect(preventDefault).toHaveBeenCalled();

    // Case 2: Shift+Tab on first element should focus last
    first.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    const preventDefaultShift = vi.spyOn(shiftTabEvent, 'preventDefault');

    node.dispatchEvent(shiftTabEvent);

    expect(document.activeElement).toBe(last);
    expect(preventDefaultShift).toHaveBeenCalled();

    document.body.removeChild(node);
  });

  it('ignores non-Tab keys and containers without focusable elements', () => {
    const node = document.createElement('div');
    node.innerHTML = '<div>Plain content</div>';
    document.body.appendChild(node);

    const action = focusTrap(node);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const enterPreventDefault = vi.spyOn(enterEvent, 'preventDefault');
    node.dispatchEvent(enterEvent);
    expect(enterPreventDefault).not.toHaveBeenCalled();

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    const tabPreventDefault = vi.spyOn(tabEvent, 'preventDefault');
    node.dispatchEvent(tabEvent);
    expect(tabPreventDefault).not.toHaveBeenCalled();

    const removeSpy = vi.spyOn(node, 'removeEventListener');
    action.destroy();
    expect(removeSpy).toHaveBeenCalled();

    document.body.removeChild(node);
  });
});
