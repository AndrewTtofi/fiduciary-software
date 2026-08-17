import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { CtaBand } from "@/components/marketing/CtaBand";
import { GoldHeading } from "@/components/marketing/mk";
import { InsightsBrowser } from "./InsightsBrowser";

export const metadata = {
  title: "Insights",
  description: "Practical guides on tax, residency, immigration and company structure in Cyprus.",
};
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [{ insights }, articles] = await Promise.all([getSiteContent(), getPublishedArticles()]);
  const items = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    image: a.image,
    author: a.author,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
  }));
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">{insights.kicker}</span>
          <h1><GoldHeading text={insights.heading} /></h1>
          <p className="sub">{insights.body}</p>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 48 }}>
        <div className="mk-container">
          {items.length === 0 ? (
            <div style={{ maxWidth: 620 }}>
              <h2>Guides are being prepared</h2>
              <p className="lead" style={{ marginTop: 12 }}>
                The first guides on immigration, permits, citizenship and Cyprus tax in 2026 are being
                written now and will appear here as each one is ready.
              </p>
            </div>
          ) : (
            <InsightsBrowser articles={items} />
          )}
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
