# Deep Research AI Assistant Setup

## Overview

Your AI Assistant now includes powerful deep research capabilities powered by Firecrawl and OpenAI. The system can:

1. **Deep Research**: Search the web, rerank results by relevance, scrape content, and synthesize findings with citations
2. **Improve Writing**: Analyze and enhance text for clarity, grammar, and professionalism
3. **Generate Content**: Create new content based on topics, outlines, summaries, or expansions

## Architecture

### API Route: `/api/ai/chat`
- Uses Vercel AI SDK with tool calling
- Implements three main tools:
  - `deepResearch`: Comprehensive web research with citations
  - `improveWriting`: Text enhancement and grammar fixing
  - `generateContent`: Content generation

### Client Component: `AIAssistant`
- Uses `useChat` hook with `DefaultChatTransport`
- Renders tool calls with visual indicators
- Shows real-time progress for research, writing improvements, and content generation

## How Deep Research Works

### 1. Search Phase
- Queries Firecrawl search API for 15-30 candidate sources
- Normalizes and deduplicates results

### 2. Reranking Phase
- Uses OpenAI to intelligently rank sources by:
  - Relevance to the query
  - Authority and quality
  - Recency (when available)

### 3. Scraping Phase
- Extracts content from top-ranked sources (default: 8)
- Limits content to 4,000 characters per source
- Optionally extracts key quotes with claims

### 4. Synthesis Phase
- AI model synthesizes findings
- Provides inline citations
- Returns structured output with:
  - TL;DR summary
  - Key findings (bullet points)
  - Narrative explanation
  - Sources table with URLs

## Usage Examples

### Deep Research
```typescript
// User asks: "Research the impact of AI on healthcare in 2024"
// AI will:
// 1. Search for relevant sources
// 2. Rank by relevance
// 3. Scrape top 8 sources
// 4. Synthesize with citations
```

### Improve Writing
```typescript
// User asks: "Improve this text: [document content]"
// AI will enhance for:
// - Grammar and spelling
// - Clarity and readability
// - Professional tone
// - Sentence structure
```

### Generate Content
```typescript
// User asks: "Write a paragraph about quantum computing"
// AI will generate based on:
// - Topic requirements
// - Content type (paragraph, outline, summary, expansion)
// - Desired length (short, medium, long)
```

## Environment Configuration

Required environment variables (in `.env.local`):

```bash
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Firecrawl Configuration
FIRECRAWL_BASE_URL=http://localhost:8010  # or your Firecrawl instance URL

# AI Models (optional - defaults shown)
RESEARCH_MODEL=gpt-4o-mini  # Model for research and synthesis
RERANK_MODEL=gpt-4o-mini    # Model for reranking sources
```

## Quick Start

1. **Ensure Firecrawl is running:**
   ```bash
   # Start your local Firecrawl instance
   # Or use hosted Firecrawl
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env.local
   # Add your OPENAI_API_KEY
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Test the assistant:**
   - Open the AI Assistant panel
   - Click "Research topic" quick action
   - Or type: "Research the latest developments in [topic]"

## UI Features

### Quick Actions
- **Research topic**: Triggers deep research on document content
- **Improve writing**: Enhances text quality
- **Expand ideas**: Adds details and examples
- **Fix grammar**: Corrects grammar and spelling

### Visual Indicators
- **Purple border**: Deep Research in progress
- **Blue border**: Writing improvement active
- **Green border**: Content generation running
- **Loading states**: Shows real-time progress

### Tool Call Display
Each tool shows:
- Icon and name
- Current state (streaming, analyzing, completed)
- Input parameters
- Output summary (e.g., number of sources analyzed)
- Error messages (if any)

## Performance Notes

### Timeouts
- API route max duration: 300 seconds (5 minutes)
- Allows for comprehensive research even with many sources

### Retry Logic
- Automatic retry with exponential backoff (3 attempts)
- Handles flaky network connections gracefully

### Content Limits
- Maximum 4,000 characters per scraped source
- Prevents token overflow in LLM context
- Balances detail with performance

## Troubleshooting

### "Search failed" error
- Check Firecrawl is running
- Verify FIRECRAWL_BASE_URL is correct
- Check Firecrawl API health: `curl http://localhost:8010/health`

### "No sources found" error
- Query may be too specific or niche
- Try broader search terms
- Check Firecrawl search is working

### Slow responses
- Increase number of parallel scrape requests (modify code)
- Reduce `topN` sources (default 8)
- Use faster models (gpt-3.5-turbo)
- Check network latency to Firecrawl

### Tool calls not showing
- Check browser console for errors
- Verify API route is accessible
- Confirm OPENAI_API_KEY is valid

## Advanced Configuration

### Custom Models
Change models in `.env.local`:
```bash
# For better quality (slower, more expensive)
RESEARCH_MODEL=gpt-4o
RERANK_MODEL=gpt-4o

# For faster responses (lower quality)
RESEARCH_MODEL=gpt-3.5-turbo
RERANK_MODEL=gpt-3.5-turbo
```

### Adjust Source Count
In `/api/ai/chat/route.ts`, modify the `deepResearch` tool:
```typescript
topN: z.number().int().min(3).max(15).default(12) // Increase from 8 to 12
```

### Custom System Prompt
Modify the `systemPrompt` in `/api/ai/chat/route.ts` to:
- Change tone (e.g., more academic, casual)
- Add domain expertise
- Adjust citation style
- Include specific instructions

## Integration with Editor

The AI Assistant receives `editorContent` prop:
- Provides context about current document
- Enables content-aware suggestions
- Allows document-specific research

To use in your editor component:
```typescript
<AIAssistant
  onClose={() => setShowAI(false)}
  editorContent={editor?.getJSON()}
  onApplyEdit={(content) => {
    // Apply AI-generated content to editor
    editor?.commands.setContent(content);
  }}
/>
```

## Future Enhancements

Potential improvements:
- [ ] PDF upload and analysis
- [ ] Multi-language support
- [ ] Custom research templates
- [ ] Source credibility scoring
- [ ] Cached research results
- [ ] Export research to different formats
- [ ] Collaborative research sessions
- [ ] Integration with citation managers

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console errors
3. Check API route logs
4. Verify environment configuration

## License

Part of the Alf project. See main LICENSE file.
