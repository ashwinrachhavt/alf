import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from 'ai';
import { registerAllTools } from '@/lib/tools/register-all';
import { toAiSdkTools } from '@/lib/tools';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Ensure all tools in lib/tools are registered once per runtime
registerAllTools?.();

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

  // Simple agent switcher for testing different configs
  const presets: Record<string, { system: string; steps?: number; model?: string }> = {
    researcher: {
      system: [
        'You are a careful, no-nonsense research assistant.',
        'Do iterative web research using the provided tools.',
        'Cite URLs inline like [^1] and produce a final SOURCES list.',
        'Prefer primary sources; deduplicate links; avoid speculation.',
      ].join(' '),
      steps: 8,
      model: 'gpt-4o',
    },
    critic: {
      system: [
        'You are a critical reviewer that validates claims.',
        'Check freshness (< 12 months) and source diversity; suggest corrections.',
        'Return a concise bullet list with confidence scores 0–1.',
      ].join(' '),
      steps: 4,
      model: 'gpt-4o-mini',
    },
    summarizer: {
      system: 'Summarize the content in 5 bullets and one TL;DR line.',
      steps: 1,
      model: 'gpt-4o-mini',
    },
  };

  const cfg = presets[agent || 'researcher'] ?? presets.researcher;

  const result = streamText({
    model: openai(cfg.model || 'gpt-4o'),
    system: cfg.system,
    messages: convertToModelMessages(messages),
    tools: toAiSdkTools(),
    stopWhen: stepCountIs(cfg.steps ?? 8),
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
