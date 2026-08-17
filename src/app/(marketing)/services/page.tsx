import { getSiteContent } from "@/lib/services/content";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { Marquee } from "@/components/marketing/Marquee";

export const metadata = {
  title: "Our Services",
  description: "Company formation, tax residency and Non-Dom, IP Box, immigration and work permits, citizenship, international companies and licensing, Amazon seller setup, and accounting and VAT in Cyprus.",
};

export default async function ServicesMarketingPage() {
  const { servicesIntro } = await getSiteContent();
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <h1>What we do <span className="gold">in Cyprus and beyond</span></h1>
          <p className="sub">{servicesIntro.body}</p>
        </div>
      </section>
      <section className="sec-tight" style={{ paddingTop: 22, paddingBottom: 0 }}>
        <div className="mk-container">
          <Marquee items={SERVICES.map((s) => s.title)} />
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 44 }}>
        <div className="mk-container">
          <ServicesGrid />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
