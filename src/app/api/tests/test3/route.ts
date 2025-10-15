import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
  tool as aiTool,
} from 'ai';
import { NextResponse } from 'next/server';
import { registerFirecrawl } from '@/lib/tools/firecrawl';
import { registerTool, getTool } from '@/lib/tools';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Register Firecrawl tools ONLY for this route
registerFirecrawl(registerTool);

function bindFirecrawlTools() {
  const search = getTool<any, any>('firecrawl_search') ?? getTool<any, any>('firecrawl.search');
  const crawl = getTool<any, any>('firecrawl_crawl') ?? getTool<any, any>('firecrawl.scrape');
  const extract = getTool<any, any>('firecrawl_extract') ?? getTool<any, any>('firecrawl.extract') ?? getTool<any, any>('firecrawl_scrape');

  if (!search || !crawl || !extract) {
    console.error('Firecrawl tools not registered properly', {
      hasSearch: !!search,
      hasCrawl: !!crawl,
      hasExtract: !!extract,
    });
  }

  const tools = {
    firecrawl_search: aiTool({
      description: 'Firecrawl: web search',
      inputSchema: (search?.inputSchema ?? ({} as any)) as any,
      async execute(args) {
        if (!search) throw new Error('firecrawl_search tool not available');
        return search.execute(args);
      },
    }),
    firecrawl_crawl: aiTool({
      description: 'Firecrawl: crawl URL(s) to structured content',
      inputSchema: (crawl?.inputSchema ?? ({} as any)) as any,
      async execute(args) {
        if (!crawl) throw new Error('firecrawl_crawl tool not available');
        return crawl.execute(args);
      },
    }),
    firecrawl_extract: aiTool({
      description: 'Firecrawl: extract fields/quotes from content',
      inputSchema: (extract?.inputSchema ?? ({} as any)) as any,
      async execute(args) {
        if (!extract) throw new Error('firecrawl_extract tool not available');
        return extract.execute(args);
      },
    }),
  } as const;
  return tools;
}

export async function POST(req: Request) {
  let messages: UIMessage[] = [];
  try {
    const body = await req.json();
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

  const tools = bindFirecrawlTools();

  const system = [
    'You are a master Firecrawl researcher. Use ONLY Firecrawl tools.',
    'Plan 3–5 sub‑queries. For each: firecrawl_search → rerank/dedupe → firecrawl_crawl (parallel, cap concurrency ~6–8) → firecrawl_extract quotes.',
    'HARD RULES: Each key claim must include a DIRECT QUOTE with URL and ISO date (if present). Prefer primary sources; deduplicate rewrites; drop thin/irrelevant pages. Stop early when ≥5–8 solid quotes from ≥3 domains.',
    'Output STRICT Markdown: TL;DR, bullets, short narrative, then a SOURCES table with index, title, url, iso_date, and an [md] link to scraped content at /api/tests/test3/scraped?url=<encodedUrl>. Use inline [^n] refs mapping to SOURCES.',
  ].join(' ');

  const result = streamText({
    model: openai('gpt-4o'),
    system,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(Number(process.env.FIRECRAWL_STEPS || 12)),
    onStepFinish({ text, toolCalls, toolResults }) {
      console.log('test3 Firecrawl step', { textLength: text?.length ?? 0, toolCalls: toolCalls?.length ?? 0 });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => (err instanceof Error ? err.message : String(err ?? 'error')),
  });
}

// GET /api/tests/test3/scraped?url=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.endsWith('/scraped')) {
    const target = url.searchParams.get('url');
    if (!target) return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    try {
      // Prefer extract; fallback to scrape
      const extract = getTool<any, any>('firecrawl_extract') ?? getTool<any, any>('firecrawl.extract');
      const scrape = getTool<any, any>('firecrawl_crawl') ?? getTool<any, any>('firecrawl.scrape');

      let data: any = undefined;
      if (extract) {
        data = await extract.execute({ url: target });
      } else if (scrape) {
        data = await scrape.execute({ url: target });
      } else {
        return NextResponse.json({ error: 'No Firecrawl extract/scrape tool available' }, { status: 500 });
      }

      const md = data?.markdown ?? data?.text ?? data?.content ?? '';
      const body = typeof md === 'string' ? md : JSON.stringify(md, null, 2);
      return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } catch (e) {
      console.error('Scraped GET failed', e);
      return NextResponse.json({ error: 'Failed to fetch extracted content' }, { status: 500 });
    }
  }
  // default GET (help)
  return NextResponse.json({ ok: true, info: 'POST this endpoint with { query } or { messages }. Use /scraped?url=... to view markdown.' });
}

