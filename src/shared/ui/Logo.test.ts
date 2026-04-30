import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Logo from './Logo.svelte';

describe('Logo', () => {
  it('renders with default props', () => {
    render(Logo);
    const img = screen.getByAltText('logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('w-10');
    expect(img).toHaveClass('h-10');
    expect(img).toHaveClass('invert');
    expect(img).toHaveClass('dark:invert-0');
  });

  it('applies custom size and shadow', () => {
    render(Logo, { size: 'w-20 h-20', shadow: 'shadow-lg' });
    const img = screen.getByAltText('logo');
    expect(img).toHaveClass('w-20');
    expect(img).toHaveClass('h-20');
    expect(img).toHaveClass('shadow-lg');
  });
});
