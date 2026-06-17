"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Text } from "@/components/atoms/Text";
import { ArticleContent } from "@/components/molecules/ArticleContent";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { timeAgo } from "@/lib/formatters/time";
import type { Article } from "@/features/news/newsTypes";

/**
 * Contextual news reader that slides in without covering the chart: a right
 * sidebar on desktop, a bottom sheet on mobile. Opened from the chart's news
 * markers so you can read a headline while the price stays in view.
 */
export function NewsDrawer({
  article,
  onClose,
}: {
  article: Article | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOpen = article !== null;

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const hidden = isDesktop ? { x: "100%" } : { y: "100%" };

  return (
    <AnimatePresence>
      {article ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Close article"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={article.title}
            initial={hidden}
            animate={{ x: 0, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={
              "absolute flex flex-col border-border-default bg-surface shadow-lg " +
              // Mobile: bottom sheet.
              "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t " +
              // Desktop: right sidebar.
              "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0"
            }
          >
            {/* Grab handle (mobile only). */}
            <div className="flex justify-center pt-2 md:hidden">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                <span className="rounded-md bg-overlay px-2 py-0.5 font-medium uppercase tracking-wider text-text-secondary">
                  {article.source}
                </span>
                <span>{timeAgo(article.published)}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-overlay hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <CloseGlyph />
              </button>
            </div>

            {/* Body */}
            <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
              <ArticleContent article={article} onNavigate={onClose} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle p-4">
              <Text variant="caption" tone="tertiary">
                From {article.source}
              </Text>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-text-inverse shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Read full story
                <ExternalGlyph />
              </a>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CloseGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ExternalGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
