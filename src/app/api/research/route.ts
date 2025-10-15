// app/api/research/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from 'ai';
import { z } from 'zod';

// Helper functions
async function tavilySearch(query: string, maxResults = 6) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_images: false,
      max_results: Math.min(maxResults, 10),
    }),
  });
  if (!res.ok) throw new Error(`Tavily error ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

async function fetchPage(url: string) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const MAX = 14000;
  return { url, text: text.slice(0, MAX) };
}

function extractLinks(html: string) {
  const urls = new Set<string>();
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/gi)) {
    urls.add(m[1]);
  }
  return Array.from(urls).slice(0, 25);
}

// Allow streaming up to 60s
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Gracefully handle invalid or missing body
  let messages: UIMessage[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) {
      messages = body.messages;
    } else if (body?.query) {
      messages = [
        {
          id: crypto.randomUUID(),
          role: 'user',
          parts: [{ type: 'text', text: body.query }],
        },
      ];
    } else {
      messages = [];
    }
  } catch {
    messages = [];
  }


  const result = streamText({
    model: openai('gpt-4o'),
    system: [
      'You are a careful, no-nonsense research assistant.',
      'Do iterative web research using the provided tools.',
      'Cite URLs inline like [^1] and produce a final SOURCES list.',
      'Prefer primary sources; deduplicate links; avoid speculation.',
    ].join(' '),
    messages: convertToModelMessages(messages),
    tools: {
      webSearch: tool({
        description: 'Search the web for relevant sources.',
        inputSchema: z.object({
          query: z.string().describe('the search query'),
          maxResults: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ query, maxResults }) => {
          const results = await tavilySearch(query, maxResults ?? 6);
          return { results };
        },
      }),
      getPage: tool({
        description: 'Fetch a URL and return extracted plain text.',
        inputSchema: z.object({ url: z.string().url() }),
        execute: async ({ url }) => {
          const { text } = await fetchPage(url);
          return { url, text };
        },
      }),
      extractLinks: tool({
        description: 'Extract outbound links from raw HTML for follow-ups.',
        inputSchema: z.object({
          html: z.string().describe('the raw HTML to scan'),
        }),
        execute: async ({ html }) => {
          return { links: extractLinks(html) };
        },
      }),
    },
    stopWhen: stepCountIs(8),
    onStepFinish({ text, toolCalls, toolResults }) {
      console.log('Step finished', { text, toolCalls, toolResults });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => (err instanceof Error ? err.message : String(err ?? 'error')),
    messageMetadata: ({ part }) =>
      part.type === 'finish' ? { totalUsage: part.totalUsage } : undefined,
  });
}