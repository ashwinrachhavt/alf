"use client";

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { X, Send, Sparkles, Loader2, CheckCircle2, Search, FileEdit, FileText } from 'lucide-react';

interface AIAssistantProps {
  onClose: () => void;
  editorContent?: any;
  onApplyEdit?: (content: string) => void;
}

export default function AIAssistant({ onClose, editorContent, onApplyEdit }: AIAssistantProps) {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: { editorContent },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      console.log('Tool call:', toolCall);

      // Check if it's a dynamic tool first
      if (toolCall.dynamic) {
        return;
      }

      // Auto-execute tools - they already execute on the server
      // We just need to acknowledge completion
      if (toolCall.toolName === 'deepResearch' ||
          toolCall.toolName === 'improveWriting' ||
          toolCall.toolName === 'generateContent') {
        // The tool already executed on server, result is in the message stream
        // No action needed - the streaming will handle it
      }
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input });
    setInput('');
  };

  const quickPrompts = [
    {
      label: 'Research topic',
      prompt: 'Research the main topics in this document and provide comprehensive information with sources.',
      icon: Search
    },
    {
      label: 'Improve writing',
      prompt: 'Improve the writing in this document to make it clearer and more professional.',
      icon: FileEdit
    },
    {
      label: 'Expand ideas',
      prompt: 'Expand on the ideas in this document with more details and examples.',
      icon: FileText
    },
    {
      label: 'Fix grammar',
      prompt: 'Fix any grammar and spelling errors in this document.',
      icon: CheckCircle2
    },
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
              Research topics, improve writing, generate content, or answer questions about your document.
            </p>

            {/* Quick prompts */}
            <div className="space-y-2">
              {quickPrompts.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.label}
                    onClick={() => sendMessage({ text: prompt.prompt })}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm text-left border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id || index}
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
              {/* Render message parts */}
              {message.parts.map((part, partIndex) => {
                // Text parts
                if (part.type === 'text') {
                  return <div key={partIndex} className="whitespace-pre-wrap">{part.text}</div>;
                }

                // Tool calls with typed names
                if (part.type === 'tool-deepResearch') {
                  const query = (part.input as any)?.query || 'unknown query';
                  return (
                    <div key={partIndex} className="mt-2 p-3 bg-white/10 dark:bg-black/10 rounded-lg text-xs border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-purple-600 dark:text-purple-400">Deep Research</span>
                      </div>
                      {part.state === 'input-streaming' && (
                        <div className="text-neutral-600 dark:text-neutral-400">Researching: {query}...</div>
                      )}
                      {part.state === 'input-available' && (
                        <div className="text-neutral-600 dark:text-neutral-400">Analyzing sources for: {query}</div>
                      )}
                      {part.state === 'output-available' && (
                        <div className="mt-2">
                          <div className="text-green-600 dark:text-green-400 font-medium mb-1">Research completed</div>
                          <div className="text-xs opacity-75">
                            {(() => {
                              try {
                                const output = typeof part.output === 'string' ? JSON.parse(part.output) : part.output;
                                return `Sources analyzed: ${output?.sourceCount || 0}`;
                              } catch {
                                return 'Research completed';
                              }
                            })()}
                          </div>
                        </div>
                      )}
                      {part.state === 'output-error' && (
                        <div className="text-red-600 dark:text-red-400">Error: {part.errorText}</div>
                      )}
                    </div>
                  );
                }

                if (part.type === 'tool-improveWriting') {
                  return (
                    <div key={partIndex} className="mt-2 p-3 bg-white/10 dark:bg-black/10 rounded-lg text-xs border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileEdit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-600 dark:text-blue-400">Improving Writing</span>
                      </div>
                      {(part.state === 'input-streaming' || part.state === 'input-available') && (
                        <div className="text-neutral-600 dark:text-neutral-400">Analyzing and improving...</div>
                      )}
                      {part.state === 'output-available' && (
                        <div className="text-green-600 dark:text-green-400 font-medium">Writing improved</div>
                      )}
                      {part.state === 'output-error' && (
                        <div className="text-red-600 dark:text-red-400">Error: {part.errorText}</div>
                      )}
                    </div>
                  );
                }

                if (part.type === 'tool-generateContent') {
                  const topic = (part.input as any)?.topic || 'content';
                  return (
                    <div key={partIndex} className="mt-2 p-3 bg-white/10 dark:bg-black/10 rounded-lg text-xs border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-600 dark:text-green-400">Generating Content</span>
                      </div>
                      {(part.state === 'input-streaming' || part.state === 'input-available') && (
                        <div className="text-neutral-600 dark:text-neutral-400">Creating: {topic}...</div>
                      )}
                      {part.state === 'output-available' && (
                        <div className="text-green-600 dark:text-green-400 font-medium">Content generated</div>
                      )}
                      {part.state === 'output-error' && (
                        <div className="text-red-600 dark:text-red-400">Error: {part.errorText}</div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-600 dark:text-neutral-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Thinking...</span>
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
