# ALF - AI-Powered Notion-like Application

## Overview

ALF is a beautiful, AI-powered knowledge management system built with Next.js, Tiptap, and GPT-4. It features a Notion-like interface with advanced document management, AI assistance, and multiple view modes.

## Features

### Core Features
- 📝 **Rich Text Editor**: Powered by Tiptap with full formatting support
- 🤖 **AI Assistant**: Integrated GPT-4 chatbot for writing assistance
- 📁 **Workspace Organization**: Hierarchical folder and page structure
- 🎨 **Multiple View Modes**: Grid, List, and Shelf views with beautiful shadow effects
- ⭐ **Favorites & Archives**: Easy document organization
- 🌓 **Dark Mode**: Beautiful dark theme support
- 🔍 **Search & Filter**: Find documents quickly

### AI Capabilities
- Improve writing quality
- Fix grammar and spelling
- Generate content
- Summarize text
- Answer questions about your documents

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Editor**: Tiptap 3.x with multiple extensions
- **AI**: Vercel AI SDK + OpenAI GPT-4
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database
3. OpenAI API key
4. Clerk account for authentication

### Environment Variables

Create a `.env` file in the root directory with the following variables:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/alf"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/pages"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/pages"
\`\`\`

### Installation

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up the database**:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`

3. **Generate Prisma Client**:
   \`\`\`bash
   npx prisma generate
   \`\`\`

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

6. **Initialize workspace**:
   The application will automatically create a default workspace on first visit.

## Project Structure

\`\`\`
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   └── chat/          # AI chat endpoint
│   │   ├── pages/             # Page CRUD operations
│   │   ├── workspaces/        # Workspace management
│   │   └── init/              # Workspace initialization
│   ├── pages/
│   │   ├── layout.tsx         # Pages layout with sidebar
│   │   ├── page.tsx           # Document library view
│   │   └── [id]/page.tsx      # Page editor
│   └── page.tsx               # Landing page
├── components/
│   ├── Sidebar.tsx            # Navigation sidebar
│   ├── EnhancedTiptapEditor.tsx  # Rich text editor
│   ├── AIAssistant.tsx        # AI chat interface
│   └── Nav.tsx                # Top navigation bar
└── prisma/
    └── schema.prisma          # Database schema
\`\`\`

## Database Schema

### Workspace
- Manages different workspaces for organization
- Contains multiple pages

### Page
- Hierarchical structure with parent-child relationships
- Stores Tiptap JSON content
- Supports favorites, archives, and icons
- Nested pages for better organization

### Block (Legacy)
- Block-based content structure
- Maintained for backward compatibility

### ResearchThread & ResearchRun
- Research functionality
- Stores markdown content

## Key Features Explained

### 1. Document Library Views

**Shelf View**: Beautiful card layout with stacked shadow effects
- Creates a 3D shelf appearance
- Perfect for visual browsing

**Grid View**: Classic card grid
- Compact and efficient
- Shows cover images

**List View**: Detailed list format
- Information-dense
- Quick scanning

### 2. AI Assistant

The AI assistant is a sidebar panel that can:
- Analyze document content
- Provide writing suggestions
- Generate new content
- Fix grammar and improve clarity

Access it by clicking the "AI Assistant" button in the editor toolbar.

### 3. Sidebar Navigation

- Quick access to all pages
- Workspace organization
- Collapsible folder structure
- Favorites and search

### 4. Rich Text Editor

Built with Tiptap, supports:
- Headings (H1, H2, H3)
- Bold, italic, strikethrough
- Bullet and numbered lists
- Code blocks
- Links and images
- Blockquotes
- Horizontal rules

## Customization

### Adding New AI Tools

Edit \`src/app/api/ai/chat/route.ts\` to add new tools:

\`\`\`typescript
tools: {
  yourTool: tool({
    description: 'Description of your tool',
    parameters: z.object({
      // Define parameters
    }),
  }),
}
\`\`\`

### Styling

The application uses Tailwind CSS. Modify \`tailwind.config.js\` for theme changes.

### Database Changes

1. Edit \`prisma/schema.prisma\`
2. Run \`npx prisma migrate dev\`
3. Update TypeScript types

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure you:
- Set up PostgreSQL database
- Configure environment variables
- Run \`npm run build\`
- Start with \`npm start\`

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall settings

### AI Not Working
- Verify OPENAI_API_KEY is set
- Check API quota and billing
- Review API endpoint logs

### Editor Not Loading
- Clear browser cache
- Check console for errors
- Verify all dependencies installed

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Export to PDF/Markdown
- [ ] Advanced search with filters
- [ ] Page templates
- [ ] Comments and mentions
- [ ] Version history
- [ ] Mobile app
- [ ] Browser extension

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.
