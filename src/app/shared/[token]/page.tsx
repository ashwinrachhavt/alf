"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, MessageSquare, Share, ExternalLink } from "lucide-react";
import NotionEditor from "@/components/NotionEditor";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SharedDocument {
  id: string;
  title: string;
  blocks: any[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

interface Comment {
  id: string;
  block_id: string;
  content: string;
  author_name: string;
  author_email: string;
  created_at: string;
  resolved: boolean;
}

export default function SharedDocumentPage({ params }: { params: { token: string } }) {
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState({ name: "", email: "" });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  useEffect(() => {
    loadSharedDocument();
  }, [params.token]);

  const loadSharedDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('notion_documents')
        .select('*')
        .eq('share_token', params.token)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      
      setDocument(data);
      await loadComments(data.id);
    } catch (err) {
      console.error('Error loading shared document:', err);
      toast.error("Document not found or not public");
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('notion_block_comments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const addComment = async () => {
    if (!document || !newComment.trim() || !commentAuthor.name.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notion_block_comments')
        .insert({
          document_id: document.id,
          block_id: selectedBlockId || 'general',
          content: newComment,
          author_name: commentAuthor.name,
          author_email: commentAuthor.email,
        })
        .select()
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error("Failed to add comment");
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading shared document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
          <p className="text-gray-400">This document may be private or the link may be invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Eye className="w-6 h-6 text-green-400" />
                <h1 className="text-xl font-semibold">{document.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Shared Document</span>
                <span>•</span>
                <span>Updated {new Date(document.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Comments ({comments.length})
              </button>

              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
              >
                <Share className="w-4 h-4" />
                Share
              </button>

              <a
                href="/editor"
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Create Your Own
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className={`grid ${showComments ? 'grid-cols-[1fr_320px]' : 'grid-cols-1'} gap-8`}>
          {/* Main Content */}
          <main>
            <NotionEditor
              documentId={document.id}
              initialBlocks={document.blocks}
              className="max-w-4xl mx-auto"
            />
          </main>

          {/* Comments Sidebar */}
          {showComments && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-900/50 rounded-lg border border-gray-800 p-4 h-fit sticky top-24"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments
              </h3>

              {/* Add Comment Form */}
              <div className="space-y-3 mb-6 p-3 bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={commentAuthor.name}
                    onChange={(e) => setCommentAuthor(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={commentAuthor.email}
                    onChange={(e) => setCommentAuthor(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400"
                  />
                </div>
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 resize-none"
                  rows={3}
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim() || !commentAuthor.name.trim()}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
                >
                  Add Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm text-white">{comment.author_name}</span>
                          <div className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString()} at{' '}
                            {new Date(comment.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{comment.content}</p>
                      {comment.block_id !== 'general' && (
                        <div className="mt-2 text-xs text-blue-400">
                          On block: {comment.block_id.slice(0, 8)}...
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">Be the first to add one!</p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </div>
      </div>
    </div>
  );
}