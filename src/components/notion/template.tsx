"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils";

const fade: Parameters<typeof motion.div>[0]["transition"] = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1],
};

export function NotionTemplate({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/95 shadow-subtle backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/70",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(12,12,12,0.04),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_60%)]" />
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-800" />
        <div className="absolute inset-y-8 left-12 w-px bg-neutral-200/60 dark:bg-neutral-800/60" />
        <div className="absolute inset-y-14 right-12 w-px bg-neutral-200/60 dark:bg-neutral-800/60" />
        <div className="relative p-8 md:p-12">{children}</div>
      </div>
    </motion.div>
  );
}

type NotionTemplateHeaderProps = {
  title: string;
  description?: string;
  kicker?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function NotionTemplateHeader({
  title,
  description,
  kicker,
  meta,
  actions,
  className,
}: NotionTemplateHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="space-y-3">
        {kicker ? (
          <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-500 dark:text-neutral-400">
            {kicker}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? <div className="text-xs text-neutral-500 dark:text-neutral-400">{meta}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 md:gap-3">{actions}</div> : null}
    </motion.header>
  );
}

type NotionTemplateSectionProps = {
  title?: string;
  description?: string;
  kicker?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
  bleed?: "none" | "full";
};

export function NotionTemplateSection({
  title,
  description,
  kicker,
  children,
  aside,
  className,
  bleed = "none",
}: NotionTemplateSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={fade}
      className={cn(
        "grid gap-8 md:grid-cols-[minmax(0,_240px)_1fr] md:gap-12",
        bleed === "full" && "md:mx-[-1.5rem] md:px-6",
        className,
      )}
    >
      <div className="space-y-3">
        {kicker ? (
          <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-500 dark:text-neutral-400">{kicker}</p>
        ) : null}
        {title ? (
          <h2 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-neutral-100 md:text-xl">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
        {aside ? <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">{aside}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </motion.section>
  );
}

type NotionTemplateGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
};

export function NotionTemplateGrid({
  children,
  columns = 2,
  className,
}: NotionTemplateGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "md:grid-cols-1",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

type NotionTemplateCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  href?: string;
  className?: string;
};

export function NotionTemplateCard({
  title,
  description,
  eyebrow,
  icon,
  children,
  actions,
  href,
  className,
}: NotionTemplateCardProps) {
  const content = (
    <motion.article
      whileHover={{ y: -4, translateZ: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white/80 p-5 text-left shadow-subtle transition dark:border-neutral-800/70 dark:bg-neutral-950/80",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/70 bg-white text-sm font-medium text-neutral-900 transition group-hover:border-neutral-900/40 dark:border-neutral-800/70 dark:bg-neutral-950 dark:text-neutral-100">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          {eyebrow ? (
            <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              {eyebrow}
            </span>
          ) : null}
          <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">{title}</h3>
          {description ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="text-sm text-neutral-600 dark:text-neutral-400">{children}</div> : null}
      {actions ? <div className="mt-auto pt-2 text-sm text-neutral-500 dark:text-neutral-400">{actions}</div> : null}
    </motion.article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100">
        {content}
      </Link>
    );
  }

  return content;
}

type NotionTemplateDividerProps = {
  label?: string;
  className?: string;
};

export function NotionTemplateDivider({
  label,
  className,
}: NotionTemplateDividerProps) {
  return (
    <div className={cn("relative flex items-center gap-3 py-6 text-xs uppercase tracking-[0.3em]", className)}>
      <div className="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
      {label ? <span className="text-neutral-400 dark:text-neutral-500">{label}</span> : null}
      <div className="h-px flex-1 bg-neutral-200/80 dark:bg-neutral-800/80" />
    </div>
  );
}

type NotionTemplatePillProps = {
  children: ReactNode;
  className?: string;
};

export function NotionTemplatePill({ children, className }: NotionTemplatePillProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-neutral-500 shadow-subtle dark:border-neutral-800/70 dark:bg-neutral-950",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

type NotionTemplateListProps = {
  items: Array<{ title: string; description?: string; meta?: string }>;
  className?: string;
};

export function NotionTemplateList({ items, className }: NotionTemplateListProps) {
  return (
    <ul className={cn("space-y-4 text-sm text-neutral-600 dark:text-neutral-400", className)}>
      {items.map((item, index) => (
        <motion.li
          key={item.title}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ ...fade, delay: index * 0.05 }}
          className="rounded-xl border border-neutral-200/80 bg-white/80 p-4 dark:border-neutral-800/60 dark:bg-neutral-950/60"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
            {item.meta ? (
              <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                {item.meta}
              </span>
            ) : null}
          </div>
          {item.description ? <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{item.description}</p> : null}
        </motion.li>
      ))}
    </ul>
  );
}
