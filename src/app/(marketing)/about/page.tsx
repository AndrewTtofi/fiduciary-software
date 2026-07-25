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
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">About us</span>
          <h1>
            Built Around One Promise:<br />
            <span className="gold">We Are Where Our Clients Need Us</span>
          </h1>
          <p className="sub">
            {brandName} is a corporate services firm serving international entrepreneurs
            with transparent, compliant structures.
          </p>
        </div>
      </section>
      <section className="ivory sec">
        <div className="mk-container split">
          <div className="photo-card reveal" style={{ backgroundImage: "url(/marketing/pc-story.jpg)" }} />
          <div className="reveal">
            <span className="kicker">Our story</span>
            <h2>Decades of Expertise, One Accountable Team</h2>
            <p className="body"><BoldText text={about.body1} /></p>
            <p className="body"><BoldText text={about.body2} /></p>
            <Link href="/contact" className="pill" style={{ marginTop: 34 }}>
              Talk to us {ArrowIc}
            </Link>
          </div>
        </div>
      </section>
      <section className="why sec">
        <div className="mk-container">
          <div className="head reveal">
            <div className="dot" />
            <span className="kicker">{why.kicker}</span>
            <h2>What Working With Us <span className="gold">Feels Like</span></h2>
          </div>
          <div className="feat-grid">
            {why.features.map((f, i) => (
              <div className="feat reveal" key={i}>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand heading="Ready to *Get Started?*" onWhite />
    </main>
  );
}
