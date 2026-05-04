import { createMarkdownConfig } from './config/mdsvex/index.js';

const { config, build, preprocess } = await createMarkdownConfig();

export const markdownBuild = build;
export const markdownPreprocess = preprocess;
export default config;
