import { createMarkdownConfig } from './config/mdsvex/index.js';

const { config, ctx } = await createMarkdownConfig();

export const markdownCtx = ctx;
export default config;
