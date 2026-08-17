/** Insights categories — proper names in consistent capitalisation (Insights
 *  spec). Client-safe: imported by the admin editor and the public filter, so
 *  it must not pull in Prisma. */
export const ARTICLE_CATEGORIES = [
  "Tax",
  "Residency",
  "Immigration",
  "Citizenship",
  "Company Formation",
  "International",
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
