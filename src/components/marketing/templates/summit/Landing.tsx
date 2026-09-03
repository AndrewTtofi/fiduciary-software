import Link from "next/link";
import type { LandingData } from "@/components/marketing/templates/types";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { getFeaturedTools, isToolEnabled } from "@/lib/services/tools-enabled";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { GoldHeading, BoldText, WhatsAppButton, ArrowIc, formatDate, telLink, waLink } from "@/components/marketing/mk";

/** Summit landing — bold, conversion-first, dark-forward composition: a
 *  full-bleed dark hero with the calculator riding shotgun and oversized
 *  stats, numbered service tiles, a dark three-card process band, an accent
 *  tools strip, top-bar insight cards, a framed consultation photo and a
 *  full-width closing CTA band. Same content model as every other template. */
export async function Landing({ data }: { data: LandingData }) {
  const { brandName, registration, content, articles, rates } = data;
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  const featuredTools = await getFeaturedTools();
  const calcBreakdown = await isToolEnabled("effective-rate");
  const consultParas = consultation.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <main>
      {/* ── Dark hero: copy left, calculator right, big stats below ── */}
      <section className="sm-hero">
        <div className="sm-wrap">
          <div className="sm-hero-grid">
            <div className="sm-hero-copy">
              <span className="sm-eyebrow">{hero.eyebrow}</span>
              <h1><GoldHeading text={hero.display} /></h1>
              <p className="sm-lead">{hero.lead}</p>
              <div className="sm-hero-btns">
                <Link href="/book" className="pill sm-btn-xl">{hero.primaryCta}</Link>
                <WhatsAppButton number={contact.whatsapp} className="pill ghost sm-ghost-w" />
              </div>
            </div>
            <div className="sm-hero-calc">
              <TaxCalculator rates={rates} compact breakdown={calcBreakdown} />
            </div>
          </div>
          <div className="sm-stats">
            {stats.map((s, i) => (
              <div className="sm-stat" key={i}>
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
          {registration && <div className="sm-reg">{registration}</div>}
        </div>
      </section>

      {/* ── Numbered service tiles ── */}
      <section className="sm-sec" id="services">
        <div className="sm-wrap">
          <div className="sm-sec-head">
            <h2>{servicesIntro.heading}</h2>
            <p>{servicesIntro.body}</p>
          </div>
          <div className="sm-grid">
            {SERVICES.map((s, i) => (
              <Link key={s.key} href={`/services/${s.key}`} className="sm-tile">
                <span className="sm-tile-top">
                  <span className="sm-tile-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="sm-tile-ic">{ServiceIcons[s.key]}</span>
                </span>
                <h3>{s.title}</h3>
                <p>{s.blurb}</p>
                <span className="sm-tile-go">Learn more {ArrowIc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process: dark band, three large cards ── */}
      <section className="sm-how" id="how-it-works">
        <div className="sm-wrap">
          <div className="sm-sec-head">
            <h2>{how.heading}</h2>
            <p>{how.sub}</p>
          </div>
          <div className="sm-steps">
            {how.steps.map((s, i) => (
              <div className="sm-step" key={i}>
                <span className="sm-step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="sm-how-cta">
            <Link href="/book" className="pill sm-btn-xl">{cta.button}</Link>
          </div>
        </div>
      </section>

      {/* ── Accent tools strip (only the tools this deployment offers) ── */}
      {featuredTools.length > 0 && (
        <section className="sm-tools">
          <div className="sm-wrap sm-tools-row">
            <span className="sm-tools-label">Free tools</span>
            {featuredTools.map((t) => (
              <Link key={t.key} href={`/tools/${t.slug}`} className="sm-tool-link">{t.name}</Link>
            ))}
            <Link href="/tools" className="sm-tools-all">All tools {ArrowIc}</Link>
          </div>
        </section>
      )}

      {/* ── Insight cards with accent top bar ── */}
      {articles.length > 0 && (
        <section className="sm-sec">
          <div className="sm-wrap">
            <div className="sm-ins-head">
              <div>
                <span className="sm-kicker">{insights.kicker}</span>
                <h2><GoldHeading text={insights.heading} /></h2>
              </div>
              <Link href="/insights" className="sm-more">Browse all {ArrowIc}</Link>
            </div>
            <div className="sm-ins-grid">
              {articles.slice(0, 3).map((a) => (
                <Link key={a.slug} href={`/insights/${a.slug}`} className="sm-ins-card">
                  <span className="sm-ins-cat">{a.category}</span>
                  <h3>{a.title}</h3>
                  <p>{a.excerpt}</p>
                  <span className="sm-ins-date">{a.publishedAt ? formatDate(a.publishedAt) : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Who takes your call ── */}
      <section className="sm-sec" id="consultation">
        <div className="sm-wrap">
          <div className="sm-consult">
            <div
              className="sm-consult-photo"
              style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}
            >
              {!consultation.photoUrl && <span>[ {consultation.photoNote} ]</span>}
              {consultation.personName && (
                <div className="sm-consult-name">
                  <b>{consultation.personName}</b>
                  <span>{[consultation.personTitle, brandName].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
            <div className="sm-consult-copy">
              <span className="sm-kicker">Who takes your call</span>
              <h2>{consultation.heading}</h2>
              {consultParas.map((p, i) => (
                <p key={i}><BoldText text={p} /></p>
              ))}
              <ul>
                {consultation.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <div className="sm-consult-btns">
                <Link href="/book" className="pill">{cta.button}</Link>
                <WhatsAppButton number={contact.whatsapp} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Full-width closing CTA band ── */}
      <section className="sm-cta">
        <div className="sm-wrap">
          <h2><GoldHeading text={cta.heading} /></h2>
          <p>{cta.body}</p>
          <div className="sm-cta-btns">
            <Link href="/book" className="pill sm-btn-xl">{cta.button}</Link>
            <WhatsAppButton number={contact.whatsapp} className="pill ghost sm-ghost-w" />
          </div>
          {(contact.phone || contact.whatsapp) && (
            <div className="sm-cta-nums">
              {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
              {contact.whatsapp && <a href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
