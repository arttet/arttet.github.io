import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { darkCodeTheme, lightCodeTheme } from '../model/codeTheme.svelte';
import { theme } from '../model/theme.svelte';
import CodeThemeList from './CodeThemeList.svelte';

describe('CodeThemeList', () => {
  beforeEach(() => {
    theme.toggle();
    if (theme.current !== 'dark') {
      theme.toggle();
    }
    darkCodeTheme.value = 'catppuccin-mocha';
    lightCodeTheme.value = 'catppuccin-latte';
  });

  it('renders dark themes and updates selected code theme', async () => {
    render(CodeThemeList);

    expect(screen.getByText('Code theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Catppuccin Mocha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /GitHub Dark/i })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /GitHub Dark/i }));
    expect(darkCodeTheme.value).toBe('github-dark');
  });

  it('renders light themes when current theme is light', async () => {
    theme.toggle();
    render(CodeThemeList);

    expect(screen.getByRole('button', { name: /Catppuccin Latte/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /GitHub Light/i })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /GitHub Light/i }));
    expect(lightCodeTheme.value).toBe('github-light');
  });
});
