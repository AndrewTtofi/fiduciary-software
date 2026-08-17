import { cache } from "react";
import type { Article } from "@prisma/client";
import { prisma } from "@/lib/db";

/* =====================================================================
   Insights articles (public blog).

   Articles live in the DB and are fully self-serve from the admin
   (create, edit, publish, delete — no developer involved). They can be
   added continuously: an article is live on the site the moment it is
   saved as published, and appears in the sitemap automatically.

   House rules (from the firm's Insights spec):
   - Every article carries a named author and a "correct as at" date.
   - Categories are proper names in consistent capitalisation (below).
   - One article answers one question; the search phrase (keyword) goes in
     the title, the URL and the first sentence, but is not shown as a tag.
   - No reading-time labels. No links to government portals.
   ===================================================================== */

export { ARTICLE_CATEGORIES, type ArticleCategory } from "@/lib/data/article-categories";

export type ArticleData = {
  slug: string;
  title: string;
  keyword: string;
  category: string;
  excerpt: string;
  body: string; // markdown
  image: string | null;
  author: string;
  authorRole: string;
  authorBio: string;
  correctAsAt: Date | null;
  metaTitle: string;
  metaDesc: string;
  serviceKey: string;
  publishedAt: Date | null;
};

const PUBLIC_ORDER = [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];

/** Published articles for the public site, newest first. Cached per request. */
export const getPublishedArticles = cache(async (): Promise<ArticleData[]> => {
  const rows = await prisma.article.findMany({ where: { published: true }, orderBy: PUBLIC_ORDER });
  return rows.map(toData);
});

/** One published article by slug, or null. */
export const getArticleBySlug = cache(async (slug: string): Promise<ArticleData | null> => {
  const row = await prisma.article.findUnique({ where: { slug } });
  return row?.published ? toData(row) : null;
});

/** The two most relevant other articles: same category first, then the
 *  newest of the rest. */
export function relatedArticles(all: ArticleData[], current: ArticleData, n = 2): ArticleData[] {
  const others = all.filter((a) => a.slug !== current.slug);
  const same = others.filter((a) => a.category === current.category);
  const rest = others.filter((a) => a.category !== current.category);
  return [...same, ...rest].slice(0, n);
}

/** Up to `n` published articles for a service page: tagged with the service
 *  first, then by the service's categories. Empty until articles exist —
 *  the page hides the block. */
export function articlesForService(all: ArticleData[], serviceKey: string, categories: string[], n = 3): ArticleData[] {
  const tagged = all.filter((a) => a.serviceKey === serviceKey);
  const byCat = all.filter((a) => a.serviceKey !== serviceKey && categories.includes(a.category));
  return [...tagged, ...byCat].slice(0, n);
}

/** Rough word count of a markdown body (for the contents-list threshold). */
export function wordCount(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

function toData(row: Article): ArticleData {
  return {
    slug: row.slug,
    title: row.title,
    keyword: row.keyword,
    category: row.category,
    excerpt: row.excerpt,
    body: row.body,
    image: row.image,
    author: row.author,
    authorRole: row.authorRole,
    authorBio: row.authorBio,
    correctAsAt: row.correctAsAt,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    serviceKey: row.serviceKey,
    publishedAt: row.publishedAt,
  };
}
