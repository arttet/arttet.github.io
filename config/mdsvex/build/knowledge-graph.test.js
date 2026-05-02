import { describe, expect, it } from 'vitest';
import { createKnowledgeGraph, knowledgeGraphVersion } from './knowledge-graph.js';

describe('knowledge graph', () => {
  it('creates deterministic post and tag nodes', () => {
    const graph = createKnowledgeGraph([
      {
        slug: 'b',
        title: 'B',
        created: '2026-04-20',
        tags: ['Svelte', 'Blog'],
        readingTime: 2,
      },
      {
        slug: 'a',
        title: 'A',
        created: '2026-04-21',
        updated: '2026-04-22',
        tags: ['Blog'],
        readingTime: 1,
      },
    ]);

    expect(graph.version).toBe(knowledgeGraphVersion);
    expect(graph.nodes).toEqual([
      {
        id: 'post:a',
        type: 'post',
        label: 'A',
        meta: {
          slug: 'a',
          created: '2026-04-21',
          updated: '2026-04-22',
          tags: ['Blog'],
        },
      },
      {
        id: 'post:b',
        type: 'post',
        label: 'B',
        meta: {
          slug: 'b',
          created: '2026-04-20',
          updated: undefined,
          tags: ['Blog', 'Svelte'],
        },
      },
      {
        id: 'tag:blog',
        type: 'tag',
        label: 'Blog',
        meta: {
          slug: 'blog',
        },
      },
      {
        id: 'tag:svelte',
        type: 'tag',
        label: 'Svelte',
        meta: {
          slug: 'svelte',
        },
      },
    ]);
  });

  it('creates deterministic graph edges', () => {
    const graph = createKnowledgeGraph([
      {
        slug: 'z',
        title: 'Z',
        created: '2026-04-20',
        tags: ['svelte', 'blog'],
        readingTime: 2,
      },
      {
        slug: 'a',
        title: 'A',
        created: '2026-04-21',
        tags: ['blog', 'svelte', 'performance'],
        readingTime: 1,
      },
    ]);

    expect(graph.edges).toEqual([
      {
        from: 'post:a',
        to: 'post:z',
        type: 'related_by_tag',
        meta: {
          weight: 2,
          tags: ['blog', 'svelte'],
        },
      },
      {
        from: 'post:a',
        to: 'tag:blog',
        type: 'tagged_with',
      },
      {
        from: 'post:a',
        to: 'tag:performance',
        type: 'tagged_with',
      },
      {
        from: 'post:a',
        to: 'tag:svelte',
        type: 'tagged_with',
      },
      {
        from: 'post:z',
        to: 'tag:blog',
        type: 'tagged_with',
      },
      {
        from: 'post:z',
        to: 'tag:svelte',
        type: 'tagged_with',
      },
    ]);
  });

  it('creates heading, code, image nodes and edges from extracted data', () => {
    const graph = createKnowledgeGraph([
      {
        slug: 'post-a',
        title: 'A',
        created: '2026-04-20',
        tags: ['svelte'],
        readingTime: 1,
        extracted: {
          headings: ['Intro', 'Setup'],
          codeLangs: ['js', 'sh'],
          images: ['/img/a.png'],
          hasMath: true,
          hasMermaid: true,
        },
      },
    ]);

    const nodeIds = graph.nodes.map((n) => n.id);
    expect(nodeIds).toContain('heading:post-a#intro');
    expect(nodeIds).toContain('heading:post-a#setup');
    expect(nodeIds).toContain('code:js');
    expect(nodeIds).toContain('code:sh');
    expect(nodeIds).toContain('image:/img/a.png');

    const edgeTypes = graph.edges.map((e) => e.type);
    expect(edgeTypes).toContain('references_heading');
    expect(edgeTypes).toContain('contains_code');
    expect(edgeTypes).toContain('contains_image');
    expect(edgeTypes).toContain('contains_math');
    expect(edgeTypes).toContain('contains_mermaid');
  });

  it('does not mutate input post tags', () => {
    const posts = [
      {
        slug: 'a',
        title: 'A',
        created: '2026-04-20',
        tags: ['z', 'a'],
        readingTime: 1,
      },
    ];

    createKnowledgeGraph(posts);

    expect(posts[0].tags).toEqual(['z', 'a']);
  });
});
