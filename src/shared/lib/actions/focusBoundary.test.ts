import { describe, expect, it, vi } from 'vitest';
import { focusBoundary } from './focusBoundary';

function visibleRect() {
  return {
    width: 20,
    height: 20,
    top: 0,
    right: 20,
    bottom: 20,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

function invisibleRect() {
  return {
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('focusBoundary action', () => {
  it('ignores elements with zero width/height or opacity 0', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/" style="opacity: 0;">Hidden</a>
      <button type="button">Visible</button>
      <input type="text" />
    `;
    document.body.appendChild(node);

    const hidden = node.querySelector('a') as HTMLAnchorElement;
    hidden.getBoundingClientRect = visibleRect; // Will fail opacity check
    const visible = node.querySelector('button') as HTMLButtonElement;
    visible.getBoundingClientRect = visibleRect;
    const zeroSize = node.querySelector('input') as HTMLInputElement;
    zeroSize.getBoundingClientRect = invisibleRect; // Will fail size check

    const action = focusBoundary(node);

    // Press Tab from 'Visible', it should wrap to 'Visible' because it's the only one
    visible.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    visible.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(visible);

    action.destroy();
    document.body.removeChild(node);
  });
  it('wraps Tab from the last focusable element to the first', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/">Home</a>
      <button type="button">Top</button>
    `;
    document.body.appendChild(node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const first = node.querySelector('a') as HTMLAnchorElement;
    const last = node.querySelector('button') as HTMLButtonElement;

    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    last.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);

    action.destroy();
    document.body.removeChild(node);
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/">Home</a>
      <button type="button">Top</button>
    `;
    document.body.appendChild(node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const first = node.querySelector('a') as HTMLAnchorElement;
    const last = node.querySelector('button') as HTMLButtonElement;

    first.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    first.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);

    action.destroy();
    document.body.removeChild(node);
  });

  it('wraps Tab when active is markedEnd', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/">Home</a>
      <button type="button" data-focus-boundary-end>Top</button>
    `;
    document.body.appendChild(node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const end = node.querySelector('button') as HTMLButtonElement;

    end.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    end.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();

    action.destroy();
    document.body.removeChild(node);
  });

  it('wraps Shift+Tab when active is markedStart', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/" data-focus-boundary-start>Home</a>
      <button type="button">Top</button>
    `;
    document.body.appendChild(node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const start = node.querySelector('a') as HTMLAnchorElement;

    start.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    start.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();

    action.destroy();
    document.body.removeChild(node);
  });

  it('starts focus at the first element when focus is outside the boundary with Shift+Tab', () => {
    const outside = document.createElement('button');
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/blog">Blog</a>
      <button type="button">Settings</button>
    `;
    document.body.append(outside, node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const last = node.querySelector('button') as HTMLButtonElement;

    outside.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);

    action.destroy();
    outside.remove();
    node.remove();
  });

  it('ignores Tab events when no focusable elements are present', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const action = focusBoundary(node);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();

    action.destroy();
    node.remove();
  });

  it('ignores non-Tab keyboard events', () => {
    const node = document.createElement('div');
    node.innerHTML = '<a href="/">Home</a>';
    document.body.appendChild(node);
    for (const el of node.querySelectorAll<HTMLElement>('a')) {
      el.getBoundingClientRect = visibleRect;
    }
    const action = focusBoundary(node);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();

    action.destroy();
    node.remove();
  });

  it('ignores already handled Tab events', () => {
    const node = document.createElement('div');
    node.innerHTML = '<button type="button">Only</button>';
    document.body.appendChild(node);

    const button = node.querySelector('button') as HTMLButtonElement;
    button.getBoundingClientRect = visibleRect;

    const action = focusBoundary(node);
    button.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    button.addEventListener('keydown', (e) => e.preventDefault(), { once: true });
    vi.clearAllMocks();
    const focusSpy = vi.spyOn(button, 'focus');
    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(focusSpy).not.toHaveBeenCalled();

    action.destroy();
    document.body.removeChild(node);
  });

  it('does not run while a modal dialog is open', () => {
    const node = document.createElement('div');
    const dialog = document.createElement('div');
    node.innerHTML = '<a href="/blog">Blog</a>';
    dialog.setAttribute('aria-modal', 'true');
    document.body.append(node, dialog);

    const link = node.querySelector('a') as HTMLAnchorElement;
    link.getBoundingClientRect = visibleRect;

    const action = focusBoundary(node);
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();

    action.destroy();
    node.remove();
    dialog.remove();
  });

  it('starts focus at the first element when focus is outside the boundary', () => {
    const outside = document.createElement('button');
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/blog">Blog</a>
      <button type="button">Settings</button>
    `;
    document.body.append(outside, node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const first = node.querySelector('a') as HTMLAnchorElement;

    outside.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(first);

    action.destroy();
    outside.remove();
    node.remove();
  });

  it('wraps from an explicit boundary end to an explicit boundary start', () => {
    const node = document.createElement('div');
    node.innerHTML = `
      <a href="/blog" data-focus-boundary-start>Blog</a>
      <a href="/about">About</a>
      <a href="https://github.com" data-focus-boundary-end>GitHub</a>
      <button type="button">Hidden later control</button>
    `;
    document.body.appendChild(node);

    for (const el of node.querySelectorAll<HTMLElement>('a, button')) {
      el.getBoundingClientRect = visibleRect;
    }

    const action = focusBoundary(node);
    const start = node.querySelector('[data-focus-boundary-start]') as HTMLElement;
    const end = node.querySelector('[data-focus-boundary-end]') as HTMLElement;

    end.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(document.activeElement).toBe(start);

    action.destroy();
    node.remove();
  });
});
