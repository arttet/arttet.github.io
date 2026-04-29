import { describe, expect, it } from 'vitest';
import { codeTabs } from './codeTabs';

function setup() {
  const node = document.createElement('div');
  node.innerHTML = `
    <div data-code-tabs>
      <div role="tablist" aria-label="Code examples">
        <button type="button" role="tab" id="tab-0" aria-controls="panel-0" aria-selected="true" tabindex="0">Go</button>
        <button type="button" role="tab" id="tab-1" aria-controls="panel-1" aria-selected="false" tabindex="0">Rust</button>
      </div>
      <div role="tabpanel" id="panel-0" data-code-tabs-content><pre><code>go</code></pre></div>
      <div role="tabpanel" id="panel-1" data-code-tabs-content hidden><pre><code>rust</code></pre></div>
    </div>
  `;
  document.body.appendChild(node);
  const action = codeTabs(node);
  const tabs = Array.from(node.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(node.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

  return { action, node, panels, tabs };
}

describe('codeTabs action', () => {
  it('keeps the active panel when another tab receives focus', () => {
    const { action, node, panels, tabs } = setup();

    tabs[1].focus();

    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('tabindex', '0');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(panels[0]).not.toHaveAttribute('hidden');
    expect(panels[1]).toHaveAttribute('hidden');

    action.destroy();
    document.body.removeChild(node);
  });

  it('switches panels when a focused tab is activated with Enter', () => {
    const { action, node, panels, tabs } = setup();

    tabs[1].focus();
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(panels[0]).toHaveAttribute('hidden');
    expect(panels[1]).not.toHaveAttribute('hidden');

    action.destroy();
    document.body.removeChild(node);
  });

  it('supports arrow key navigation between tabs', () => {
    const { action, node, tabs } = setup();

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    action.destroy();
    document.body.removeChild(node);
  });
});
