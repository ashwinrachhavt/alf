"use client";

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { X, Send, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface AIAssistantProps {
  onClose: () => void;
  editorContent?: any;
  onApplyEdit?: (content: string) => void;
}

export default function AIAssistant({ onClose, editorContent, onApplyEdit }: AIAssistantProps) {
  const [input, setInput] = useState('');

  const { messages, isLoading, append, setMessages } = useChat({
    api: '/api/ai/chat',
    body: { editorContent },
    onToolCall: ({ toolCall }) => {
      console.log('Tool call:', toolCall);
      // Handle tool calls here if needed
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await append({
      role: 'user',
      content: input,
    });
    setInput('');
  };

  const quickPrompts = [
    { label: 'Improve writing', prompt: 'Improve the writing in this document to make it clearer and more professional.' },
    { label: 'Fix grammar', prompt: 'Fix any grammar and spelling errors in this document.' },
    { label: 'Make it shorter', prompt: 'Make this document more concise while keeping the key points.' },
    { label: 'Expand ideas', prompt: 'Expand on the ideas in this document with more details and examples.' },
  ];

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 border-l border-neutral-200/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Powered by GPT-4
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-medium mb-2">How can I help?</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Ask me to improve your writing, generate content, or answer questions about your document.
            </p>

            {/* Quick prompts */}
            <div className="space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => {
                    append({
                      role: 'user',
                      content: prompt.prompt,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm text-left border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] rounded-xl px-4 py-2 text-sm
                ${message.role === 'user'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                }
              `}
            >
              {message.content}

              {/* Tool calls rendering */}
              {message.toolInvocations?.map((toolCall: any, idx: number) => (
                <div key={idx} className="mt-2 p-2 bg-white/10 rounded text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="font-medium">Action: {toolCall.toolName}</span>
                  </div>
                  <pre className="whitespace-pre-wrap opacity-75">
                    {JSON.stringify(toolCall.args, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-600 dark:text-neutral-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to help with your document..."
            className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
