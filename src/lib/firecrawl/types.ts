/**
 * Typed Firecrawl API response envelope
 */
export interface FirecrawlResponse<T = unknown> {
  success: boolean;
  data?: T;
  timestamp?: string;
  error?: string;
}

/**
 * Response payload when initiating a crawl
 */
export interface CrawlResponse {
  id: string;
  url: string;
}

/**
 * Generic types for common endpoints (optional, extend as needed)
 */
export interface HealthStatus {
  status: string;
}

export interface SearchFilters {
  [key: string]: unknown;
}

// Optional parameter types for advanced usage
export interface ExtractParams {
  url: string;
  // Some Firecrawl variants require a schema/prompt; keep generic to avoid tight coupling
  schema?: unknown;
  prompt?: string;
  [key: string]: unknown;
}

export interface ScrapeParams {
  url: string;
  [key: string]: unknown;
}
