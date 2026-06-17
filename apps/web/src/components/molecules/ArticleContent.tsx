"use client";

import Link from "next/link";

import { Badge } from "@/components/atoms/Badge";
import { Text } from "@/components/atoms/Text";
import { htmlToText, toParagraphs } from "@/lib/formatters/html";
import type { Article } from "@/features/news/newsTypes";

/**
 * The article body shared by the centered reader popup and the chart's
 * sidebar/bottom-sheet reader: decoded title, cleaned paragraphs, and tagged
 * coins. Keeping it in one place means both readers stay identical.
 */
export function ArticleContent({
  article,
  onNavigate,
}: {
  article: Article;
  /** Called when a coin chip is followed, so the host can close itself. */
  onNavigate?: () => void;
}) {
  const paragraphs = toParagraphs(article.snippet);

  return (
    <>
      <Text as="h2" variant="title" className="text-2xl leading-snug">
        {htmlToText(article.title) || article.title}
      </Text>

      {paragraphs.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {paragraphs.map((p, i) => (
            <Text
              key={i}
              as="p"
              variant="body"
              tone="secondary"
              className="block leading-relaxed"
            >
              {p}
            </Text>
          ))}
        </div>
      ) : (
        <Text variant="body" tone="tertiary" className="mt-4 block italic">
          No preview available — read the full story at the source.
        </Text>
      )}

      {article.coins.length > 0 ? (
        <div className="mt-5">
          <Text variant="label" tone="tertiary" className="block">
            Mentioned
          </Text>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {article.coins.map((coin) => (
              <Link key={coin} href={`/coins/${coin}`} onClick={onNavigate}>
                <Badge
                  tone="neutral"
                  className="transition-colors hover:bg-overlay-strong"
                >
                  {coin}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
