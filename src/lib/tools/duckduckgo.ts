// tools/duckduckgo.ts
import { z } from 'zod';
import { defineTool } from './types';

export const duckDuckGoInstant = defineTool({
  name: 'ddg.instant',
  description: 'DuckDuckGo Instant Answer API (definitions/snippets, not full search)',
  inputSchema: z.object({
    query: z.string().min(1),
  }),
  async execute({ query }) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ddg instant ${res.status}`);
    const json = await res.json();
    return {
      heading: json.Heading,
      abstract: json.AbstractText,
      url: json.AbstractURL || json.Redirect,
      related: (json.RelatedTopics || []).slice(0, 10).map((t: any) => ({
        text: t.Text ?? t?.Name,
        url: t.FirstURL ?? t?.Topics?.[0]?.FirstURL,
      })),
    };
  },
});
