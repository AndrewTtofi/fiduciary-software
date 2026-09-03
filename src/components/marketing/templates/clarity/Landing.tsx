import Link from "next/link";
import type { LandingData } from "@/components/marketing/templates/types";
import { isToolEnabled } from "@/lib/services/tools-enabled";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { TaxCalculator } from "@/components/marketing/TaxCalculator";
import { GoldHeading, BoldText, WhatsAppButton, formatDate, telLink } from "@/components/marketing/mk";

/** Clarity landing — radical minimalism: near-black Inter on white, hairline
 *  rules and whitespace doing all the work. Services as a definition list,
 *  the process as a numbered single column, insights as datelines. No cards,
 *  no icons, no gradients. Same content model as every other template. */
export async function Landing({ data }: { data: LandingData }) {
  const calcBreakdown = await isToolEnabled("effective-rate");
  const { brandName, registration, content, articles, rates } = data;
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  const consultParas = consultation.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <main>
      {/* ── Hero: left-aligned, whitespace-heavy ── */}
      <section className="cl-hero">
        <div className="cl-wrap">
          <span className="cl-label">{hero.eyebrow}</span>
          <h1><GoldHeading text={hero.display} /></h1>
          <p className="cl-lead">{hero.lead}</p>
          <div className="cl-hero-btns">
            <Link href="/book" className="cl-btn">{hero.primaryCta}</Link>
            <WhatsAppButton number={contact.whatsapp} className="cl-textlink" />
          </div>
          <div className="cl-hero-rule" aria-hidden />
          <div className="cl-stats">
            {stats.map((s, i) => (
              <div className="cl-stat" key={i}>
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>
          {registration && <div className="cl-reg">{registration}</div>}
        </div>
      </section>

      {/* ── Services as a definition list ── */}
      <section className="cl-sec" id="services">
        <div className="cl-wrap">
          <span className="cl-label">{servicesIntro.heading}</span>
          <p className="cl-svc-intro">{servicesIntro.body}</p>
          <div className="cl-svcs">
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`} className="cl-svc">
                <h3>{s.title}</h3>
                <p>{s.blurb}</p>
                <span className="cl-svc-go" aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works: narrow numbered column ── */}
      <section className="cl-sec" id="how-it-works">
        <div className="cl-wrap">
          <div className="cl-how">
            <h2>{how.heading}</h2>
            <p className="cl-how-sub">{how.sub}</p>
            <div className="cl-steps">
              {how.steps.map((s, i) => (
                <div className="cl-step" key={i}>
                  <h3><span className="cl-step-n">{String(i + 1).padStart(2, "0")} — </span>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
            <Link href="/book" className="cl-btn">{cta.button}</Link>
          </div>
        </div>
      </section>

      {/* ── Calculator, quietly ── */}
      <section className="cl-sec">
        <div className="cl-wrap">
          <span className="cl-label">Estimate</span>
          <p className="cl-calc-note">Run the numbers on the current rates before you speak to anyone.</p>
          <div className="cl-calc-box">
            <TaxCalculator rates={rates} compact breakdown={calcBreakdown} />
          </div>
          <Link href="/tools" className="cl-textlink">All tools →</Link>
        </div>
      </section>

      {/* ── Insights as datelines ── */}
      {articles.length > 0 && (
        <section className="cl-sec">
          <div className="cl-wrap">
            <div className="cl-ins-head">
              <div>
                <span className="cl-label">{insights.kicker}</span>
                <h2><GoldHeading text={insights.heading} /></h2>
              </div>
              <Link href="/insights" className="cl-textlink">All insights →</Link>
            </div>
            <div className="cl-ins">
              {articles.slice(0, 4).map((a) => (
                <Link key={a.slug} href={`/insights/${a.slug}`} className="cl-ins-row">
                  <span className="cl-ins-date">{a.publishedAt ? formatDate(a.publishedAt) : ""}</span>
                  <h3>{a.title}</h3>
                  <span className="cl-ins-cat">{a.category}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Who takes your call ── */}
      <section className="cl-sec" id="consultation">
        <div className="cl-wrap">
          <div className="cl-consult">
            <div className="cl-consult-side">
              <div
                className="cl-consult-photo"
                style={consultation.photoUrl ? { backgroundImage: `url(${consultation.photoUrl})` } : undefined}
              >
                {!consultation.photoUrl && <span>[ {consultation.photoNote} ]</span>}
              </div>
              {consultation.personName && (
                <p className="cl-consult-name">
                  {consultation.personName}
                  <br />
                  {[consultation.personTitle, brandName].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="cl-consult-copy">
              <h2>{consultation.heading}</h2>
              {consultParas.map((p, i) => (
                <p key={i}><BoldText text={p} /></p>
              ))}
              <ul className="cl-points">
                {consultation.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <div className="cl-consult-actions">
                <Link href="/book" className="cl-btn">{hero.primaryCta}</Link>
                {contact.phone && <a href={telLink(contact.phone)} className="cl-textlink">{contact.phone}</a>}
                {contact.email && <a href={`mailto:${contact.email}`} className="cl-textlink">{contact.email}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="cl-cta">
        <div className="cl-wrap">
          <h2><GoldHeading text={cta.heading} /></h2>
          <p>{cta.body}</p>
          <Link href="/book" className="cl-btn">{cta.button}</Link>
        </div>
      </section>
    </main>
  );
}
