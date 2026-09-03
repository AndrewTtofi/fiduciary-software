import Link from "next/link";
import type { LandingData } from "@/components/marketing/templates/types";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { getFeaturedTools, isToolEnabled } from "@/lib/services/tools-enabled";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { GoldHeading, BoldText, WhatsAppButton, ArrowIc, formatDate } from "@/components/marketing/mk";

/** Meridian landing — modern product-led composition: centred hero with stat
 *  chips, the calculator presented as a full-width "product" panel, a bento
 *  services grid, a connected 3-step process, tool chips, insight rows and a
 *  gradient CTA panel. Same content model as every other template. */
export async function Landing({ data }: { data: LandingData }) {
  const { brandName, registration, content, articles, rates } = data;
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  const featuredTools = await getFeaturedTools();
  const calcBreakdown = await isToolEnabled("effective-rate");
  const consultParas = consultation.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <main>
      {/* ── Centred hero with stat chips ── */}
      <section className="md-hero">
        <div className="md-wrap">
          <span className="md-chip">
            <span className="md-chip-dot" aria-hidden />
            {hero.eyebrow}
          </span>
          <h1><GoldHeading text={hero.display} /></h1>
          <p className="md-lead">{hero.lead}</p>
          <div className="md-hero-btns">
            <Link href="/book" className="pill">{hero.primaryCta}</Link>
            <WhatsAppButton number={contact.whatsapp} />
          </div>
          <div className="md-stats">
            {stats.map((s, i) => (
              <div className="md-stat" key={i}>
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
          {registration && <div className="md-reg">{registration}</div>}
        </div>
      </section>

      {/* ── Calculator as a product panel ── */}
      <section className="md-panel-sec">
        <div className="md-wrap">
          <div className="md-panel">
            <div className="md-panel-copy">
              <span className="md-overline">Run your own numbers</span>
              <h2>See the tax picture before you talk to anyone</h2>
              <p>Salary, dividends, corporate profit — the calculator uses the current rates, and every figure is explained on the tool pages.</p>
              <Link href="/tools" className="md-more">All free tools {ArrowIc}</Link>
            </div>
            <div className="md-panel-calc">
              <TaxCalculator rates={rates} compact breakdown={calcBreakdown} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Services bento ── */}
      <section className="md-sec" id="services">
        <div className="md-wrap">
          <div className="md-sec-head">
            <span className="md-overline">{servicesIntro.heading}</span>
            <h2>{servicesIntro.body}</h2>
          </div>
          <div className="md-bento">
            {SERVICES.map((s, i) => (
              <Link key={s.key} href={`/services/${s.key}`} className={`md-cell${i < 2 ? " md-cell-wide" : ""}`}>
                <span className="md-cell-ic">{ServiceIcons[s.key]}</span>
                <h3>{s.title}</h3>
                <p>{s.blurb}</p>
                <span className="md-cell-go">Learn more {ArrowIc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process: three connected steps ── */}
      <section className="md-sec md-how" id="how-it-works">
        <div className="md-wrap">
          <div className="md-sec-head">
            <span className="md-overline">{how.heading}</span>
            <h2>{how.sub}</h2>
          </div>
          <div className="md-steps">
            {how.steps.map((s, i) => (
              <div className="md-step" key={i}>
                <span className="md-step-n">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="md-how-cta">
            <Link href="/book" className="pill">{cta.button}</Link>
          </div>
        </div>
      </section>

      {/* ── Tool chips (only the tools this deployment offers) ── */}
      {featuredTools.length > 0 && (
        <section className="md-sec md-tools-sec">
          <div className="md-wrap">
            <div className="md-tools-row">
              <span className="md-overline">Free tools</span>
              {featuredTools.map((t) => (
                <Link key={t.key} href={`/tools/${t.slug}`} className="md-tool-chip">{t.name}</Link>
              ))}
              <Link href="/tools" className="md-more">All tools {ArrowIc}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Insights as rows ── */}
      {articles.length > 0 && (
        <section className="md-sec">
          <div className="md-wrap">
            <div className="md-sec-head md-sec-head-row">
              <div>
                <span className="md-overline">{insights.kicker}</span>
                <h2><GoldHeading text={insights.heading} /></h2>
              </div>
              <Link href="/insights" className="md-more">{insights.body} {ArrowIc}</Link>
            </div>
            <div className="md-ins">
              {articles.slice(0, 3).map((a) => (
                <Link key={a.slug} href={`/insights/${a.slug}`} className="md-ins-row">
                  <span className="md-ins-cat">{a.category}</span>
                  <span className="md-ins-main">
                    <h3>{a.title}</h3>
                    <p>{a.excerpt}</p>
                  </span>
                  <span className="md-ins-date">
                    {a.publishedAt ? formatDate(a.publishedAt) : ""}
                    {ArrowIc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Who takes your call ── */}
      <section className="md-sec" id="consultation">
        <div className="md-wrap">
          <div className="md-consult">
            <div
              className="md-consult-photo"
              style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}
            >
              {!consultation.photoUrl && <span>[ {consultation.photoNote} ]</span>}
              {consultation.personName && (
                <div className="md-consult-name">
                  <b>{consultation.personName}</b>
                  <span>{[consultation.personTitle, brandName].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
            <div className="md-consult-copy">
              <span className="md-overline">Who takes your call</span>
              <h2>{consultation.heading}</h2>
              {consultParas.map((p, i) => (
                <p key={i}><BoldText text={p} /></p>
              ))}
              <ul>
                {consultation.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gradient CTA panel ── */}
      <section className="md-sec">
        <div className="md-wrap">
          <div className="md-cta">
            <h2><GoldHeading text={cta.heading} /></h2>
            <p>{cta.body}</p>
            <div className="md-cta-btns">
              <Link href="/book" className="pill">{cta.button}</Link>
              <WhatsAppButton number={contact.whatsapp} className="pill ghost md-cta-ghost" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
