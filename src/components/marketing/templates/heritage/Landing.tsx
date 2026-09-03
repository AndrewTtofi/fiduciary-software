import Link from "next/link";
import type { LandingData } from "@/components/marketing/templates/types";
import { isToolEnabled } from "@/lib/services/tools-enabled";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { VHero } from "@/components/marketing/VHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { ToolsBlock } from "@/components/marketing/ToolsBlock";
import { Marquee } from "@/components/marketing/Marquee";
import { InsightCard } from "@/components/marketing/InsightCard";
import { ConsultBlock } from "@/components/marketing/ConsultBlock";
import { ArrowIc, GoldHeading } from "@/components/marketing/mk";

/** Heritage landing — the original serif navy/gold composition: hero with the
 *  compact calculator, tools block, dark how-it-works band, services ticker +
 *  grid, insights, "who takes your call" and the closing CTA band. */
export async function Landing({ data }: { data: LandingData }) {
  const { brandName, registration, content, articles, rates } = data;
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  const calcBreakdown = await isToolEnabled("effective-rate");

  return (
    <main>
      {/* ── Hero: copy left, compact calculator right, stats rail ── */}
      <VHero
        eyebrow={hero.eyebrow}
        headline={hero.display}
        sub={hero.lead}
        primaryCta={hero.primaryCta}
        stats={stats}
        registration={registration}
        whatsapp={contact.whatsapp}
        rates={rates}
        calcBreakdown={calcBreakdown}
      />

      {/* ── Tools block (space freed by deleting the duplicated hero) ── */}
      <ToolsBlock />

      {/* ── How it works (dark band) ── */}
      <HowItWorks heading={how.heading} sub={how.sub} steps={how.steps} button={cta.button} />

      {/* ── Services ticker (static, readable) ── */}
      <section className="sec-tight" style={{ paddingTop: 30, paddingBottom: 0 }}>
        <div className="mk-container">
          <Marquee items={SERVICES.map((s) => s.title)} />
        </div>
      </section>

      {/* ── What we do: static grid of eight ── */}
      <section className="sec" id="services" style={{ paddingTop: 56 }}>
        <div className="mk-container">
          <div className="sec-center" style={{ textAlign: "center", marginBottom: 40 }}>
            <h2>{servicesIntro.heading}</h2>
            <p className="lead" style={{ margin: "8px auto 0" }}>{servicesIntro.body}</p>
          </div>
          <ServicesGrid />
        </div>
      </section>

      {/* ── Insights ── */}
      {articles.length > 0 && (
        <section className="insights sec">
          <div className="mk-container">
            <div className="ins4-head">
              <div>
                <span className="kicker">{insights.kicker}</span>
                <h2><GoldHeading text={insights.heading} /></h2>
              </div>
              <div className="ins4-side">
                <p>{insights.body}</p>
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
      )}

      {/* ── Who takes your call ── */}
      <ConsultBlock consultation={consultation} contact={contact} brandName={brandName} />

      {/* ── Closing call to action ── */}
      <CtaBand />
    </main>
  );
}
