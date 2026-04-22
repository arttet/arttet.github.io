import {
  buildIndex,
  type SearchPayload,
  type SearchResult,
  search as searchIndex,
} from '../lib/index';

class SearchModel {
  open = $state(false);
  query = $state('');
  results = $state<SearchResult[]>([]);
  selected = $state(0);
  indexed = false;
  tags = $state<{ name: string; count: number }[]>([]);
  showAllTags = $state(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  async ensureIndex() {
    if (this.indexed) {
      return;
    }

    const response = await fetch('/api/search.json');
    const data: SearchPayload = await response.json();
    await buildIndex(data);

    const tagCounts = new Map<string, number>();
    for (const post of data.posts) {
      for (const t of post.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }

    this.tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    this.indexed = true;
  }

  async openPalette() {
    this.open = true;
    await this.ensureIndex();
  }

  close() {
    this.open = false;
    this.query = '';
    this.results = [];
    this.selected = 0;
    this.showAllTags = false;
    clearTimeout(this.timer);
  }

  async executeSearch() {
    this.selected = 0;
    if (!this.query.trim()) {
      this.results = [];
      return;
    }

    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      this.results = await searchIndex(this.query);
    }, 150);
  }
}

export const searchModel = new SearchModel();
