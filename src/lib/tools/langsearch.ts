import { z } from 'zod';
import { defineTool } from './types';

const BASE = 'https://api.langsearch.com/v1';

async function callLS(path: string, body: any) {
  const key = process.env.LANGSEARCH_API_KEY;
  if (!key) throw new Error('Missing LANGSEARCH_API_KEY');
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`LangSearch ${path} ${r.status}`);
  return r.json();
}

export const langsearchWebSearch = defineTool({
  name: 'langsearch.web_search',
  description: 'LangSearch Web Search API',
  inputSchema: z.object({
    query: z.string().min(1),
    freshness: z.enum(['noLimit','pastDay','pastWeek','pastMonth']).default('noLimit').optional(),
    summary: z.boolean().default(true).optional(),
    count: z.number().int().min(1).max(50).default(10).optional(),
  }),
  async execute({ query, freshness = 'noLimit', summary = true, count = 10 }) {
    return callLS('/web-search', { query, freshness, summary, count });
  },
});

export const langsearchRerank = defineTool({
  name: 'langsearch.rerank',
  description: 'LangSearch Semantic Rerank API',
  inputSchema: z.object({
    model: z.string().default('langsearch-reranker-v1').optional(),
    query: z.string().min(1),
    top_n: z.number().int().min(1).max(20).default(2).optional(),
    return_documents: z.boolean().default(true).optional(),
    documents: z.array(z.string().min(1)),
  }),
  async execute({ model = 'langsearch-reranker-v1', query, top_n = 2, return_documents = true, documents }) {
    return callLS('/rerank', { model, query, top_n, return_documents, documents });
  },
});

export function registerLangsearch(register: (t:any)=>void) {
  register(langsearchWebSearch);
  register(langsearchRerank);
  // snake_case aliases for convenience
  register({ ...langsearchWebSearch, name: 'langsearch_web_search' });
  register({ ...langsearchRerank, name: 'langsearch_rerank' });
}

