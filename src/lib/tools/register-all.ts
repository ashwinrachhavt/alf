// tools/register-all.ts
import { registerTool, listTools } from './index';
import { wikipediaSearch, wikipediaSummary } from './wikipedia';
import { duckDuckGoInstant } from './duckduckgo';
import { arxivSearch } from './arxiv';
import { rssFetch } from './rss';
import { registerFirecrawl } from './firecrawl';

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
  // etc.
  // console.log('Tools:', listTools());
}
