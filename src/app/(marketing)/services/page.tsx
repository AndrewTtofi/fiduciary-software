import { getSiteContent } from "@/lib/services/content";
import { ServiceIcons, SERVICES } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ServicesCarousel } from "@/components/marketing/ServicesCarousel";
import { Marquee } from "@/components/marketing/Marquee";

export const metadata = { title: "Our Services" };

export default async function ServicesMarketingPage() {
  const { servicesIntro } = await getSiteContent();
  return (
    <main>
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">{servicesIntro.eyebrow}</span>
          <h1>Everything Your Structure Needs, <span className="gold">Under One Roof</span></h1>
          <p className="sub">{servicesIntro.body}</p>
        </div>
      </section>
      <section className="sec-tight" style={{ paddingTop: 8, paddingBottom: 0 }}>
        <div className="mk-container">
          <Marquee items={SERVICES.map((s) => s.title)} />
        </div>
      </section>
      <section className="sec">
        <div className="mk-container">
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
      <CtaBand />
    </main>
  );
}
