import { createMarkdownConfig } from './config/mdsvex/index.js';

const { config, ctx, preprocess } = await createMarkdownConfig();

export const markdownCtx = ctx;
export const markdownPreprocess = preprocess;
export default config;
