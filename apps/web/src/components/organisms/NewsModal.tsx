"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";

import { Kbd } from "@/components/atoms/Kbd";
import { ArticleContent } from "@/components/molecules/ArticleContent";
import { timeAgo } from "@/lib/formatters/time";
import type { Article } from "@/features/news/newsTypes";

interface NewsModalContextValue {
  /** Open the reader popup for a given article. */
  open: (article: Article) => void;
  close: () => void;
}

const NewsModalContext = createContext<NewsModalContextValue | null>(null);

/**
 * App-wide news reader. News cards stay compact (a couple of lines) and call
 * `open(article)` to surface the full story in a centered popup — title,
 * source, timestamp, full snippet, tagged coins, and a link out to the
 * original. One modal instance lives here so every card shares it.
 */
export function NewsModalProvider({ children }: { children: ReactNode }) {
  const [article, setArticle] = useState<Article | null>(null);

  const open = useCallback((a: Article) => setArticle(a), []);
  const close = useCallback(() => setArticle(null), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <NewsModalContext.Provider value={value}>
      {children}
      <ReaderModal article={article} onClose={close} />
    </NewsModalContext.Provider>
  );
}

export function useNewsModal(): NewsModalContextValue {
  const ctx = useContext(NewsModalContext);
  if (!ctx) {
    throw new Error("useNewsModal must be used inside <NewsModalProvider />");
  }
  return ctx;
}

// ---------------------------------------------------------------------------

function ReaderModal({
  article,
  onClose,
}: {
  article: Article | null;
  onClose: () => void;
}) {
  const isOpen = article !== null;

  // Close on Escape + lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {article ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Close article"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={article.title}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-default bg-surface shadow-lg"
          >
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
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </div>

            {/* Body (scrolls if long) */}
            <div className="thin-scrollbar flex-1 overflow-y-auto p-5">
              <ArticleContent article={article} onNavigate={onClose} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border-subtle p-4">
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <Kbd>esc</Kbd> to close
              </span>
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-text-inverse shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Read full story
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

