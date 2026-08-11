import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ArrowIc, BoldText } from "@/components/marketing/mk";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const [{ brandName }, { about, why }] = await Promise.all([getBranding(), getSiteContent()]);
  return (
    <main>
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">About</span>
          <h1>A Firm Built By People <span className="gold">Who Do the Work</span></h1>
          <p className="sub">
            {brandName} is a corporate services firm serving international entrepreneurs
            with transparent, compliant structures.
          </p>
        </div>
      </section>
      <section className="ivory sec">
        <div className="mk-container" style={{ maxWidth: 800 }}>
          <p className="lead"><BoldText text={about.body1} /></p>
          <p className="body"><BoldText text={about.body2} /></p>
          <h2 style={{ marginTop: 40 }}>{why.kicker}</h2>
          <ul className="belief-list">
            {why.features.map((f, i) => (
              <li key={i}>
                <b>{f.t}</b>
                <br />
                <span>{f.d}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="pill" style={{ marginTop: 34 }}>
            Talk to us {ArrowIc}
          </Link>
        </div>
      </section>
      <CtaBand heading="Ready to *Get Started?*" />
    </main>
  );
}
