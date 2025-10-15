// tools/index.ts
import type { Tool } from './types';
import { tool as aiTool } from 'ai';

const registry = new Map<string, Tool<any, any>>();

export function registerTool<TArgs, TResult>(t: Tool<TArgs, TResult>) {
  registry.set(t.name, t);
}

export function getTool<TArgs, TResult>(name: string) {
  return registry.get(name) as Tool<TArgs, TResult> | undefined;
}

export function listTools() {
  return Array.from(registry.keys());
}

// Adapter: expose tools to AI SDK `streamText`/`generateText`
export function toAiSdkTools() {
  const out: Record<string, ReturnType<typeof aiTool>> = {};
  for (const [name, t] of registry) {
    out[name] = aiTool({
      description: t.description,
      inputSchema: t.inputSchema,
      // validate already done by AI SDK; call your tool
      execute: async (args) => t.execute(args),
      // Optional: if you want to stream/marshal outputs later,
      // add `toModelOutput` here with `toModelOutput: t.toModelOutput`
    });
  }
  return out;
}
