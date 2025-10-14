# ALF — Agents Quickstart

ALF is a Next.js app that runs **agentic deep-research** jobs, synthesizes **digestible briefs with citations**, and stores results for **re-finding**. Production-ready on Vercel.

## Goals

* **Useful & grounded**: live web search with sources/dates. ([OpenAI Platform][1])
* **Digestible**: layered output (TL;DR → bullets → narrative → sources table).
* **Re-findable**: persist to DB + embeddings (optional).
* **Scheduled**: daily/weekly jobs via **Vercel Cron** or **Convex Cron**. ([Vercel][2])

---

## Stack

* **Next.js (App Router)** for UI + API routes/route handlers. ([Next.js][3])
* **OpenAI Agents SDK** with **webSearchTool()** (built-in hosted Web Search). ([OpenAI GitHub][4])
* **Vercel AI SDK** for streaming text to the client. ([AI SDK][5])
* **Vercel Cron** to hit an API route on schedule. ([Vercel][2])
* **Supabase** (auth/storage/DB client). ([Supabase][6])
* **Convex** (optional): reactive DB + built-in cron scheduler. ([Convex Developer Hub][7])
* **shadcn/ui** for a sleek dashboard. ([Shadcn][8])

---

## Install

```bash
# Next.js app (App Router)
npx create-next-app@latest alf --typescript --tailwind --eslint --app --src-dir
cd alf

# SDKs
npm i openai @openai/agents @openai/agents-openai ai

# Data (pick what you need)
npm i @supabase/supabase-js @supabase/ssr
npm i convex

# UI
npx shadcn-ui@latest init
```

**Env (.env.local):**

```
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Agents

We ship two agents:

1. **Researcher** — plans → searches → extracts **quotes + URLs + dates** → writes brief
2. **Critic** — re-checks risky claims, suggests stronger citations

### 1) Researcher (Agents SDK + Web Search)

> File: `app/api/agents/research/route.ts`

```ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { webSearchTool } from "@openai/agents-openai";

export const maxDuration = 300; // let long research finish on Vercel

const client = new OpenAI();

const researcher = new Agent({
  name: "researcher",
  instructions:
    "Plan 2–3 sub-queries, use web search to gather facts. " +
    "For each key claim, extract a direct quote, URL, source/author, and ISO date. " +
    "Return: TL;DR, bullets, short narrative, and a sources table.",
  tools: [webSearchTool()], // ← built-in hosted web search
  model: "gpt-4o-mini",
});

export async function POST(req: Request) {
  const { query } = await req.json();
  const res = await run(researcher, { input: query }, client);
  return NextResponse.json({ text: res.output_text });
}
```

* `webSearchTool()` adds OpenAI’s hosted Web Search to your agent—no custom schema required. ([OpenAI GitHub][4])
* Web search returns fresh info with citations designed for tools. ([OpenAI Platform][1])

### 2) Critic (optional)

> File: `app/api/agents/critic/route.ts`

```ts
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { Agent, run } from "@openai/agents";
import { webSearchTool } from "@openai/agents-openai";
export const maxDuration = 180;

const client = new OpenAI();
const critic = new Agent({
  name: "critic",
  instructions:
    "Re-check the draft using web search. Flag contradictions, stale sources (>12mo), and propose better citations. " +
    "Return a brief list of corrections + confidence 0–1.",
  tools: [webSearchTool()],
  model: "gpt-4o-mini",
});

export async function POST(req: Request) {
  const { draft } = await req.json();
  const res = await run(critic, { input: `Review this draft:\n\n${draft}` }, client);
  return NextResponse.json({ text: res.output_text });
}
```

---

## Streaming UX (Vercel AI SDK)

Use this for interactive research (manual runs) with **streaming**:

> File: `app/api/research/stream/route.ts`

```ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { streamText } from "ai"; // Vercel AI SDK
export const maxDuration = 300;

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const client = new OpenAI();

  const result = await streamText({
    model: client.chat.completions, // AI SDK core with OpenAI
    prompt: `Act as a deep researcher. ${prompt}\nReturn TL;DR, bullets, narrative, and sources.`,
  });

  return result.toDataStreamResponse();
}
```

* `streamText` provides real-time tokens for smooth UX. ([AI SDK][9])

---

## Scheduling

### Option A — Vercel Cron (production)

Add schedules in `vercel.json`. Vercel will **HTTP GET** your route on schedule with user-agent `vercel-cron/1.0`. ([Vercel][2])

> File: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/daily-research", "schedule": "0 6 * * *" },
    { "path": "/api/cron/evening-review", "schedule": "0 18 * * *" }
  ]
}
```

> File: `app/api/cron/daily-research/route.ts`

```ts
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function GET() {
  // call your researcher endpoint with predefined topics
  await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/agents/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "GraphRAG vs LazyGraphRAG — latest differences with citations"
    })
  });

  return NextResponse.json({ ok: true });
}
```

Guides & limits: setup, logs, and management. ([Vercel][10])

### Option B — Convex Cron (built-in scheduler)

If you prefer job orchestration on the data layer, **Convex** can run scheduled functions (no external cron). ([Convex Developer Hub][7])

> File: `convex/crons.ts`

```ts
import { crons } from "convex/server";
import { internal } from "./_generated/api";

const c = crons();

c.daily("runDailyResearch", { hourUTC: 6, minuteUTC: 0 }, internal.jobs.runDailyResearch);
export default c;
```

* Convex exposes scheduler APIs + reactive DB for live dashboards. ([Convex Developer Hub][11])

---

## Data Layer

### Supabase (Auth + basic tables)

* Initialize Supabase JS client. ([Supabase][6])
* For SSR, use `@supabase/ssr` helper. ([Supabase][12])

> File: `lib/supabase.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

> SQL sketch:

```sql
create table if not exists research_reports (
  id bigserial primary key,
  created_at timestamptz default now(),
  title text,
  tldr text,
  body text
);

create table if not exists research_sources (
  id bigserial primary key,
  report_id bigint references research_reports(id) on delete cascade,
  url text, quote text, author text, published timestamptz
);
```

### Convex (optional reactive store)

* Use Convex tables for live job status and incremental logs; schedule jobs with crons API. ([Convex Developer Hub][7])

---

## UI & Design System

ALF uses a comprehensive design system built with **shadcn/ui** components and Tailwind CSS. ([Shadcn][8])

### Design System Documentation

See `DESIGN_SYSTEM.md` in the project root for the complete design system guide, including:
- Color palette (light & dark modes)
- Typography scale
- Component library
- Layout patterns
- Accessibility guidelines
- Mobile responsive patterns

### Installing Components

```bash
# UI components are pre-installed in src/components/ui/
# Available components:
# - Button (with variants: primary, secondary, ghost, destructive)
# - Card (with CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
# - Input
# - Textarea
# - Badge (with variants: default, success, error, warning)
# - Separator
```

### Using Components

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Button variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Close</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Card structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-neutral-600 dark:text-neutral-400">Content</p>
  </CardContent>
</Card>
```

### Color Guidelines

**Light Mode:**
- Background: `#ffffff` (white)
- Surface: `#fafafa` (subtle gray)
- Text: `#0a0a0a` (near black) - Primary text
- Muted: `#737373` (gray) - Secondary text (WCAG AA compliant at 4.54:1)
- Border: `#e5e5e5` (light gray)

**Dark Mode:**
- Background: `#0a0a0a` (near black)
- Surface: `#171717` (dark gray)
- Text: `#fafafa` (white) - Primary text
- Muted: `#a3a3a3` (light gray) - Secondary text (WCAG AA compliant)
- Border: `#262626` (dark gray)

### Responsive Patterns

Use mobile-first breakpoints:
```tsx
// Mobile: full width, Desktop: 2 columns
<div className="grid gap-4 md:grid-cols-2">

// Mobile: hidden, Desktop: visible
<div className="hidden md:block">

// Mobile: stacked, Desktop: sidebar layout
<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
```

### Accessibility

- All text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text)
- Focus states use visible ring: `focus-visible:ring-2`
- Interactive elements have minimum 40px touch targets
- Use semantic HTML: `<button>` for actions, `<a>` for navigation

---

## Local Dev

```bash
# dev server
npm run dev

# call the researcher
curl -X POST http://localhost:3000/api/agents/research \
  -H "content-type: application/json" \
  -d '{"query":"What is GraphRAG vs LazyGraphRAG? Cite recent sources."}'
```

---

## Deployment

1. **Push to Vercel** (Project → set env vars)
2. Add `vercel.json` cron schedules (production only). ([Vercel][2])
3. Verify Cron logs under **Project → Cron Jobs → View Logs**. ([Vercel][13])

---

## Quality Bar (suggested)

* **Grounded%**: all key claims have quote + URL + date.
* **Freshness**: median publish date ≤ 365 days for “latest” queries.
* **Diversity**: ≥ 3 distinct domains in sources.
* **Critic pass**: run the critic agent for high-stakes outputs.

---

## Reference Docs

* **OpenAI Web Search (Responses/Tools)** — how web search works & adds citations. ([OpenAI Platform][1])
* **OpenAI Agents SDK – `webSearchTool()`** (JS). ([OpenAI GitHub][4])
* **OpenAI API Reference** (models, auth). ([OpenAI Platform][14])
* **Vercel Cron** (how it triggers, quickstart, logs/management). ([Vercel][2])
* **Vercel AI SDK** (generate/stream text). ([AI SDK][5])
* **Next.js App Router route handlers**. ([Next.js][3])
* **Supabase JS init & SSR client**. ([Supabase][6])
* **Convex cron jobs & API**. ([Convex Developer Hub][7])
* **shadcn/ui installation**. ([Shadcn][8])

---

### What next?

* Want a **starter repo** with these files pre-wired (routes, cron, Supabase schema, Convex crons, shadcn shell)? Say the word and I’ll generate a minimal template you can deploy to Vercel in one go.

[1]: https://platform.openai.com/docs/guides/tools-web-search?utm_source=chatgpt.com "Web search - OpenAI API"
[2]: https://vercel.com/docs/cron-jobs?utm_source=chatgpt.com "Cron Jobs"
[3]: https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware?utm_source=chatgpt.com "Getting Started: Route Handlers and Middleware"
[4]: https://openai.github.io/openai-agents-js/openai/agents-openai/functions/websearchtool/?utm_source=chatgpt.com "webSearchTool | OpenAI Agents SDK - GitHub Pages"
[5]: https://ai-sdk.dev/docs/ai-sdk-core/generating-text?utm_source=chatgpt.com "AI SDK Core: Generating Text"
[6]: https://supabase.com/docs/reference/javascript/initializing?utm_source=chatgpt.com "JavaScript: Initializing | Supabase Docs"
[7]: https://docs.convex.dev/scheduling/cron-jobs?utm_source=chatgpt.com "Cron Jobs | Convex Developer Hub"
[8]: https://v3.shadcn.com/docs/installation?utm_source=chatgpt.com "Installation - shadcn/ui"
[9]: https://ai-sdk.dev/cookbook/next/stream-text?utm_source=chatgpt.com "Stream Text - Next.js"
[10]: https://vercel.com/docs/cron-jobs/quickstart?utm_source=chatgpt.com "Getting started with cron jobs"
[11]: https://docs.convex.dev/api/classes/server.Crons?utm_source=chatgpt.com "Class: Crons | Convex Developer Hub"
[12]: https://supabase.com/docs/guides/auth/server-side/creating-a-client?utm_source=chatgpt.com "Creating a Supabase client for SSR"
[13]: https://vercel.com/docs/cron-jobs/manage-cron-jobs?utm_source=chatgpt.com "Managing Cron Jobs"
[14]: https://platform.openai.com/docs/api-reference/introduction?utm_source=chatgpt.com "API Reference"

