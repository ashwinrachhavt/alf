"use client";

import ReactMarkdown from "react-markdown";

interface ResponsiveMarkdownProps {
  content: string;
  className?: string;
}

export default function ResponsiveMarkdown({ content, className = "" }: ResponsiveMarkdownProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 text-foreground border-b border-foreground/20 pb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium mb-3 mt-6 text-foreground">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mb-2 mt-4 text-foreground">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-base font-medium mb-2 mt-3 text-foreground">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium mb-2 mt-3 text-foreground/90">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-foreground/90 leading-relaxed text-base">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 space-y-2 list-disc text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 space-y-2 list-decimal text-foreground/90">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90 leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
          code: ({ children }) => (
            <code className="px-2 py-1 bg-foreground/8 border border-foreground/10 rounded text-sm font-mono text-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="p-4 bg-foreground/5 border border-foreground/10 rounded-lg overflow-x-auto mb-4 text-sm">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <motion.blockquote 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-4 border-foreground/30 pl-4 py-2 my-4 italic text-foreground/80 bg-foreground/5 rounded-r"
            >
              {children}
            </motion.blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-foreground/20 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-foreground/10">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-foreground/20 px-4 py-3 font-semibold text-left text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-foreground/20 px-4 py-3 text-foreground/90">
              {children}
            </td>
          ),
          hr: () => (<hr className="my-8 border-foreground/20" />),
          a: ({ children, href }) => (
            <a 
              href={href}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            // @ts-ignore
            <img src={src} alt={alt} className="max-w-full h-auto rounded-lg border border-foreground/10 my-4" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
