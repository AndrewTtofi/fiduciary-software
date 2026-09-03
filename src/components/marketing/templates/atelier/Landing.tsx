import Link from "next/link";
import type { LandingData } from "@/components/marketing/templates/types";
import { isToolEnabled } from "@/lib/services/tools-enabled";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { GoldHeading, BoldText, WhatsAppButton, ArrowIc, formatDate } from "@/components/marketing/mk";

/** Atelier landing — understated editorial composition, like a private
 *  practice's printed brochure: a huge typographic hero over rule-separated
 *  stats, services as a numbered index (no cards, no icons), a vertical
 *  process, the calculator as a narrow practical aside, a featured insight,
 *  and a centred consultation column. Same content model as every template. */
export async function Landing({ data }: { data: LandingData }) {
  const calcBreakdown = await isToolEnabled("effective-rate");
  const { brandName, registration, content, articles, rates } = data;
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  const consultParas = consultation.body.split(/\n\s*\n/).filter(Boolean);
  const [featured, ...restArticles] = articles;

  return (
    <main>
      {/* ── Typographic hero ── */}
      <section className="at-hero">
        <div className="at-wrap">
          <span className="at-eyebrow">{hero.eyebrow}</span>
          <h1><GoldHeading text={hero.display} /></h1>
          <p className="at-lead">{hero.lead}</p>
          <div className="at-hero-btns">
            <Link href="/book" className="pill">{hero.primaryCta}</Link>
            <WhatsAppButton number={contact.whatsapp} />
          </div>
          <hr className="at-rule" />
          {registration && <div className="at-reg">{registration}</div>}
          <div className="at-stats">
            {stats.map((s, i) => (
              <div className="at-stat" key={i}>
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services as a numbered index ── */}
      <section className="at-sec" id="services">
        <div className="at-wrap">
          <span className="at-label">{servicesIntro.heading}</span>
          <p className="at-intro">{servicesIntro.body}</p>
          <div className="at-index">
            {SERVICES.map((s, i) => (
              <Link key={s.key} href={`/services/${s.key}`} className="at-row">
                <span className="at-row-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.blurb}</p>
                <span className="at-row-go">{ArrowIc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works: vertical composition ── */}
      <section className="at-sec" id="how-it-works">
        <div className="at-wrap">
          <span className="at-label">{how.heading}</span>
          <p className="at-intro">{how.sub}</p>
          <div className="at-steps">
            {how.steps.map((s, i) => (
              <div className="at-step" key={i}>
                <span className="at-step-n">{i + 1}</span>
                <div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="at-center-cta">
            <Link href="/book" className="pill">{cta.button}</Link>
          </div>
        </div>
      </section>

      {/* ── The calculator, as a practical aside ── */}
      <section className="at-sec at-aside">
        <div className="at-wrap">
          <span className="at-label">A practical aside</span>
          <p className="at-intro">The numbers, before the conversation.</p>
          <div className="at-aside-box">
            <TaxCalculator rates={rates} compact breakdown={calcBreakdown} />
          </div>
          <Link href="/tools" className="at-textlink">All tools {ArrowIc}</Link>
        </div>
      </section>

      {/* ── Insights: one feature, then a compact list ── */}
      {articles.length > 0 && (
        <section className="at-sec">
          <div className="at-wrap">
            <span className="at-label">{insights.kicker}</span>
            <p className="at-intro"><GoldHeading text={insights.heading} /></p>
            <Link href={`/insights/${featured.slug}`} className="at-feature">
              <span className="at-feature-cat">{featured.category}</span>
              <h3>{featured.title}</h3>
              <p>{featured.excerpt}</p>
              <span className="at-feature-date">{featured.publishedAt ? formatDate(featured.publishedAt) : ""}</span>
            </Link>
            {restArticles.length > 0 && (
              <div className="at-ins-list">
                {restArticles.slice(0, 3).map((a) => (
                  <Link key={a.slug} href={`/insights/${a.slug}`} className="at-ins-row">
                    <span className="at-ins-cat">{a.category}</span>
                    <h4>{a.title}</h4>
                    <span className="at-ins-date">{a.publishedAt ? formatDate(a.publishedAt) : ""}</span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/insights" className="at-textlink">{insights.body} {ArrowIc}</Link>
          </div>
        </section>
      )}

      {/* ── Who takes your call: centred column ── */}
      <section className="at-sec" id="consultation">
        <div className="at-wrap at-consult">
          <span className="at-label">Who takes your call</span>
          <div
            className="at-portrait"
            style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}
          >
            {!consultation.photoUrl && <span>[ {consultation.photoNote} ]</span>}
          </div>
          {consultation.personName && (
            <div className="at-portrait-caption">
              <b>{consultation.personName}</b>
              <span>{[consultation.personTitle, brandName].filter(Boolean).join(", ")}</span>
            </div>
          )}
          <h2>{consultation.heading}</h2>
          {consultParas.map((p, i) => (
            <p className="at-consult-p" key={i}><BoldText text={p} /></p>
          ))}
          <ul className="at-points">
            {consultation.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
          <div className="at-center-cta">
            <Link href="/book" className="pill">{cta.button}</Link>
          </div>
        </div>
      </section>

      {/* ── Closing invitation ── */}
      <section className="at-close">
        <div className="at-wrap">
          <h2><GoldHeading text={cta.heading} /></h2>
          <p>{cta.body}</p>
          <div className="at-close-btns">
            <Link href="/book" className="pill">{cta.button}</Link>
            <WhatsAppButton number={contact.whatsapp} />
          </div>
        </div>
      </section>
    </main>
  );
}
