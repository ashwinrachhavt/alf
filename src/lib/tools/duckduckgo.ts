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
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DuckDuckGo instant error: ${res.status}`);
      const txt = await res.text();
      if (!txt) throw new Error("Empty response from DuckDuckGo");
      const json = JSON.parse(txt);
      return {
        heading: json?.Heading || "",
        abstract: json?.AbstractText || "",
        url: json?.AbstractURL || json?.Redirect || "",
        related: Array.isArray(json?.RelatedTopics)
          ? json.RelatedTopics.slice(0, 10).map((t: any) => ({
              text: t?.Text ?? t?.Name ?? "",
              url: t?.FirstURL ?? t?.Topics?.[0]?.FirstURL ?? "",
            }))
          : [],
      };
    } catch (err: any) {
      console.error("❌ DuckDuckGo fetch failed:", err.message);
      return { heading: "", abstract: "", url: "", related: [] };
    }
  },
});
