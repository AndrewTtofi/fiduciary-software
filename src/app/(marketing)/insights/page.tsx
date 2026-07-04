import { getSiteContent } from "@/lib/services/content";

export const metadata = { title: "Insights" };

export default async function InsightsPage() {
  const { insights } = await getSiteContent();
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; Insights</span>
          <h1>Expert <span className="gold">Insights</span></h1>
          <p className="sub">{insights.rhBody}</p>
        </div>
      </section>
      <section className="insights sec-tight sec" style={{ paddingTop: 70 }}>
        <div className="mk-container">
          <div className="post-grid" style={{ marginTop: 0 }}>
            {insights.posts.map((p, i) => (
              <div key={i} className="post reveal">
                <div className="ph" style={{ backgroundImage: `url(${p.img})` }} />
                <div className="pb">
                  <div className="date">{p.tag}</div>
                  <h3>{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
