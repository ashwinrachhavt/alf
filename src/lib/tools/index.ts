import type { Tool } from './types';
import { tool as aiTool, type Tool as AiTool } from 'ai';

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

export function toAiSdkTools() {
  const out: Record<string, ReturnType<typeof aiTool>> = {};
  for (const [name, t] of registry) {
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    out[safeName] = aiTool<any, any>({
      description: t.description,
      inputSchema: t.inputSchema as unknown as ReturnType<typeof aiTool> extends AiTool<infer A, any> ? A : never,
      execute: async (args: any) => t.execute(args),
    }) as unknown as ReturnType<typeof aiTool>;
  }
  return out;
}
