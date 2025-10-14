export interface Tool<Args = unknown, Result = unknown> {
  name: string;
  description?: string;
  invoke(args: Args): Promise<Result>;
}

