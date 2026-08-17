"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ARTICLE_CATEGORIES } from "@/lib/data/article-categories";
import { formatDate } from "@/components/marketing/mk";

/* Insights list: category filter row, three cards across, newest first,
   with pagination. A search box sits above the grid, hidden until there
   are more than twenty articles (Insights spec — built now, shown later).
   Cards carry image, category, title, one-line summary, author and date;
   no reading time; title never overlaid on the image. */

export type InsightListItem = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  image: string | null;
  author: string;
  publishedAt: string | null; // ISO
};

const PER_PAGE = 9;
const SEARCH_THRESHOLD = 20;
const ACCENTS = ["a-gold", "a-navy", "a-bronze"] as const;

export function InsightsBrowser({ articles }: { articles: InsightListItem[] }) {
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (cat === "All" || a.category === cat) &&
        (!needle || a.title.toLowerCase().includes(needle) || a.excerpt.toLowerCase().includes(needle)),
    );
  }, [articles, cat, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  // Only offer the categories that have at least one article; the rest would
  // filter to an empty grid.
  const cats = ARTICLE_CATEGORIES.filter((c) => articles.some((a) => a.category === c));

  const pick = (c: string) => { setCat(c); setPage(1); };

  return (
    <>
      <div className="ins-filters" role="tablist" aria-label="Categories">
        {["All", ...cats].map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={`ins-chip${cat === c ? " on" : ""}`} onClick={() => pick(c)}>
            {c}
          </button>
        ))}
      </div>
      {articles.length > SEARCH_THRESHOLD && (
        <div className="ins-search">
          <input
            type="search"
            placeholder="Search the guides"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            aria-label="Search articles"
          />
        </div>
      )}
      {slice.length === 0 ? (
        <p className="lead" style={{ marginTop: 30 }}>No guides in this category yet. More are on the way.</p>
      ) : (
        <div className="ins4-grid" style={{ marginTop: 30 }}>
          {slice.map((a, i) => (
            <Link key={a.slug} href={`/insights/${a.slug}`} className="icard">
              <div
                className={`icard-img ${ACCENTS[i % 3]}${a.image ? " has-photo" : ""}`}
                style={a.image ? { backgroundImage: `url(${a.image})` } : undefined}
                aria-hidden
              />
              <div className="icard-body">
                <span className="icard-cat">{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.excerpt}</p>
                <div className="icard-by">
                  {a.author && <b>{a.author}</b>}
                  {a.author && a.publishedAt && <span aria-hidden> · </span>}
                  {a.publishedAt && <time dateTime={a.publishedAt}>{formatDate(new Date(a.publishedAt))}</time>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="ins-pages" aria-label="Pages">
          <button className="pill sm ghost" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Previous</button>
          <span>Page {cur} of {pages}</span>
          <button className="pill sm ghost" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next</button>
        </nav>
      )}
    </>
  );
}
