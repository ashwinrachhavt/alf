import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from 'ai';
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
        'You are a master local deep-research agent specialized in Firecrawl.',
        'Iterate: sub-queries → search → rerank → crawl → extract.',
        'Quote directly with URLs and ISO dates; deduplicate aggressively; prefer primary sources.',
        'Return TL;DR, bullets, narrative, and final SOURCES table with [^n] refs.',
      ].join(' '),
      steps: Number(process.env.FIRECRAWL_STEPS || 12),
      model: 'gpt-4o',
    },
  };

  const cfg = presets[agent || 'firecrawl-master'] ?? presets['firecrawl-master'];

  // Build a tools object including only Firecrawl tools from the registry by name
  // Provide valid stub schemas to prevent undefined typeName errors
  const safeSchema = { type: 'object', properties: {} } as any;

  const firecrawlTools = {
    firecrawl_search: aiTool({
      description: 'Firecrawl: web search',
      inputSchema: safeSchema as any,
      async execute(args: unknown) {
        const mod = await import('@/lib/tools');
        const t = mod.getTool<any, any>('firecrawl_search');
        if (!t || typeof t.execute !== 'function') throw new Error('firecrawl_search tool not available');
        return await t.execute(args);
      },
    }),
    firecrawl_crawl: aiTool({
      description: 'Firecrawl: crawl URL(s) to structured content',
      inputSchema: safeSchema as any,
      async execute(args: unknown) {
        const mod = await import('@/lib/tools');
        const t = mod.getTool<any, any>('firecrawl_crawl');
        if (!t || typeof t.execute !== 'function') throw new Error('firecrawl_crawl tool not available');
        return await t.execute(args);
      },
    }),
    firecrawl_extract: aiTool({
      description: 'Firecrawl: extract fields/quotes from content',
      inputSchema: safeSchema as any,
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
