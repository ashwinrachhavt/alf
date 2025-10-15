// tools/wikipedia.ts
import { z } from 'zod';
import { defineTool } from './types';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';

export const wikipediaSearch = defineTool({
  name: 'wikipedia.search',
  description: 'Full-text search on Wikipedia via MediaWiki Action API',
  inputSchema: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  async execute({ query, limit }) {
    const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=${limit}&utf8=&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wikipedia search ${res.status}`);
    const json = await res.json();
    return (json?.query?.search ?? []).map((r: any) => ({
      title: r.title,
      pageId: r.pageid,
      snippet: r.snippet,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/\s/g, '_'))}`,
    }));
  },
});

export const wikipediaSummary = defineTool({
  name: 'wikipedia.summary',
  description: 'Get a concise page summary from Wikimedia REST API',
  inputSchema: z.object({ title: z.string().min(1) }),
  async execute({ title }) {
    const res = await fetch(`${WIKI_SUMMARY}/${encodeURIComponent(title)}`);
    if (!res.ok) throw new Error(`wikipedia summary ${res.status}`);
    const json = await res.json();
    // json has title, extract, description, content_urls, thumbnail, etc.
    return {
      title: json.title,
      extract: json.extract,
      description: json.description,
      url: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    };
  },
});
