import Link from "next/link";
import { getSiteContent } from "@/lib/services/content";
import { ServiceIcons, SERVICES } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ArrowIc } from "@/components/marketing/mk";

export const metadata = { title: "Our Services" };

export default async function ServicesMarketingPage() {
  const { servicesIntro } = await getSiteContent();
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; {servicesIntro.eyebrow}</span>
          <h1>Everything Your Structure Needs, <span className="gold">Under One Roof</span></h1>
          <p className="sub">{servicesIntro.body}</p>
        </div>
      </section>
      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <div className="svc-grid" style={{ marginTop: 0 }}>
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`} className="svc-card reveal">
                <div className="sic">{ServiceIcons[s.key]}</div>
                <h3>{s.title}</h3>
                <p>{s.longBlurb}</p>
                <span className="lm">Learn more {ArrowIc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
