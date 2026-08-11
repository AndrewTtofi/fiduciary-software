import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { VHero } from "@/components/marketing/VHero";
import { ServicesCarousel } from "@/components/marketing/ServicesCarousel";
import { Marquee } from "@/components/marketing/Marquee";
import { InsightCard } from "@/components/marketing/InsightCard";
import { ConsultBlock } from "@/components/marketing/ConsultBlock";
import { ArrowIc, BoldText, GoldHeading, parseStatValue } from "@/components/marketing/mk";

/* Marquee keywords: the service lines plus the evergreen topics they cover. */
const MARQUEE_TOPICS = [
  "Company formation",
  "Tax residency",
  "Non-Dom status",
  "Accounting and VAT",
  "Licensing",
  "Banking and EMI",
  "Immigration permits",
  "Permanent residency",
  "60-day rule",
  "IP Box",
  "VAT and VIES",
];

export default async function LandingPage() {
  const [{ brandName }, { hero, servicesIntro, stats, insights, contact, consultation }, articles] = await Promise.all([
    getBranding(),
    getSiteContent(),
    getPublishedArticles(),
  ]);

  return (
    <main>
      {/* ── Full-height hero (per-character reveal) ──────────── */}
      <VHero
        eyebrow={hero.eyebrow}
        headline={hero.display}
        sub={hero.lead}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
        stats={stats}
        tagWords={["Formation", "Tax", "Relocation"]}
      />

      {/* ── Headline + tax calculator ────────────────────────── */}
      <section className="hero grid-bg">
        <div className="mk-container hero-g">
          <div>
            <span className="kicker">{hero.eyebrow}</span>
            <h1 style={{ fontSize: "clamp(2rem,4.4vw,3.2rem)" }}><GoldHeading text={hero.headline} /></h1>
            <p className="lead" style={{ marginTop: 18 }}>{hero.lead}</p>
            <div className="trust-row" style={{ opacity: 1, animation: "none" }}>
              {stats.map((s, i) => (
                <div className="ti" key={i}>
                  <span className="dot" />
                  <b>{s.v}</b> {s.l.charAt(0).toLowerCase() + s.l.slice(1)}
                </div>
              ))}
            </div>
            <div className="ctas" style={{ opacity: 1, animation: "none" }}>
              <Link href="/contact" className="pill">{hero.primaryCta}</Link>
              <Link href="/services" className="pill ghost">{hero.secondaryCta}</Link>
            </div>
          </div>
          <div>
            <TaxCalculator brandName={brandName} />
          </div>
        </div>
      </section>

      {/* ── Positioning strip (with self-drawing emblem) ─────── */}
      <section className="strip">
        <svg className="knot-draw" id="knotDraw" viewBox="0 0 240 240" aria-hidden />
        <div className="wrap-in">
          <h2><BoldText text={consultation.stripHeading} /></h2>
          <p>{consultation.stripBody}</p>
        </div>
      </section>

      {/* ── Keyword marquee ──────────────────────────────────── */}
      <section className="sec-tight" style={{ paddingTop: 34, paddingBottom: 0 }}>
        <div className="mk-container">
          <Marquee items={MARQUEE_TOPICS} />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="sec-tight" style={{ paddingTop: 26 }}>
        <div className="mk-container">
          <div className="stats">
            {stats.map((s, i) => {
              const { count, suffix, sup } = parseStatValue(s.v);
              return (
                <div className="stat reveal" key={i}>
                  <div className="num">
                    {count === null ? s.v : <><span data-count={count}>0</span>{suffix}{sup && <sup>{sup}</sup>}</>}
                  </div>
                  <div className="lbl">{s.l}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services (3D carousel) ───────────────────────────── */}
      <section className="sec" id="services">
        <div className="mk-container">
          <div className="sec-center" style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="kicker">{servicesIntro.eyebrow}</span>
            <h2>{servicesIntro.heading}</h2>
            <p className="lead" style={{ margin: "8px auto 0" }}>{servicesIntro.body}</p>
          </div>
          <ServicesCarousel
            services={SERVICES.map((s) => ({
              key: s.key,
              title: s.title,
              blurb: s.longBlurb,
              icon: ServiceIcons[s.key],
            }))}
          />
        </div>
      </section>

      {/* ── Insights ─────────────────────────────────────────── */}
      <section className="insights sec">
        <div className="mk-container">
          <div className="ins4-head">
            <div>
              <span className="kicker">{insights.kicker}</span>
              <h2><GoldHeading text={insights.heading} /></h2>
            </div>
            <div className="ins4-side">
              <p>{insights.rhBody}</p>
              <Link href="/insights" className="ins4-all">
                Browse all insights {ArrowIc}
              </Link>
            </div>
          </div>
          <div className="ins4-grid">
            {articles.slice(0, 3).map((a, i) => (
              <InsightCard key={a.slug} article={a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Who takes your call ──────────────────────────────── */}
      <ConsultBlock consultation={consultation} contact={contact} brandName={brandName} />

      {/* ── Final CTA ────────────────────────────────────────── */}
      <CtaBand />
    </main>
  );
}
