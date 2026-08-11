import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { CtaBand } from "@/components/marketing/CtaBand";
import { InsightCard } from "@/components/marketing/InsightCard";

export const metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [{ insights }, articles] = await Promise.all([getSiteContent(), getPublishedArticles()]);
  return (
    <main>
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">{insights.kicker}</span>
          <h1>Cyprus, <span className="gold">Explained Clearly</span></h1>
          <p className="sub">{insights.rhBody}</p>
        </div>
      </section>
      <section className="sec">
        <div className="mk-container">
          <div className="ins4-grid" style={{ marginTop: 0 }}>
            {articles.map((a, i) => (
              <InsightCard key={a.slug} article={a} index={i} />
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
