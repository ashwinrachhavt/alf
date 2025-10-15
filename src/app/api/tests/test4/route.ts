import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
  tool as aiTool,
} from 'ai';
import { registerLangsearch } from '@/lib/tools/langsearch';
import { registerTool, getTool } from '@/lib/tools';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

// Register ONLY LangSearch tools for this route
registerLangsearch(registerTool);

function bindLangsearchTools() {
  const web = getTool<any, any>('langsearch_web_search') ?? getTool<any, any>('langsearch.web_search');
  const rr = getTool<any, any>('langsearch_rerank') ?? getTool<any, any>('langsearch.rerank');
  if (!web || !rr) {
    console.error('LangSearch tools not registered', { hasWeb: !!web, hasRerank: !!rr });
  }
  return {
    langsearch_web_search: aiTool({
      description: 'LangSearch Web Search',
      inputSchema: (web?.inputSchema ?? ({} as any)) as any,
      async execute(args) {
        if (!web) throw new Error('langsearch_web_search not available');
        return web.execute(args);
      },
    }),
    langsearch_rerank: aiTool({
      description: 'LangSearch Semantic Rerank',
      inputSchema: (rr?.inputSchema ?? ({} as any)) as any,
      async execute(args) {
        if (!rr) throw new Error('langsearch_rerank not available');
        return rr.execute(args);
      },
    }),
  } as const;
}

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

  const tools = bindLangsearchTools();

  const presets: Record<string, { system: string; steps: number; model: string }> = {
    'langsearch-master': {
      system: [
        'You are a LangSearch researcher. Use ONLY LangSearch tools.',
        'Plan 2–3 sub‑queries. Call langsearch_web_search to gather candidates (10–20), then langsearch_rerank with the text snippets to pick the top few. Produce TL;DR, bullets, short narrative, and SOURCES with inline [^n] refs.',
      ].join(' '),
      steps: 6,
      model: 'gpt-4o',
    },
    'langsearch-fast': {
      system: [
        'You are a fast LangSearch scanner. One pass: web_search → rerank → summarize. Output TL;DR + bullets + SOURCES.',
      ].join(' '),
      steps: 3,
      model: 'gpt-4o-mini',
    },
  };

  const cfg = presets[agent || 'langsearch-master'] ?? presets['langsearch-master'];

  const result = streamText({
    model: openai(cfg.model),
    system: cfg.system,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(cfg.steps),
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => (err instanceof Error ? err.message : String(err ?? 'error')),
  });
}

