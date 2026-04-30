import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StaticHtml from './StaticHtml.svelte';

describe('StaticHtml', () => {
  it('renders raw html', () => {
    render(StaticHtml, { html: '<div data-testid="raw">Hello</div>' });
    expect(screen.getByTestId('raw')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
