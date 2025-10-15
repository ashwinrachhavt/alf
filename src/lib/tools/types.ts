// tools/types.ts
import { z, ZodTypeAny } from 'zod';

export interface Tool<Args = unknown, Result = unknown> {
  name: string;
  description?: string;
  // Zod schema that validates the LLM/tool caller input
  inputSchema: ZodTypeAny;
  // Execute with validated args
  execute(args: Args): Promise<Result>;
  // Optional: map result into AI SDK "content part"
  toModelOutput?: (result: Result) => any;
}

// If you want a helper to define tools with full type inference:
export function defineTool<A extends ZodTypeAny, R>(
  cfg: Omit<Tool<z.infer<A>, R>, 'inputSchema'> & { inputSchema: A }
): Tool<z.infer<A>, R> {
  return cfg;
}
