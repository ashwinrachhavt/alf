// tools/firecrawl.ts (your file, minor tweak)
import { z } from 'zod';
import { defineTool } from './types';
import { getFirecrawlClient } from '@/lib/firecrawl';

export const firecrawlSearch = defineTool({
  name: 'firecrawl.search',
  description: 'Search crawled/indexed content via Firecrawl',
  inputSchema: z.object({
    query: z.string().min(1),
    filters: z.record(z.unknown()).optional(),
  }),
  async execute({ query, filters }) {
    const client = getFirecrawlClient(); // make sure it reads BASE_URL env and can be localhost
    const res = await client.search(query, filters);
    if (!res.success) throw new Error(res.error || 'firecrawl search failed');
    return res.data;
  },
});

export const firecrawlScrape = defineTool({
  name: 'firecrawl.scrape',
  description: 'Scrape a single URL via Firecrawl',
  inputSchema: z.object({ url: z.string().url() }),
  async execute({ url }) {
    const client = getFirecrawlClient();
    const res = await client.scrape(url);
    if (!res.success) throw new Error(res.error || 'firecrawl scrape failed');
    return res.data;
  },
});

export const firecrawlExtract = defineTool({
  name: 'firecrawl.extract',
  description: 'Extract structured data from a URL via Firecrawl',
  inputSchema: z.object({ url: z.string().url() }),
  async execute({ url }) {
    const client = getFirecrawlClient();
    const res = await client.extract(url);
    if (!res.success) throw new Error(res.error || 'firecrawl extract failed');
    return res.data;
  },
});

export function registerFirecrawl(register: (t: any) => void) {
  // Register both dot and underscore forms for compatibility
  register(firecrawlSearch);
  register(firecrawlScrape);
  register(firecrawlExtract);

  // underscore alias set for Firecrawl test endpoint compatibility
  register({ ...firecrawlSearch, name: 'firecrawl_search' });
  register({ ...firecrawlScrape, name: 'firecrawl_crawl' });
  register({ ...firecrawlExtract, name: 'firecrawl_extract' });
}
