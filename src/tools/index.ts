import type { Tool } from "./types";

const registry = new Map<string, Tool<any, any>>();

export function registerTool<TArgs = unknown, TResult = unknown>(tool: Tool<TArgs, TResult>) {
  registry.set(tool.name, tool);
}

export function getTool<TArgs = unknown, TResult = unknown>(name: string): Tool<TArgs, TResult> | undefined {
  return registry.get(name) as Tool<TArgs, TResult> | undefined;
}

export function listTools() {
  return Array.from(registry.keys());
}

