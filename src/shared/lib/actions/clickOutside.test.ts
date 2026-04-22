import { describe, expect, it, vi } from 'vitest';
import { clickOutside } from './clickOutside';

describe('clickOutside action', () => {
  it('calls callback when clicking outside', async () => {
    const callback = vi.fn();
    const node = document.createElement('div');
    document.body.appendChild(node);

    vi.useFakeTimers();
    const action = clickOutside(node, callback);

    // Simulate click outside
    const other = document.createElement('span');
    document.body.appendChild(other);

    // Process the setTimeout in action
    vi.advanceTimersByTime(1);

    // Dispatch event on document to ensure it's caught
    document.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(callback).toHaveBeenCalled();

    action.destroy();
    document.body.removeChild(node);
    document.body.removeChild(other);
    vi.useRealTimers();
  });

  it('does not call callback when clicking inside', async () => {
    const callback = vi.fn();
    const node = document.createElement('div');
    const child = document.createElement('span');
    node.appendChild(child);
    document.body.appendChild(node);

    vi.useFakeTimers();
    clickOutside(node, callback);

    vi.advanceTimersByTime(1);

    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    child.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
