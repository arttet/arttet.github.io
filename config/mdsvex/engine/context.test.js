import { describe, expect, it } from 'vitest';
import {
  createBuildContext,
  createPostContext,
  resolvePassContext,
  stateRead,
  stateWrite,
} from './context.js';
import { VALIDATION_MODE } from '../constants.js';

describe('context', () => {
  describe('createBuildContext', () => {
    it('creates a build context with typed state', () => {
      const build = createBuildContext(VALIDATION_MODE.STRICT);
      expect(build.state).toEqual({});
      expect(build.diagnostics.list()).toEqual([]);
    });
  });

  describe('createPostContext', () => {
    it('creates a per-post context with typed state', () => {
      const post = createPostContext('/content/blog/2024/test.md');
      expect(post.file).toBe('/content/blog/2024/test.md');
      expect(post.state).toEqual({});
    });
  });

  describe('stateRead / stateWrite', () => {
    it('reads and writes typed state keys', () => {
      const build = createBuildContext(VALIDATION_MODE.STRICT);
      const slugs = new Set(['a', 'b']);

      stateWrite(build.state, 'knownSlugs', slugs);
      expect(stateRead(build.state, 'knownSlugs')).toBe(slugs);
      expect(stateRead(build.state, 'draftSlugs')).toBeUndefined();
    });
  });

  describe('resolvePassContext', () => {
    it('merges build and post state for resolved files', () => {
      const build = createBuildContext(VALIDATION_MODE.STRICT);
      stateWrite(build.state, 'knownSlugs', new Set(['global']));

      const post = createPostContext('/content/blog/2024/post.md');
      stateWrite(post.state, 'draftSlugs', new Set(['draft']));
      build.postContexts.set('/content/blog/2024/post.md', post);

      const ctx = resolvePassContext(build, '/content/blog/2024/post.md');
      expect(stateRead(ctx.state, 'knownSlugs')).toEqual(new Set(['global']));
      expect(stateRead(ctx.state, 'draftSlugs')).toEqual(new Set(['draft']));
    });

    it('falls back to build state when file is not tracked', () => {
      const build = createBuildContext(VALIDATION_MODE.STRICT);
      stateWrite(build.state, 'knownSlugs', new Set(['fallback']));

      const ctx = resolvePassContext(build, '/content/blog/2024/unknown.md');
      expect(stateRead(ctx.state, 'knownSlugs')).toEqual(new Set(['fallback']));
    });
  });
});
