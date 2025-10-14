// app/api/agents/research/route.ts
export const runtime = 'nodejs';           // streaming-friendly
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { openai } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import type { CoreMessage } from 'ai';
import { getFirecrawlClient } from '@/lib/firecrawl';

/* ---------- POST handler ---------- */
export async function POST(req: Request) {
  const { messages, query } = (await req.json().catch(() => ({}))) as {
    messages?: CoreMessage[];
    query?: string;
  };

  const userMessages = messages && messages.length
    ? messages
    : query
    ? [{ role: 'user' as const, content: query }]
    : [];

  const firecrawl = getFirecrawlClient();

  const system = `You are a Deep Research Agent.
Use the tools to: (1) searchWeb to gather 15–30 URLs, (2) rerank to pick ~8 best, (3) scrapeMany to collect concise text snippets, (4) synthesize a well-cited markdown report. Always include inline citations [n] and a Sources table.`;

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system,
    messages: userMessages,
    tools: {
      searchWeb: {
        description: 'Gather 15–30 candidate results for a query. Returns a normalized array of {url,title,snippet}.',
        inputSchema: z.object({ query: z.string().min(1) }),
        execute: async ({ query }) => {
          const res = await firecrawl.search(query);
          if (!res?.success) return JSON.stringify({ results: [] });
          const raw = res.data as any;
          const items: any[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.results)
              ? raw.results
              : Array.isArray(raw?.data)
                ? raw.data
                : [];
          const normalized = items
            .map((r) => ({
              url: r.url || r.link || r.href || r?.metadata?.url || '',
              title: r.title || r.name || r?.metadata?.title || '',
              snippet: r.snippet || r.description || r.summary || r?.metadata?.description || '',
            }))
            .filter((r) => r.url)
            .reduce((acc: any[], cur: any) => {
              if (!acc.some((a) => a.url === cur.url)) acc.push(cur);
              return acc;
            }, []);
          return JSON.stringify({ results: normalized.slice(0, 30) });
        },
      },
      rerank: {
        description: 'Rerank candidate URLs using OpenAI for this query. Returns topN with scores and reasons.',
        inputSchema: z.object({
          query: z.string(),
          candidates: z.array(z.object({ url: z.string().url(), title: z.string().optional(), snippet: z.string().optional() })),
          topN: z.number().int().min(1).max(20).default(8),
        }),
        execute: async ({ query, candidates, topN }) => {
          const prompt = `Query: ${query}\n\nCandidates (JSON):\n${JSON.stringify(candidates, null, 2)}\n\nTask: Rank candidates by (1) relevance, (2) authority/quality, (3) recency (if known). Return JSON with at most ${topN} entries sorted desc: { "ranked": [ { "url": string, "score": number, "reason": string } ] }`;
          try {
            const out = await generateText({ model: openai('gpt-4o-mini'), prompt, temperature: 0 });
            const json = JSON.parse(out.text.trim());
            if (json?.ranked && Array.isArray(json.ranked)) {
              return JSON.stringify({ ranked: json.ranked.slice(0, topN) });
            }
          } catch {}
          const simple = candidates.slice(0, topN).map((c: any) => ({ url: c.url, score: 0.5, reason: 'baseline' }));
          return JSON.stringify({ ranked: simple });
        },
      },
      scrapeMany: {
        description: 'Scrape multiple URLs via Firecrawl. Returns [{url,title,text}] with truncated text per doc.',
        inputSchema: z.object({ urls: z.array(z.string().url()), maxChars: z.number().int().min(500).max(12000).default(4000) }),
        execute: async ({ urls, maxChars }) => {
          const results: any[] = [];
          await Promise.allSettled(
            urls.map(async (u: string) => {
              const r = await firecrawl.scrape(u);
              if (!r?.success) return results.push({ url: u, title: '', text: '' });
              const d: any = r.data;
              const title = d?.title || d?.metadata?.title || '';
              let text: string = typeof d === 'string' ? d : (d?.markdown || d?.content || d?.text || d?.article?.content || d?.raw || JSON.stringify(d));
              if (typeof text !== 'string') text = JSON.stringify(text);
              results.push({ url: u, title, text: text.slice(0, maxChars) });
            })
          );
          return JSON.stringify({ docs: results });
        },
      },
    },
  });

  return result.toTextStreamResponse();
}
