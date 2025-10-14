# Complete Notes System Implementation Guide

## ✅ What's Been Completed

### 1. Database Schema (prisma/schema.prisma)
- ✅ `Note` model with full metadata support
- ✅ `NoteLink` model for bi-directional linking
- ✅ Tags array for categorization
- ✅ Source tracking (research, manual, thread)
- ✅ Full text search support
- ✅ Favorites and archive functionality

### 2. API Endpoints
- ✅ `POST /api/notes` - Create new note
- ✅ `GET /api/notes` - List all notes (with filtering)
- ✅ `GET /api/notes/[id]` - Get single note with links
- ✅ `PATCH /api/notes/[id]` - Update note
- ✅ `DELETE /api/notes/[id]` - Delete note
- ✅ `POST /api/notes/[id]/link` - Create link between notes
- ✅ `DELETE /api/notes/[id]/link` - Remove link

## 🚀 Next Steps to Complete

### Step 1: Run Database Migration
```bash
npx prisma migrate dev --name add_notes_system
```

### Step 2: Create Notes Library Page

Create `/src/app/notes/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Grid3x3, List, Tag, Star } from 'lucide-react';

type Note = {
  id: string;
  title: string;
  icon: string;
  content: any;
  contentMd: string;
  tags: string[];
  category: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  linkedNotes: any[];
  linkedFrom: any[];
};

export default function NotesLibrary() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [selectedTag]);

  async function loadNotes() {
    try {
      const params = new URLSearchParams();
      if (selectedTag) params.append('tag', selectedTag);

      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createNote() {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Note' }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = `/notes/${data.data.id}`;
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.contentMd?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  return (
    <div className="flex-1 h-screen overflow-auto bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Notes</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>

            <button
              onClick={createNote}
              className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>

            <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto">
              <Tag className="w-4 h-4 text-neutral-500" />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${
                  !selectedTag
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black border-neutral-900 dark:border-neutral-100'
                    : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black border-neutral-900 dark:border-neutral-100'
                      : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100 mx-auto mb-3"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">No notes found</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {searchQuery || selectedTag ? 'Try a different search or filter' : 'Create your first note to get started'}
            </p>
            {!searchQuery && !selectedTag && (
              <button
                onClick={createNote}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
            {filteredNotes.map(note => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className={`block bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all ${
                  viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center">
                      <span className="text-4xl">{note.icon}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium truncate flex-1 text-neutral-900 dark:text-neutral-100">{note.title}</h3>
                        {note.isFavorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 shrink-0" />}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-[10px] text-neutral-500">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{note.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate text-neutral-900 dark:text-neutral-100">{note.title}</h3>
                        {note.isFavorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                      </div>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Create Note Editor Page

Create `/src/app/notes/[id]/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EnhancedTiptapEditor from '@/components/EnhancedTiptapEditor';
import AIAssistant from '@/components/AIAssistant';
import { docToMarkdown } from '@/lib/docToMarkdown';
import { Star, Sparkles, Tag, Link2, Trash } from 'lucide-react';
import { toast } from 'sonner';

type Note = {
  id: string;
  title: string;
  icon: string;
  content: any;
  contentMd: string | null;
  tags: string[];
  category: string | null;
  isFavorite: boolean;
  linkedNotes: any[];
  linkedFrom: any[];
};

export default function NoteEditor() {
  const params = useParams();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [content, setContent] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadNote(params.id as string);
    }
  }, [params.id]);

  async function loadNote(id: string) {
    try {
      const res = await fetch(`/api/notes/${id}`);
      const data = await res.json();
      if (data.success) {
        setNote(data.data);
        setTitle(data.data.title);
        setIcon(data.data.icon || '📝');
        setContent(data.data.content);
        setTags(data.data.tags || []);
      } else {
        toast.error('Failed to load note');
        router.push('/notes');
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      toast.error('Failed to load note');
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!note) return;

    setSaving(true);
    try {
      const contentMd = content ? docToMarkdown(content) : '';

      const updates: any = {};
      if (title !== note.title) updates.title = title;
      if (icon !== note.icon) updates.icon = icon;
      if (content && JSON.stringify(content) !== JSON.stringify(note.content)) {
        updates.content = content;
        updates.contentMd = contentMd;
      }
      if (JSON.stringify(tags) !== JSON.stringify(note.tags)) {
        updates.tags = tags;
      }

      if (Object.keys(updates).length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        setNote(data.data);
        toast.success('Note saved');
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite() {
    if (!note) return;

    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !note.isFavorite }),
      });

      const data = await res.json();
      if (data.success) {
        setNote({ ...note, isFavorite: !note.isFavorite });
        toast.success(note.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  function addTag() {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    setTags([...tags, tagInput.trim()]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  // Auto-save
  useEffect(() => {
    if (note && (content !== null || title !== note.title || JSON.stringify(tags) !== JSON.stringify(note.tags))) {
      const timer = setTimeout(() => {
        saveNote();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [content, title, tags, note]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 dark:border-neutral-100 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="flex-1 h-screen overflow-hidden flex">
      <div className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-4xl mx-auto px-12 pt-16 pb-4">
          {/* Icon and Title */}
          <div className="mb-4">
            <button
              className="text-6xl mb-4 hover:opacity-70 transition-opacity"
              onClick={() => {
                const newIcon = prompt('Enter an emoji:', icon);
                if (newIcon) setIcon(newIcon);
              }}
            >
              {icon}
            </button>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100"
              placeholder="Untitled Note"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-900 dark:text-neutral-100"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag..."
                className="px-3 py-1 text-sm border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              />
              <button
                onClick={addTag}
                className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={toggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                note.isFavorite
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
              {note.isFavorite ? 'Favorited' : 'Add to favorites'}
            </button>

            <button
              onClick={() => setShowAIAssistant(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
            </button>

            <button
              onClick={saveNote}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            {/* Linked notes indicator */}
            {(note.linkedNotes.length > 0 || note.linkedFrom.length > 0) && (
              <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                <Link2 className="w-4 h-4" />
                {note.linkedNotes.length + note.linkedFrom.length} linked
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="max-w-4xl mx-auto pb-32">
          <EnhancedTiptapEditor
            value={content}
            onChange={setContent}
            onAIAssistant={() => setShowAIAssistant(true)}
          />
        </div>
      </div>

      {showAIAssistant && (
        <AIAssistant
          onClose={() => setShowAIAssistant(false)}
          editorContent={content}
        />
      )}
    </div>
  );
}
```

### Step 4: Add Deep Research to Note Conversion

Update `/src/app/research/page.tsx` to add a "Save to Notes" button:

```typescript
// Add this function in the ResearchStreamPage component:
async function saveToNotes() {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: query.slice(0, 100) || 'Research Note',
        contentMd: markdown,
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: markdown }] }] },
        tags: ['research'],
        sourceType: 'research',
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Saved to notes!');
      window.location.href = `/notes/${data.data.id}`;
    }
  } catch (error) {
    toast.error('Failed to save to notes');
  }
}

// Add this button next to the "Copy Markdown" button:
<button
  onClick={saveToNotes}
  disabled={!markdown}
  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
>
  <Plus className="w-4 h-4" />
  Save to Notes
</button>
```

### Step 5: Update Navigation

Update Sidebar.tsx and Nav.tsx to add "Notes" link:

```typescript
<Link
  href="/notes"
  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
>
  <FileText className="w-4 h-4" />
  <span>Notes</span>
</Link>
```

## 🎯 Features Summary

### What You Get:
1. **Grid/List View** - Beautiful card layout for notes
2. **Full-text Search** - Search notes by title or content
3. **Tag System** - Organize with multiple tags per note
4. **Note Linking** - Create knowledge graph connections
5. **Favorites** - Star important notes
6. **Auto-save** - Changes save automatically
7. **Research Integration** - Convert research to editable notes
8. **Metadata Tracking** - Know where notes came from
9. **Tiptap Editor** - Rich text editing for all notes
10. **AI Assistant** - Built-in AI help for every note

## 📊 Database Structure

```
Note
├── id (unique identifier)
├── title
├── icon (emoji)
├── content (Tiptap JSON)
├── contentMd (markdown for search)
├── tags[] (array of strings)
├── category
├── sourceType (research/manual/thread)
├── sourceId (original source reference)
├── isFavorite
├── isArchived
└── linkedNotes/linkedFrom (bidirectional links)

NoteLink
├── sourceNoteId
├── targetNoteId
└── linkType (reference/related/follows)
```

## 🔄 Complete Workflow

1. **Do Research** → Deep research with AI
2. **Save to Notes** → Convert to editable note
3. **Edit & Enhance** → Use Tiptap editor with AI
4. **Tag & Organize** → Add tags and categories
5. **Link Notes** → Connect related knowledge
6. **Find & Reuse** → Search and reference later

All data persists in PostgreSQL with full relationships!
