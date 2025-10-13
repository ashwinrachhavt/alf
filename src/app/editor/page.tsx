"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Share, Eye, Lock, Save, FileText, Users, MessageSquare } from "lucide-react";
import NotionEditor from "@/components/NotionEditor";
import { storageManager, type NotionDocument } from "@/lib/storage";
import { toast } from "sonner";

// Remove the interface since we're using the one from storage
// interface Document extends NotionDocument {}

export default function EditorPage() {
  const [currentDoc, setCurrentDoc] = useState<NotionDocument | null>(null);
  const [documents, setDocuments] = useState<NotionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("Untitled Document");
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadDocuments();
    createNewDocument();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await storageManager.getDocuments();
      setDocuments(docs.slice(0, 10)); // Limit to 10 recent documents
    } catch (err) {
      console.error('Error loading documents:', err);
      toast.error("Failed to load documents");
    }
  };

  const createNewDocument = async () => {
    setIsLoading(true);
    try {
      const newDoc = await storageManager.saveDocument({
        title: "Untitled Document",
        blocks: [{
          id: `block_${Date.now()}`,
          type: "text",
          content: "",
          order: 0
        }]
      });
      
      setCurrentDoc(newDoc);
      setTitle(newDoc.title);
      await loadDocuments();
      
      if (!storageManager.isSupabaseEnabled()) {
        toast.info("Using local storage (Supabase not available)");
      }
    } catch (err) {
      console.error('Error creating document:', err);
      toast.error("Failed to create document");
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocument = async (blocks: any[]) => {
    if (!currentDoc) return;
    
    setIsSaving(true);
    try {
      const updatedDoc = await storageManager.saveDocument({
        ...currentDoc,
        title,
        blocks
      });
      
      setCurrentDoc(updatedDoc);
      await loadDocuments();
    } catch (err) {
      console.error('Error saving document:', err);
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  const loadDocument = async (docId: string) => {
    try {
      const doc = await storageManager.getDocument(docId);
      if (!doc) {
        toast.error("Document not found");
        return;
      }
      
      setCurrentDoc(doc);
      setTitle(doc.title);
    } catch (err) {
      console.error('Error loading document:', err);
      toast.error("Failed to load document");
    }
  };

  const togglePublic = async () => {
    if (!currentDoc) return;

    try {
      const shareToken = !currentDoc.is_public ? storageManager.generateShareToken() : undefined;
      
      const updatedDoc = await storageManager.saveDocument({
        ...currentDoc,
        is_public: !currentDoc.is_public,
        share_token: shareToken
      });
      
      setCurrentDoc(updatedDoc);
      
      const message = updatedDoc.is_public ? "Document made public" : "Document made private";
      toast.success(message);
      
      if (!storageManager.isSupabaseEnabled() && updatedDoc.is_public) {
        toast.info("Public sharing requires Supabase setup");
      }
      
      await loadDocuments();
    } catch (err) {
      console.error('Error updating document privacy:', err);
      toast.error("Failed to update document privacy");
    }
  };

  const copyShareLink = () => {
    if (!currentDoc?.share_token) return;
    
    const shareUrl = `${window.location.origin}/shared/${currentDoc.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => currentDoc && saveDocument(currentDoc.blocks)}
                  className="bg-transparent text-xl font-semibold border-none outline-none text-white placeholder-gray-400"
                  placeholder="Untitled Document"
                />
              </div>
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs text-gray-400 flex items-center gap-1"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Saving...
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={togglePublic}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  currentDoc?.is_public 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                {currentDoc?.is_public ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {currentDoc?.is_public ? 'Public' : 'Private'}
              </button>

              {currentDoc?.is_public && (
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
                >
                  <Share className="w-4 h-4" />
                  Share
                </button>
              )}

              <button
                onClick={createNewDocument}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                New
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Documents</h3>
              <div className="space-y-1">
                {documents.map((doc) => (
                  <motion.button
                    key={doc.id}
                    onClick={() => loadDocument(doc.id)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentDoc?.id === doc.id 
                        ? 'bg-blue-600/20 border border-blue-500/30' 
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-white truncate">
                        {doc.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {doc.is_public && <Eye className="w-3 h-3" />}
                      <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Features</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  Auto-save enabled
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Collaborative editing
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Block comments
                </div>
                <div className="flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Public sharing
                </div>
              </div>
            </div>
          </aside>

          {/* Main Editor */}
          <main className="min-h-[80vh]">
            {currentDoc ? (
              <NotionEditor
                documentId={currentDoc.id}
                initialBlocks={currentDoc.blocks}
                onSave={saveDocument}
                className="max-w-4xl mx-auto"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Loading document...</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}