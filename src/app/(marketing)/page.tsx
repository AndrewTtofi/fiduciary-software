import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { ArrowIc, BoldText, CheckIc, GoldHeading, KineticHeading, parseStatValue, waLink } from "@/components/marketing/mk";

export default async function LandingPage() {
  const [{ brandName }, { hero, servicesIntro, stats, insights, contact, consultation }, articles] = await Promise.all([
    getBranding(),
    getSiteContent(),
    getPublishedArticles(),
  ]);

  return (
    <main>
      {/* ── Hero + tax calculator ────────────────────────────── */}
      <section className="hero grid-bg">
        <div className="mk-container">
          <div className="hero-copy">
            <span className="kicker">{hero.eyebrow}</span>
            <h1><KineticHeading text={hero.headline} /></h1>
            <p className="sub">{hero.lead}</p>
            <div className="trust-row">
              {stats.map((s, i) => (
                <div className="ti" key={i}>
                  <span className="dot" />
                  <b>{s.v}</b> {s.l.charAt(0).toLowerCase() + s.l.slice(1)}
                </div>
              ))}
            </div>
            <div className="ctas">
              <Link href="/contact" className="pill">{hero.primaryCta}</Link>
              <Link href="/services" className="pill ghost">{hero.secondaryCta}</Link>
            </div>
          </div>
          <div className="hero-calc">
            <TaxCalculator brandName={brandName} />
          </div>
        </div>
      </section>

      {/* ── Positioning strip ────────────────────────────────── */}
      <section className="strip">
        <div className="wrap-in">
          <h2><BoldText text={consultation.stripHeading} /></h2>
          <p>{consultation.stripBody}</p>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="sec-tight">
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

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="sec" id="services">
        <div className="mk-container">
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span className="kicker reveal">{servicesIntro.eyebrow}</span>
            <h2 className="reveal">{servicesIntro.heading}</h2>
            <p className="lead reveal" style={{ margin: "10px auto 0" }}>{servicesIntro.body}</p>
          </div>
          <div className="svc-grid">
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`} className="svc-card reveal">
                <div className="sic">{ServiceIcons[s.key]}</div>
                <h3>{s.title}</h3>
                <p>{s.blurb}</p>
                <span className="lm">Learn more {ArrowIc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insights ─────────────────────────────────────────── */}
      <section className="insights sec">
        <div className="mk-container">
          <div className="top">
            <div className="reveal">
              <span className="kicker">{insights.kicker}</span>
              <h2><GoldHeading text={insights.heading} /></h2>
            </div>
            <div className="rh reveal">
              <h3>{insights.rhHeading}</h3>
              <p>{insights.rhBody}</p>
            </div>
          </div>
          <div className="post-grid">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.slug} href={`/insights/${a.slug}`} className="post reveal">
                <div className="ph" style={a.image ? { backgroundImage: `url(${a.image})` } : undefined} />
                <div className="pb">
                  <div className="date">{a.keyword}</div>
                  <h3>{a.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who takes your call ──────────────────────────────── */}
      <section className="wtc sec" id="consultation">
        <div className="mk-container wtc-grid">
          <div className="wtc-photo reveal" style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}>
            {!consultation.photoUrl && <div className="ph-note">[ {consultation.photoNote} ]</div>}
            <div className="name">
              <b>{consultation.personName}</b>
              <span>{consultation.personTitle}, {brandName}</span>
            </div>
          </div>
          <div className="reveal">
            <span className="kicker">{consultation.kicker}</span>
            <h2><GoldHeading text={consultation.heading} /></h2>
            <p className="body">{consultation.body}</p>
            <ul className="pts">
              {consultation.points.map((p, i) => (
                <li key={i}>{CheckIc}{p}</li>
              ))}
            </ul>
            <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
              {contact.whatsapp && (
                <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener" className="pill ghost">
                  Message on WhatsApp
                </a>
              )}
            </div>
            <p style={{ fontSize: ".82rem", color: "var(--mk-grey)", marginTop: 16 }}>
              {consultation.underForm}
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA band ───────────────────────────────────── */}
      <CtaBand />
    </main>
  );
}
