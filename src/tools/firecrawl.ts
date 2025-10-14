import { getFirecrawlClient } from "@/lib/firecrawl";
import type { Tool } from "./types";

export type FirecrawlSearchArgs = { query: string; filters?: Record<string, unknown> };
export type FirecrawlUrlArg = { url: string };

export const firecrawlSearchTool: Tool<FirecrawlSearchArgs> = {
  name: "firecrawl.search",
  description: "Search crawled/indexed content via Firecrawl",
  async invoke({ query, filters }) {
    const client = getFirecrawlClient();
    const res = await client.search(query, filters);
    if (!res.success) throw new Error(res.error || "firecrawl search failed");
    return res.data;
  },
};

export const firecrawlScrapeTool: Tool<FirecrawlUrlArg> = {
  name: "firecrawl.scrape",
  description: "Scrape a single URL via Firecrawl",
  async invoke({ url }) {
    const client = getFirecrawlClient();
    const res = await client.scrape(url);
    if (!res.success) throw new Error(res.error || "firecrawl scrape failed");
    return res.data;
  },
};

export const firecrawlExtractTool: Tool<FirecrawlUrlArg> = {
  name: "firecrawl.extract",
  description: "Extract structured data from a URL via Firecrawl",
  async invoke({ url }) {
    const client = getFirecrawlClient();
    const res = await client.extract(url);
    if (!res.success) throw new Error(res.error || "firecrawl extract failed");
    return res.data;
  },
};

export function registerFirecrawlTools(register: (tool: Tool<any, any>) => void) {
  register(firecrawlSearchTool);
  register(firecrawlScrapeTool);
  register(firecrawlExtractTool);
}

