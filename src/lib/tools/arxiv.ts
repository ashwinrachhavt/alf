// tools/arxiv.ts
import { z } from 'zod';
import { defineTool } from './types';

export const arxivSearch = defineTool({
  name: 'arxiv.search',
  description: 'Search arXiv via Atom API (title/author/category queries)',
  inputSchema: z.object({
    query: z.string().min(1).describe('arXiv query (e.g., "ti:diffusion AND cat:cs.CL")'),
    start: z.number().int().min(0).default(0),
    maxResults: z.number().int().min(1).max(50).default(10),
    sortBy: z.enum(['relevance', 'lastUpdatedDate', 'submittedDate']).default('relevance'),
    sortOrder: z.enum(['ascending', 'descending']).default('descending'),
  }),
  async execute({ query, start, maxResults, sortBy, sortOrder }) {
    const url = new URL('https://export.arxiv.org/api/query');
    url.searchParams.set('search_query', query);
    url.searchParams.set('start', String(start));
    url.searchParams.set('max_results', String(maxResults));
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'your-app (contact@email)' },
    });
    if (!res.ok) throw new Error(`arxiv ${res.status}`);
    const xml = await res.text();

    // Tiny XML parse without deps:
    const entries = xml.split('<entry>').slice(1).map(e => '<entry>' + e);
    const pick = (s: string, tag: string) =>
      (s.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1]?.trim();

    return entries.map((e) => {
      const id = pick(e, 'id') ?? '';
      const title = (pick(e, 'title') ?? '').replace(/\s+/g, ' ');
      const summary = (pick(e, 'summary') ?? '').replace(/\s+/g, ' ');
      const published = pick(e, 'published');
      const updated = pick(e, 'updated');
      const pdf = (e.match(/href="([^"]+pdf)"/) || [])[1];
      const authors = Array.from(e.matchAll(/<name>(.*?)<\/name>/g)).map(m => m[1]);
      return { id, title, summary, published, updated, pdf, authors };
    });
  },
});
