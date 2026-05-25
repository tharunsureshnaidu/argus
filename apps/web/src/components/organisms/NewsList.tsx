"use client";

import { Card } from "@/components/atoms/Card";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Text } from "@/components/atoms/Text";
import { NewsCard } from "@/components/molecules/NewsCard";
import { useNews } from "@/hooks/useNews";

/**
 * Vertical news stream. Pass `coin` to filter to a single ticker, or omit
 * for the global feed.
 */
export function NewsList({
  coin = null,
  limit = 12,
  title,
}: {
  coin?: string | null;
  limit?: number;
  title?: string;
}) {
  const { articles, status, error } = useNews({ coin, limit });

  return (
    <section className="flex flex-col gap-3">
      {title ? (
        <div className="flex items-baseline justify-between">
          <Text variant="subtitle">{title}</Text>
          {articles.length > 0 ? (
            <Text variant="caption" tone="tertiary">
              {articles.length} article{articles.length === 1 ? "" : "s"}
            </Text>
          ) : null}
        </div>
      ) : null}

      {status === "loading" && articles.length === 0 ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : status === "error" ? (
        <Card className="p-4">
          <Text variant="caption" tone="secondary">
            {error ?? "Couldn't load news."}
          </Text>
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-4">
          <Text variant="caption" tone="tertiary">
            No articles {coin ? `for ${coin}` : "yet"}.
          </Text>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article, i) => (
            <NewsCard key={article.link} article={article} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
