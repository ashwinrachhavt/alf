import { env } from "../env";
import type {
  CrawlResponse,
  FirecrawlResponse,
  SearchFilters,
  ExtractParams,
  ScrapeParams,
} from "./types";

/**
 * Lightweight Firecrawl API client (server-side)
 * Supports: health, crawl, crawlStatus, search, scrape, extract
 */
export class FirecrawlClient {
  private baseUrl: string;

  constructor(baseUrl = env.FIRECRAWL_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<FirecrawlResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(init.headers || {}),
        },
        ...init,
      });

      // Attempt to parse as JSON; fall back to text
      const parse = async () => {
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return { success: res.ok, error: text } as FirecrawlResponse<T>;
        }
      };

      const json = (await parse()) as FirecrawlResponse<T> & { status?: number };

      if (!res.ok) {
        // normalize non-2xx responses into a consistent envelope
        return {
          success: false,
          error: json?.error || `HTTP ${res.status} ${res.statusText}`,
          data: json?.data as T | undefined,
          timestamp: json?.timestamp,
          // preserve upstream status when possible
          ...(json?.status ? { status: json.status } : {}),
        };
      }

      // Ensure we always return the envelope shape
      if (json && typeof json === "object" && "success" in json) {
        return json as FirecrawlResponse<T>;
      }

      return { success: true, data: json as T };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  /** Check API health */
  async health() {
    return this.request("/health");
  }

  /** Initiate a crawl job for a given URL */
  async crawl(url: string) {
    return this.request<CrawlResponse>("/crawl", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  }

  /** Get the status and content of a crawl job */
  async crawlStatus(crawlId: string) {
    return this.request(`/crawl/${encodeURIComponent(crawlId)}`);
  }

  /** Run a search against indexed or crawled content */
  async search(query: string, filters?: SearchFilters) {
    return this.request("/search", {
      method: "POST",
      body: JSON.stringify({ query, filters }),
    });
  }

  /** Scrape a given static page directly (no deep crawling) */
  async scrape(arg: string | ScrapeParams) {
    const body = typeof arg === "string" ? { url: arg } : arg;
    return this.request("/scrape", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** Extract structured information from a URL */
  async extract(arg: string | ExtractParams) {
    const body = typeof arg === "string" ? { url: arg } : arg;
    return this.request("/extract", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

// Small helper to get a memoized client
let _client: FirecrawlClient | null = null;
export function getFirecrawlClient(): FirecrawlClient {
  if (_client) return _client;
  _client = new FirecrawlClient();
  return _client;
}
