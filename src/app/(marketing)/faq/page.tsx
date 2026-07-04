import { getSiteContent } from "@/lib/services/content";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ChevronIc } from "@/components/marketing/mk";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const { faq } = await getSiteContent();
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; Questions</span>
          <h1>Frequently <span className="gold">Asked</span></h1>
          <p className="sub">Straight answers on structuring, timelines, banking and compliance — before you commit to anything.</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <div className="acc reveal">
            {faq.map((item, i) => (
              <details key={i} className="acc-item">
                <summary className="acc-q">{item.q}{ChevronIc}</summary>
                <div className="acc-a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand heading="Still Have *Questions?*" body="Start an application — you can save and exit at any point — or book a call and we'll walk you through it." />
    </main>
  );
}
