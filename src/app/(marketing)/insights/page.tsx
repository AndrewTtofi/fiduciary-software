import Link from "next/link";
import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";

export const metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [{ insights }, articles] = await Promise.all([getSiteContent(), getPublishedArticles()]);
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">{insights.kicker}</span>
          <h1>Cyprus, <span className="gold">Explained Clearly</span></h1>
          <p className="sub">{insights.rhBody}</p>
        </div>
      </section>
      <section className="insights sec" style={{ paddingTop: 56 }}>
        <div className="mk-container">
          <div className="post-grid" style={{ marginTop: 0 }}>
            {articles.map((a) => (
              <Link key={a.slug} href={`/insights/${a.slug}`} className="post reveal">
                <div className="ph" style={a.image ? { backgroundImage: `url(${a.image})` } : undefined} />
                <div className="pb">
                  <div className="date">{a.keyword}</div>
                  <h3>{a.title}</h3>
                  <p style={{ fontSize: ".86rem", color: "var(--mk-grey)", marginTop: 8 }}>{a.excerpt}</p>
                  <div style={{ fontSize: ".82rem", color: "var(--mk-gold)", fontWeight: 600, marginTop: 8 }}>
                    Read the guide →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
