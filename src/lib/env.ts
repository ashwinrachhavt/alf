// Centralized environment helper for server-side code
// Add any new envs here for consistent access and defaults

export const env = {
  // Base URL for the Firecrawl server (local default)
  FIRECRAWL_BASE_URL: process.env.FIRECRAWL_BASE_URL || "http://localhost:8010",
  // Models for research + rerank (override via .env.local)
  RESEARCH_MODEL: process.env.RESEARCH_MODEL || "gpt-4o-mini",
  RERANK_MODEL: process.env.RERANK_MODEL || "gpt-4o-mini",
};
