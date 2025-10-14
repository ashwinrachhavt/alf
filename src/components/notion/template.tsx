"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type MotionProps = Parameters<typeof motion.div>[0];

const entrance: MotionProps["transition"] = {
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
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={entrance}
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] border border-neutral-200/70 bg-neutral-50/80 p-8 shadow-[0_24px_60px_rgba(15,15,15,0.08)] backdrop-blur-sm dark:border-neutral-800/60 dark:bg-neutral-950/70 dark:shadow-[0_32px_80px_rgba(0,0,0,0.45)] md:p-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(17,17,17,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 to-transparent dark:via-neutral-700" />
      <div className="absolute inset-y-10 left-12 w-px bg-neutral-200/60 dark:bg-neutral-800/60" />
      <div className="absolute inset-y-16 right-12 w-px bg-neutral-200/60 dark:bg-neutral-800/60" />
      <div className="relative space-y-12 md:space-y-16">{children}</div>
    </motion.article>
  );
}

type NotionTemplateHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function NotionTemplateHeader({
  kicker,
  title,
  description,
  meta,
  actions,
  className,
}: NotionTemplateHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={entrance}
      className={cn(
        "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-4">
        {kicker ? (
          <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-500 dark:text-neutral-400">
            {kicker}
          </p>
        ) : null}
        <div className="space-y-3">
          <h1 className="text-3xl font-medium tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <div className="text-xs text-neutral-500 dark:text-neutral-500/80">{meta}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 md:gap-3">{actions}</div>
      ) : null}
    </motion.header>
  );
}

type NotionTemplateToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function NotionTemplateToolbar({
  children,
  className,
}: NotionTemplateToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500",
        className,
      )}
    >
      {children}
    </div>
  );
}

type NotionTemplateSectionProps = {
  kicker?: string;
  title?: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  layout?: "single" | "split";
  className?: string;
};

export function NotionTemplateSection({
  kicker,
  title,
  description,
  aside,
  children,
  layout = "split",
  className,
}: NotionTemplateSectionProps) {
  const isSplit = layout === "split";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4, margin: "-64px" }}
      transition={entrance}
      className={cn(
        "grid gap-8 md:gap-12",
        isSplit
          ? "md:grid-cols-[minmax(0,_260px)_minmax(0,_1fr)]"
          : "md:grid-cols-[minmax(0,_1fr)]",
        className,
      )}
    >
      <div className={cn("space-y-4", !isSplit && "max-w-2xl")}>
        {kicker ? (
          <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500 dark:text-neutral-400">
            {kicker}
          </p>
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
        {isSplit && aside ? (
          <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
            {aside}
          </div>
        ) : null}
      </div>
      <div className="space-y-6">
        {children}
        {!isSplit && aside ? (
          <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
            {aside}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

type NotionTemplateGridProps = {
  columns?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
};

export function NotionTemplateGrid({
  columns = 2,
  className,
  children,
}: NotionTemplateGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 md:gap-6",
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
  description: string;
  icon?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function NotionTemplateCard({
  title,
  description,
  icon,
  eyebrow,
  meta,
  actions,
  className,
}: NotionTemplateCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={entrance}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border border-neutral-200/70 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,15,15,0.05)] transition-colors dark:border-neutral-800/60 dark:bg-neutral-900/70 dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            {icon ? <div className="text-lg text-neutral-900 dark:text-neutral-100">{icon}</div> : null}
            <h3 className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          </div>
        </div>
        {meta ? <div className="text-xs text-neutral-400 dark:text-neutral-500">{meta}</div> : null}
      </div>
      <p className="text-sm leading-relaxed text-neutral-600 transition-colors group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200">
        {description}
      </p>
      {actions ? (
        <div className="mt-auto text-xs text-neutral-500 transition-colors group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200">
          {actions}
        </div>
      ) : null}
    </motion.article>
  );
}

type NotionTemplateListItem = {
  title: string;
  description: string;
  meta?: string;
};

type NotionTemplateListProps = {
  items: NotionTemplateListItem[];
  className?: string;
};

export function NotionTemplateList({ items, className }: NotionTemplateListProps) {
  return (
    <ul className={cn("space-y-4", className)}>
      {items.map((item) => (
        <motion.li
          key={item.title}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-72px" }}
          transition={entrance}
          className="rounded-2xl border border-neutral-200/60 bg-neutral-50/60 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/60"
        >
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
              {item.title}
            </h4>
            {item.meta ? (
              <span className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                {item.meta}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {item.description}
          </p>
        </motion.li>
      ))}
    </ul>
  );
}

type NotionTemplateDividerProps = {
  label?: string;
  className?: string;
};

export function NotionTemplateDivider({ label, className }: NotionTemplateDividerProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className="h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80" />
      {label ? (
        <span className="absolute bg-neutral-50 px-3 text-[11px] uppercase tracking-[0.35em] text-neutral-400 dark:bg-neutral-950 dark:text-neutral-500">
          {label}
        </span>
      ) : null}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "rounded-full border border-neutral-200/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

type NotionTemplateFootnoteProps = {
  children: ReactNode;
  className?: string;
};

export function NotionTemplateFootnote({
  children,
  className,
}: NotionTemplateFootnoteProps) {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={entrance}
      className={cn(
        "rounded-2xl border border-neutral-200/70 bg-white/80 p-5 text-xs text-neutral-500 dark:border-neutral-800/60 dark:bg-neutral-900/70 dark:text-neutral-400",
        className,
      )}
    >
      {children}
    </motion.footer>
  );
}
