// tools/register-all.ts
import { registerTool, listTools } from './index';
import { wikipediaSearch, wikipediaSummary } from './wikipedia';
import { duckDuckGoInstant } from './duckduckgo';
import { arxivSearch } from './arxiv';
import { rssFetch } from './rss';
import { registerFirecrawl } from './firecrawl';
import { registerLangsearch } from './langsearch';

export function registerAllTools() {
  registerTool(wikipediaSearch);
  registerTool(wikipediaSummary);
  registerTool(duckDuckGoInstant);
  registerTool(arxivSearch);
  registerTool(rssFetch);
  registerFirecrawl(registerTool);

  // Feature flags (env) to toggle tools:
  if (process.env.NEWSAPI_KEY) {
    // registerTool(newsApiTool)
  }
  if (process.env.LANGSEARCH_API_KEY) {
    registerLangsearch(registerTool);
  }
  // etc.
  // console.log('Tools:', listTools());
}
