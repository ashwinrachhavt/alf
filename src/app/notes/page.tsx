"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Star, Archive, Tag, Folder, Clock, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Note = {
  id: string;
  title: string;
  icon: string | null;
  coverUrl: string | null;
  tags: string[];
  category: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  async function loadNotes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (showFavorites) params.set("favorite", "true");
      
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      setNotes(data.success ? data.data : []);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [selectedCategory, showFavorites]);

  async function createNote() {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Note",
          icon: "📝",
          tags: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/notes/${data.data.id}` as any);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  async function deleteNote(noteId: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // Reload notes after deletion
        await loadNotes();
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            Notes
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your knowledge base powered by AI
          </p>
        </div>
        <Button onClick={createNote} variant="primary" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showFavorites ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
              >
                <Star className="w-4 h-4 mr-2" />
                Favorites
              </Button>

              {categories.length > 0 && (
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="h-8 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat!}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-neutral-500 dark:text-neutral-400">Loading notes...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card className="py-20">
          <CardContent className="text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-neutral-400 dark:text-neutral-600" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {searchQuery ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first note to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={createNote} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="relative group">
              <Link href={`/notes/${note.id}` as any}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  {note.coverUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                      <img
                        src={note.coverUrl}
                        alt={note.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-2xl">{note.icon || "📝"}</span>
                        <CardTitle className="text-base truncate">
                          {note.title}
                        </CardTitle>
                      </div>
                      {note.isFavorite && (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Category */}
                  {note.category && (
                    <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                      <Folder className="w-3 h-3" />
                      <span>{note.category}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <button
              onClick={(e) => deleteNote(note.id, e)}
              className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              aria-label="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
