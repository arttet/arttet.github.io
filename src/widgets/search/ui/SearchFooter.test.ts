import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SearchFooter from './SearchFooter.svelte';

describe('SearchFooter', () => {
  it('renders keyboard shortcuts', () => {
    render(SearchFooter);
    expect(screen.getByText('navigate')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('close')).toBeInTheDocument();
  });
});
