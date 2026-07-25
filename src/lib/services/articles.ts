import { cache } from "react";
import { prisma } from "@/lib/db";

/* =====================================================================
   Insights articles (public blog).

   Articles live in the DB and are fully self-serve from the admin
   (create, edit, publish, delete — no developer involved). Until the
   firm publishes its own, the site falls back to the built-in starter
   guides below so the Insights surfaces are never empty. The admin can
   import the starters into the DB to edit them.

   House rules (from the firm's SEO spec): one article targets one
   search phrase; the phrase goes in the title, the URL and the first
   sentence. No dash punctuation in visible copy.
   ===================================================================== */

export type ArticleData = {
  slug: string;
  title: string;
  keyword: string;
  excerpt: string;
  body: string; // markdown
  image: string | null;
  publishedAt: Date | null;
};

export const STARTER_ARTICLES: ArticleData[] = [
  {
    slug: "cyprus-non-dom-status",
    title: "Cyprus Non-Dom Status: Requirements, Benefits and How to Apply (2026 Guide)",
    keyword: "Cyprus non-dom status",
    excerpt:
      "0% tax on dividends for 17 years, the 60-day rule, and exactly how the application works.",
    image: "/marketing/p1.jpg",
    publishedAt: null,
    body: `If you are an entrepreneur or investor considering a move to Cyprus, Cyprus Non-Dom status is almost certainly the reason. It lets a Cyprus tax resident receive dividends with no income tax and no Special Defence Contribution for 17 years.

## What is Cyprus Non-Dom status?

Non-Dom is short for non-domiciled. Cyprus separates two questions: where you are tax resident, and where you are domiciled. If you become a Cyprus tax resident but were not born in Cyprus and have not been a Cyprus tax resident for 17 of the last 20 years, you can be treated as non-domiciled.

- 0% tax on dividend income, from Cyprus or foreign companies
- 0% tax on interest income
- No wealth tax, no inheritance tax, no gift tax in Cyprus
- The status holds for 17 years

The only charge that touches your dividends is GESY, the national health contribution, at 2.65%. It is capped at 180,000 euro of annual income, so your contribution can never exceed 4,770 euro per year. If your dividends are 1,000,000 euro, you still pay 4,770 euro.

## Who qualifies for Non-Dom status?

You need two things: Cyprus tax residency, and a non-Cypriot domicile of origin. Tax residency comes through one of two routes.

**The 183-day rule.** Spend more than 183 days in Cyprus in a calendar year.

**The 60-day rule.** The route most international founders use. In the same calendar year you spend at least 60 days in Cyprus, are not tax resident anywhere else, do not spend more than 183 days in any other single country, carry out business or hold office in a Cyprus company, and maintain a permanent home in Cyprus.

## What does the complete tax picture look like?

A typical founder structure is a Cyprus company paying 15% on profits, with the owner as a Non-Dom resident extracting dividends at effectively 0% plus the capped GESY. On 1,000,000 euro of profit fully distributed, the total burden is roughly 154,770 euro, an effective rate around 15.5%, and it falls as profits rise. Compare that with Germany, where the same profit and distribution can cost more than 48%.

## How do you apply?

- Establish the residency foundation: registration on arrival, a home, and for non-EU nationals the right permit.
- Register with the Tax Department for a Tax Identification Number, GESY and social insurance.
- File the Non-Dom application with evidence of your domicile of origin.
- Build substance: day counting records, a genuine home and real activity in Cyprus.`,
  },
  {
    slug: "cyprus-60-day-rule",
    title: "The Cyprus 60-Day Tax Residency Rule, Explained",
    keyword: "60-day rule",
    excerpt:
      "How internationally mobile founders become Cyprus tax residents in as little as 60 days.",
    image: "/marketing/p2.jpg",
    publishedAt: null,
    body: `The Cyprus 60-day rule lets internationally mobile people become Cyprus tax residents while spending as little as 60 days a year in the country. It exists precisely for founders and investors who do not sit still in any one place.

## The five conditions

All of these must hold in the same calendar year:

- You spend at least 60 days in Cyprus.
- You are not tax resident in any other country.
- You do not spend more than 183 days in any other single country.
- You carry out business in Cyprus, are employed in Cyprus, or hold an office in a Cyprus tax resident company.
- You maintain a permanent home in Cyprus, owned or rented.

## Why it matters

Tax residency is the gateway to Cyprus Non-Dom status: 0% tax on dividends and interest for 17 years, with only the capped GESY health contribution touching your dividend income.

## What to watch

Day counting is strict, and the "not tax resident anywhere else" condition needs planning if you are leaving a high-tax country with exit rules. The right sequence depends on your citizenship, your current residency and your company setup, which is exactly what we map on a call.`,
  },
  {
    slug: "register-company-in-cyprus",
    title: "How to Register a Company in Cyprus in 5 to 7 Working Days",
    keyword: "register a company in Cyprus",
    excerpt:
      "The steps, the timeline and the documents to form a Cyprus company cleanly.",
    image: "/marketing/p3.jpg",
    publishedAt: null,
    body: `To register a company in Cyprus you reserve a name with the Registrar of Companies, prepare the incorporation documents, and file. Done properly, the company is ready in 5 to 7 working days from the moment your documents are complete.

## The steps

- **Name approval.** The Registrar checks your proposed name against the register. Names too close to existing entities or containing restricted words are refused, so it pays to check first.
- **Documents.** Passport copies and proof of address for the shareholders and directors, plus the company's memorandum and articles prepared by the service provider.
- **Structure.** Shareholders, directors, secretary and registered office. Substance matters: the choices here affect tax residency and banking later.
- **Filing.** The incorporation is filed with the Registrar. Once approved, you receive the full set of corporate documents.

## After incorporation

The company needs a Tax Identification Number, VAT registration where relevant, and a bank or EMI account. These run in parallel so the company is operational quickly.

## The realistic timeline

5 to 7 working days once we have everything we need from you. The slowest step is usually gathering shareholder documents, not the Registrar.`,
  },
];

/** Published articles for the public site, newest first. Falls back to the
 *  starter guides while the DB is empty so the Insights surfaces always
 *  render. Cached per request. */
export const getPublishedArticles = cache(async (): Promise<ArticleData[]> => {
  const rows = await prisma.article.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  if (rows.length === 0) return STARTER_ARTICLES;
  return rows.map(toData);
});

/** One published article by slug (DB first, then starter fallback when the
 *  DB has no articles at all — mirrors getPublishedArticles). */
export const getArticleBySlug = cache(async (slug: string): Promise<ArticleData | null> => {
  const row = await prisma.article.findUnique({ where: { slug } });
  if (row?.published) return toData(row);
  if (row) return null; // exists but unpublished — hidden from the public site
  const any = await prisma.article.count({ where: { published: true } });
  if (any > 0) return null;
  return STARTER_ARTICLES.find((a) => a.slug === slug) ?? null;
});

function toData(row: {
  slug: string; title: string; keyword: string; excerpt: string; body: string;
  image: string | null; publishedAt: Date | null;
}): ArticleData {
  const { slug, title, keyword, excerpt, body, image, publishedAt } = row;
  return { slug, title, keyword, excerpt, body, image, publishedAt };
}
