import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, SERVICES } from "@/components/marketing/ServiceIcons";
import { getPublishedArticles, articlesForService } from "@/lib/services/articles";
import { getSiteContent } from "@/lib/services/content";
import { CtaBand } from "@/components/marketing/CtaBand";
import { InsightCard } from "@/components/marketing/InsightCard";
import { CheckIc, WhatsAppButton } from "@/components/marketing/mk";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ key: s.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const svc = getService((await params).key);
  return svc ? { title: svc.title, description: svc.sub } : { title: "Service" };
}

/** Service detail page — the template the review kept: SERVICE eyebrow,
 *  title, subtitle, "What is included", "How it works", CTA, closing band.
 *  Plus the plain-spoken note some pages must carry, and links to the most
 *  relevant Insights articles once any are published. */
export default async function ServiceDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const svc = getService((await params).key);
  if (!svc) notFound();
  const [articles, { contact }] = await Promise.all([getPublishedArticles(), getSiteContent()]);
  const related = articlesForService(articles, svc.key, svc.articleCategories);
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">Service</span>
          <h1>{svc.title}</h1>
          <p className="sub">{svc.sub}</p>
        </div>
      </section>
      <section className="ivory sec">
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <h2>What is included</h2>
          <div className="sd-list" style={{ marginBottom: 34 }}>
            {svc.included.map((item, i) => (
              <div className="sd-item" key={i}>{CheckIc}{item}</div>
            ))}
          </div>
          <h2>How it works</h2>
          <div className="cards3" style={{ marginTop: 18 }}>
            {svc.steps.map((st, i) => (
              <div className="how-card" key={i}>
                <div className="n">0{i + 1}</div>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </div>
            ))}
          </div>
          {svc.note && <p className="sd-note">{svc.note}</p>}
          <div className="final-btns" style={{ justifyContent: "center", marginTop: 38 }}>
            <Link href="/book" className="pill">Book Your Free 30-Minute Consultation</Link>
            <WhatsAppButton number={contact.whatsapp} />
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="sec" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="mk-container">
            <span className="kicker">Read more</span>
            <h2 style={{ marginBottom: 6 }}>Guides on {svc.band}</h2>
            <div className="ins4-grid" style={{ marginTop: 26 }}>
              {related.map((a, i) => (
                <InsightCard key={a.slug} article={a} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand heading={`Discuss *${svc.band}* with us`} />
    </main>
  );
}
