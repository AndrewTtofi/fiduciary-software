import Link from "next/link";
import { getSiteContent } from "@/lib/services/content";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const { faq } = await getSiteContent();
  return (
    <main>
      <section className="phero">
        <div className="mk-container">
          <span className="kicker">FAQ</span>
          <h1>Questions We Get <span className="gold">Every Week</span></h1>
          <p className="sub">If your question is not here, ask it on the call. There is no charge for asking.</p>
        </div>
      </section>

      <section className="sec">
        <div className="mk-container" style={{ maxWidth: 1080 }}>
          <div className="faq4-head">
            <div className="l">
              <span className="faq-badge">/ FAQs</span>
              <h2>Frequently asked questions</h2>
              <p>
                Everything people usually want to know before they book, from timelines and travel
                to what it costs and who actually takes the call.
              </p>
            </div>
            <div style={{ flex: "none" }}>
              <Link href="/contact" className="pill">Book Your Free 30-Minute Consultation</Link>
            </div>
          </div>
          <FaqAccordion faqs={faq} />
        </div>
      </section>

      <CtaBand heading="Still Have *Questions?*" body="Book a call and we will walk you through it, step by step." />
    </main>
  );
}
