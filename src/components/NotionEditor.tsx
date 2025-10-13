"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical, MoreHorizontal, Type, Image, Code, List, Quote, Table, Hash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { storageManager } from "@/lib/storage";
import { toast } from "sonner";

interface Block {
  id: string;
  type: "text" | "heading" | "quote" | "code" | "list" | "image" | "table";
  content: string;
  order: number;
  metadata?: Record<string, any>;
}

interface NotionEditorProps {
  documentId?: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
  className?: string;
}

const BLOCK_TYPES = [
  { type: "text", icon: Type, label: "Text", placeholder: "Type something..." },
  { type: "heading", icon: Hash, label: "Heading", placeholder: "# Heading" },
  { type: "quote", icon: Quote, label: "Quote", placeholder: "> Quote" },
  { type: "code", icon: Code, label: "Code", placeholder: "```\ncode\n```" },
  { type: "list", icon: List, label: "List", placeholder: "- Item 1\n- Item 2" },
];

export default function NotionEditor({ 
  documentId, 
  initialBlocks = [], 
  onSave,
  className = "" 
}: NotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Auto-save functionality
  useEffect(() => {
    if (blocks.length === 0) return;
    
    const saveTimeout = setTimeout(() => {
      handleAutoSave();
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(saveTimeout);
  }, [blocks]);

  const handleAutoSave = useCallback(async () => {
    if (!documentId || blocks.length === 0) return;
    
    try {
      // Get the current document first to preserve other fields
      const currentDoc = await storageManager.getDocument(documentId);
      if (!currentDoc) return;
      
      await storageManager.saveDocument({
        ...currentDoc,
        blocks: blocks
      });
      
      if (onSave) {
        onSave(blocks);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [blocks, documentId, onSave]);

  const createBlock = (type: Block["type"], content: string = "", insertAfter?: string): Block => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      order: insertAfter ? getInsertOrder(insertAfter) : blocks.length,
    };
    return newBlock;
  };

  const getInsertOrder = (afterBlockId: string): number => {
    const afterIndex = blocks.findIndex(b => b.id === afterBlockId);
    if (afterIndex === -1) return blocks.length;
    
    const nextBlock = blocks[afterIndex + 1];
    const afterBlock = blocks[afterIndex];
    
    return nextBlock ? (afterBlock.order + nextBlock.order) / 2 : afterBlock.order + 1;
  };

  const addBlock = (type: Block["type"], insertAfter?: string) => {
    const newBlock = createBlock(type, "", insertAfter);
    
    if (insertAfter) {
      const insertIndex = blocks.findIndex(b => b.id === insertAfter) + 1;
      const newBlocks = [...blocks];
      newBlocks.splice(insertIndex, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }
    
    setActiveBlock(newBlock.id);
    setShowBlockMenu(null);
    
    // Focus the new block
    setTimeout(() => {
      const element = document.getElementById(`block-${newBlock.id}`);
      if (element) {
        element.focus();
      }
    }, 100);
  };

  const updateBlock = (blockId: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, content } : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length <= 1) return; // Keep at least one block
    
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setActiveBlock(null);
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const newBlock = createBlock(block.type, block.content, blockId);
    const insertIndex = blocks.findIndex(b => b.id === blockId) + 1;
    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock("text", blockId);
    } else if (e.key === "Backspace") {
      const block = blocks.find(b => b.id === blockId);
      if (block?.content === "") {
        e.preventDefault();
        deleteBlock(blockId);
      }
    }
  };

  // Initialize with one block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      setBlocks([createBlock("text")]);
    }
  }, []);

  const renderBlockContent = (block: Block) => {
    if (activeBlock === block.id) {
      return (
        <textarea
          id={`block-${block.id}`}
          value={block.content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onBlur={() => setActiveBlock(null)}
          onKeyDown={(e) => handleKeyDown(e, block.id)}
          placeholder={BLOCK_TYPES.find(t => t.type === block.type)?.placeholder}
          className="w-full bg-transparent border-none outline-none resize-none text-inherit font-inherit leading-inherit"
          style={{ minHeight: "1.5em" }}
          autoFocus
        />
      );
    }

    if (!block.content) {
      return (
        <div 
          className="text-gray-400 cursor-text"
          onClick={() => setActiveBlock(block.id)}
        >
          {BLOCK_TYPES.find(t => t.type === block.type)?.placeholder}
        </div>
      );
    }

    switch (block.type) {
      case "heading":
        return (
          <div onClick={() => setActiveBlock(block.id)} className="cursor-text">
            <ReactMarkdown className="prose-headings:text-foreground prose-headings:font-bold">
              {block.content}
            </ReactMarkdown>
          </div>
        );
      case "quote":
        return (
          <blockquote 
            onClick={() => setActiveBlock(block.id)}
            className="border-l-4 border-blue-500 pl-4 italic text-gray-300 cursor-text"
          >
            {block.content.replace(/^>\s*/, "")}
          </blockquote>
        );
      case "code":
        return (
          <pre 
            onClick={() => setActiveBlock(block.id)}
            className="bg-gray-800 rounded-lg p-4 overflow-x-auto cursor-text"
          >
            <code className="text-green-400 font-mono text-sm">
              {block.content.replace(/^```\n?|\n?```$/g, "")}
            </code>
          </pre>
        );
      case "list":
        return (
          <div onClick={() => setActiveBlock(block.id)} className="cursor-text">
            <ReactMarkdown className="prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-300">
              {block.content}
            </ReactMarkdown>
          </div>
        );
      default:
        return (
          <div onClick={() => setActiveBlock(block.id)} className="cursor-text">
            <ReactMarkdown className="prose prose-invert max-w-none">
              {block.content}
            </ReactMarkdown>
          </div>
        );
    }
  };

  return (
    <div className={`notion-editor ${className}`} ref={editorRef}>
      <div className="space-y-2">
        <AnimatePresence>
          {blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="group relative"
            >
              {/* Block Controls */}
              <div className="absolute left-0 top-1 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1">
                <button
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                  onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Block Menu */}
              <AnimatePresence>
                {showBlockMenu === block.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-8 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-48"
                  >
                    <div className="p-2">
                      <div className="text-xs text-gray-400 mb-2 px-2">Add block</div>
                      {BLOCK_TYPES.map((blockType) => {
                        const Icon = blockType.icon;
                        return (
                          <button
                            key={blockType.type}
                            onClick={() => addBlock(blockType.type as Block["type"], block.id)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-left text-sm text-gray-200"
                          >
                            <Icon className="w-4 h-4" />
                            {blockType.label}
                          </button>
                        );
                      })}
                      <hr className="my-2 border-gray-700" />
                      <button
                        onClick={() => duplicateBlock(block.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-left text-sm text-gray-200"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-red-600 rounded text-left text-sm text-red-400 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Block Content */}
              <div className={`
                notion-block bg-gray-900/30 rounded-xl p-6 min-h-[3rem] border border-gray-800/50
                ${activeBlock === block.id ? 'ring-2 ring-blue-500/30 border-blue-500/30 bg-gray-900/60' : 'hover:border-gray-700/70 hover:bg-gray-900/40'}
                transition-all duration-300 backdrop-blur-sm
                ${block.type === 'heading' ? 'bg-gradient-to-r from-gray-900/40 to-gray-800/20' : ''}
                ${block.type === 'quote' ? 'bg-gradient-to-r from-blue-900/20 to-gray-900/20' : ''}
                ${block.type === 'code' ? 'bg-gradient-to-r from-green-900/20 to-gray-900/20' : ''}
              `}>
                {renderBlockContent(block)}
              </div>

              {/* Block Actions */}
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Block Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => addBlock("text")}
          className="w-full p-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
        >
          <Plus className="w-5 h-5 mx-auto" />
        </motion.button>
      </div>
    </div>
  );
}