import { describe, expect, it } from 'vitest';
import { articleFocusPolicy } from './articleFocusPolicy';

describe('articleFocusPolicy action', () => {
  it('removes article links from keyboard tab order', () => {
    const node = document.createElement('div');
    node.innerHTML = '<p><a href="/inside">Inside article</a></p>';

    articleFocusPolicy(node);

    expect(node.querySelector('a')).toHaveAttribute('tabindex', '-1');
  });

  it('updates new links', () => {
    const node = document.createElement('div');
    const action = articleFocusPolicy(node);

    node.innerHTML = '<a href="/later">Later</a>';
    action.update();

    expect(node.querySelector('a')).toHaveAttribute('tabindex', '-1');
  });
});
