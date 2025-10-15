// tools/rss.ts
import { z } from 'zod';
import { defineTool } from './types';

// Very small RSS fetcher (no DOMParser in Node by default)
export const rssFetch = defineTool({
  name: 'rss.fetch',
  description: 'Fetch & parse an RSS/Atom feed into items',
  inputSchema: z.object({
    url: z.string().url(),
    maxItems: z.number().int().min(1).max(50).default(10),
  }),
  async execute({ url, maxItems }) {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`rss ${res.status}`);
    const xml = await res.text();
    // quick-and-dirty parse that handles RSS & Atom titles/links
    const items: any[] = [];
    const entryBlocks =
      xml.includes('<entry>') ? xml.split('<entry>').slice(1)
                              : xml.split('<item>').slice(1);

    for (const raw of entryBlocks.slice(0, maxItems)) {
      const block = (xml.includes('<entry>') ? '<entry>' : '<item>') + raw;
      const pick = (tag: string) =>
        (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')) || [])[1]?.trim();
      const urlMatch = block.match(/<link[^>]*>([^<]+)<\/link>/i)
        || block.match(/<link[^>]*href="([^"]+)"/i);
      items.push({
        title: pick('title')?.replace(/\s+/g, ' '),
        link: urlMatch?.[1],
        summary: pick('description') || pick('summary'),
        published: pick('pubDate') || pick('updated'),
      });
    }
    return items;
  },
});
