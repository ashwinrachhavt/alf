import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { registerFirecrawl } from '@/lib/tools/firecrawl';
import { tool as aiTool } from 'ai';
import { registerTool } from '@/lib/tools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Register only Firecrawl tools to restrict the agent strictly to Firecrawl
registerFirecrawl(registerTool);

export async function POST(req: Request) {
  let messages: UIMessage[] = [];
  let agent: string | undefined;
  try {
    const body = await req.json();
    agent = body?.agent;
    messages = Array.isArray(body?.messages)
      ? body.messages
      : body?.query
      ? [
          {
            id: crypto.randomUUID(),
            role: 'user',
            parts: [{ type: 'text', text: String(body.query) }],
          },
        ]
      : [];
  } catch {}

  const presets: Record<string, { system: string; steps?: number; model?: string }> = {
    'firecrawl-master': {
      system: [
        'You are a master local deep‑research agent that uses ONLY Firecrawl tools.',
        'Plan 3–5 focused sub‑queries. For each: firecrawl_search (20–30 candidates across sub‑queries, dedup early) → rerank by domain diversity + freshness → firecrawl_crawl in parallel (cap concurrency ~6–8) → firecrawl_extract quotes.',
        'Hard rules: every key claim must include a DIRECT QUOTE with URL and ISO date when present; prefer primary sources; deduplicate syndication/rewrites; drop thin/irrelevant pages; stop early when you have ≥5–8 solid quotes from ≥3 domains.',
        'Output STRICT Markdown: TL;DR, bullets, short narrative, then SOURCES table with index, title, url, iso_date, and an [md] link to scraped content at /api/tools/firecrawl/extract?url=<encodedUrl>. Use inline [^n] refs in the text mapping to SOURCES.',
      ].join(' '),
      steps: Number(process.env.FIRECRAWL_STEPS || 12),
      model: 'gpt-4o',
    },
    'firecrawl-fast': {
      system: [
        'You are a fast Firecrawl scanner. Perform minimal iterations: search → rerank → crawl → extract (quotes + URLs + ISO dates).',
        'Keep 10–12 top URLs, high precision, stop early with ≥3 quotes from ≥2 domains. Output TL;DR + bullets + SOURCES with [md] links to /api/tools/firecrawl/extract?url=<encodedUrl>.',
      ].join(' '),
      steps: 5,
      model: 'gpt-4o-mini',
    },
  };

  const cfg = presets[agent || 'firecrawl-master'] ?? presets['firecrawl-master'];

  // Build a tools object including only Firecrawl tools from the registry by name
  // Provide valid stub schemas to prevent undefined typeName errors
  const safeSchema = { type: 'object', properties: {} } as any;

  const firecrawlTools = {
    firecrawl_search: aiTool({
      description: 'Firecrawl: web search',
      inputSchema: z.object({
        query: z.string().describe('Firecrawl search query'),
        maxResults: z.number().int().min(1).max(10).optional(),
      }),
      async execute(args: unknown) {
        const mod = await import('@/lib/tools');
        const t = mod.getTool<any, any>('firecrawl_search');
        if (!t || typeof t.execute !== 'function') throw new Error('firecrawl_search tool not available');
        return await t.execute(args);
      },
    }),
    firecrawl_crawl: aiTool({
      description: 'Firecrawl: crawl URL(s) to structured content',
      inputSchema: z.object({
        urls: z.array(z.string().url()).describe('List of target URLs to crawl'),
      }),
      async execute(args: unknown) {
        const mod = await import('@/lib/tools');
        const t = mod.getTool<any, any>('firecrawl_crawl');
        if (!t || typeof t.execute !== 'function') throw new Error('firecrawl_crawl tool not available');
        return await t.execute(args);
      },
    }),
    firecrawl_extract: aiTool({
      description: 'Firecrawl: extract fields/quotes from content',
      inputSchema: z.object({
        content: z.string().describe('Raw HTML or textual content to extract data from'),
      }),
      async execute(args: unknown) {
        const mod = await import('@/lib/tools');
        const t = mod.getTool<any, any>('firecrawl_extract');
        if (t && typeof t.execute === 'function') return await t.execute(args);

        const alt = mod.getTool<any, any>('firecrawl_scrape');
        if (alt && typeof alt.execute === 'function') return await alt.execute(args);

        throw new Error('Neither firecrawl_extract nor firecrawl_scrape available');
      },
    }),
  } as const;

  const result = streamText({
    model: openai(cfg.model || 'gpt-4o'),
    system: cfg.system,
    // Normalize UI messages for model compatibility
    messages: messages.map((m) => ({
      role: m.role,
      content:
        Array.isArray(m.parts) && m.parts.length
          ? m.parts
              .map((p) =>
                typeof p === 'object' && 'text' in p && typeof p.text === 'string'
                  ? p.text
                  : ''
              )
              .join('\n')
          : '',
    })),
    tools: firecrawlTools,
    stopWhen: stepCountIs(cfg.steps ?? 12),
    onStepFinish({ text, toolCalls, toolResults }) {
      console.log('Firecrawl test2 step', { textLength: text?.length ?? 0, toolCalls: toolCalls?.length ?? 0 });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => (err instanceof Error ? err.message : String(err ?? 'error')),
    messageMetadata: ({ part }) =>
      part.type === 'finish' ? { totalUsage: part.totalUsage } : undefined,
  });
}
