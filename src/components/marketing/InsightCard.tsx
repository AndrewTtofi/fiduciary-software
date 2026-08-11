import Link from "next/link";
import type { ArticleData } from "@/lib/services/articles";

/* Prototype-v2 insight card: tall image/gradient header carrying the search
   phrase, meta row (topic dot + read time), title, teaser, read arrow.
   Accent gradients rotate by position when an article has no image. */

const ACCENTS = ["a-gold", "a-navy", "a-bronze"] as const;
const ACCENT_DOT: Record<(typeof ACCENTS)[number], string> = {
  "a-gold": "#C49E54",
  "a-navy": "#2B3E5E",
  "a-bronze": "#8A6A2B",
};

function readTime(body: string): string {
  const words = body.split(/\s+/).length;
  return `${Math.max(2, Math.round(words / 220))} min read`;
}

export function InsightCard({ article, index }: { article: ArticleData; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <Link href={`/insights/${article.slug}`} className="icard">
      <div
        className={`icard-img ${accent}${article.image ? " has-photo" : ""}`}
        style={article.image ? { backgroundImage: `url(${article.image})` } : undefined}
      >
        <span className="icard-kw">{article.keyword}</span>
      </div>
      <div className="icard-body">
        <div className="icard-meta">
          <i style={{ background: ACCENT_DOT[accent] }} />
          <b>{article.keyword}</b>
          <span className="rt">{readTime(article.body)}</span>
        </div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <span className="icard-read">
          Read article{" "}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
