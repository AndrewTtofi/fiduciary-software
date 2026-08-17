import Link from "next/link";
import type { ArticleData } from "@/lib/services/articles";
import { formatDate } from "@/components/marketing/mk";

/* Insight card (Insights spec): image, category tag, title, one-line
   summary, author name and publication date. The title sits BELOW the
   image, never overlaid on it. No reading-time label. Cards are equal
   height regardless of title length (flex column, footer pinned). Articles
   without an image get a navy/gold gradient panel in the palette. */

const ACCENTS = ["a-gold", "a-navy", "a-bronze"] as const;

export function InsightCard({ article, index }: { article: ArticleData; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <Link href={`/insights/${article.slug}`} className="icard">
      <div
        className={`icard-img ${accent}${article.image ? " has-photo" : ""}`}
        style={article.image ? { backgroundImage: `url(${article.image})` } : undefined}
        aria-hidden
      />
      <div className="icard-body">
        <span className="icard-cat">{article.category}</span>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <div className="icard-by">
          {article.author && <b>{article.author}</b>}
          {article.author && article.publishedAt && <span aria-hidden> · </span>}
          {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{formatDate(article.publishedAt)}</time>}
        </div>
      </div>
    </Link>
  );
}
