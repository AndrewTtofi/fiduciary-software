import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { ArrowIc, BoldText, GoldHeading, KineticHeading, parseStatValue } from "@/components/marketing/mk";

const FEAT_ICONS = [
  <svg key="shield" className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>,
  <svg key="team" className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 19a4 4 0 0 0-8 0M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 19a3.5 3.5 0 0 0-4-3.4M19 11.5a2.5 2.5 0 1 0-2-4" /></svg>,
  <svg key="globe" className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9zM3.6 9h16.8M3.6 15h16.8M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" /></svg>,
  <svg key="chat" className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V6a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>,
];

export default async function LandingPage() {
  const [{ brandName }, { hero, about, why, servicesIntro, stats, insights }] = await Promise.all([
    getBranding(),
    getSiteContent(),
  ]);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero grid-bg">
        <div className="mk-container">
          <div>
            <span className="kicker">&mdash; {brandName}</span>
            <h1><KineticHeading text={hero.headline} /></h1>
            <p className="sub">{hero.lead}</p>
            <div className="ctas">
              <Link href="/contact" className="pill">{hero.primaryCta} {ArrowIc}</Link>
              <Link href="/services" className="pill ghost">{hero.secondaryCta}</Link>
            </div>
          </div>
          <div className="hero-calc">
            <TaxCalculator />
          </div>
        </div>
      </section>

      {/* ── Who we are ───────────────────────────────────────── */}
      <section className="ivory sec">
        <div className="mk-container split">
          <div className="photo-card reveal" style={{ backgroundImage: "url(/marketing/pc-about.jpg)" }} />
          <div className="reveal">
            <span className="kicker">{about.kicker}</span>
            <h2>{about.heading}</h2>
            <p className="body"><BoldText text={about.body1} /></p>
            <div className="stats">
              {stats.map((s, i) => {
                const { count, suffix, sup } = parseStatValue(s.v);
                return (
                  <div className="stat" key={i}>
                    <div className="num">
                      {count === null ? s.v : <><span data-count={count}>0</span>{suffix}{sup && <sup>{sup}</sup>}</>}
                    </div>
                    <div className="lbl">{s.l}</div>
                  </div>
                );
              })}
            </div>
            <Link href="/services" className="pill" style={{ marginTop: 38 }}>
              {about.cta} {ArrowIc}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why choose us ────────────────────────────────────── */}
      <section className="why sec">
        <div className="mk-container">
          <div className="head reveal">
            <div className="dot" />
            <span className="kicker">{why.kicker}</span>
            <h2><GoldHeading text={why.heading} /></h2>
          </div>
          <div className="feat-grid">
            {why.features.map((f, i) => (
              <div className="feat reveal" key={i}>
                <div className="fic">{FEAT_ICONS[i % FEAT_ICONS.length]}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section className="ivory sec" id="services">
        <div className="mk-container">
          <span className="kicker reveal">{servicesIntro.eyebrow}</span>
          <h2 className="reveal">{servicesIntro.heading}</h2>
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

      {/* ── CTA band ─────────────────────────────────────────── */}
      <CtaBand />

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
            {insights.posts.map((p, i) => (
              <Link key={i} href="/insights" className="post reveal">
                <div className="ph" style={{ backgroundImage: `url(${p.img})` }} />
                <div className="pb">
                  <div className="date">{p.tag}</div>
                  <h3>{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
