"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type TypewriterMarkdownProps = {
  content: string;
  className?: string;
};

const TypewriterMarkdown = memo(function TypewriterMarkdown({ content, className }: TypewriterMarkdownProps) {
  return (
    <motion.div
      layout
      data-slot="typewriter-markdown"
      initial={{ opacity: 0.6, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 22 }}
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none space-y-4 font-mono text-sm leading-relaxed md:text-base",
        "prose-headings:border-b prose-headings:border-dashed prose-headings:border-foreground/20 prose-headings:pb-2",
        "prose-li:marker:text-foreground/60 prose-blockquote:border-l-2 prose-blockquote:border-foreground/40",
        "prose-code:rounded-md prose-code:bg-foreground/5 prose-code:px-1.5 prose-code:py-0.5",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
    </motion.div>
  );
});

export default TypewriterMarkdown;
