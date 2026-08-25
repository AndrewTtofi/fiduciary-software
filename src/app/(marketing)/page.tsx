import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getServerBranding } from "@/lib/services/branding-server";
import { getSiteContent } from "@/lib/services/content";
import { getPublishedArticles } from "@/lib/services/articles";
import { getToolSettings } from "@/lib/services/tool-settings";
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

export default async function LandingPage() {
  const [{ brandName }, { legalName, jurisdiction }, content, articles, rates] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
    getPublishedArticles(),
    getToolSettings(),
  ]);
  const { hero, servicesIntro, how, stats, insights, contact, consultation, cta } = content;
  // "Legal Name · HE 123456 · Nicosia, Cyprus" — small and discreet under the
  // stats, so the hero shows the firm is a registered company.
  const city =
    contact.address
      .split(",")
      .slice(-2)
      .map((s) => s.trim().replace(/^\d+\s+/, "")) // "1060 Nicosia" → "Nicosia"
      .filter(Boolean)
      .join(", ") || jurisdiction;
  const registration = [legalName, contact.regNo, city].filter(Boolean).join(" · ");

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
        rates={{ corporateTax: rates.corporateTax, gesyRate: rates.gesy.passive, gesyCap: rates.gesy.cap }}
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
