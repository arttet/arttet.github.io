import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PostFooter from './PostFooter.svelte';

describe('PostFooter', () => {
  it('renders navigation links', () => {
    render(PostFooter);
    expect(screen.getByText('← All posts')).toBeInTheDocument();
    expect(screen.getByText('↑ Top')).toBeInTheDocument();
  });
});
