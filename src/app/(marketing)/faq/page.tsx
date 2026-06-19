import Link from "next/link";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";

export const metadata = { title: "FAQ" };

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const FAQ: [string, string][] = [
  ["Why do I submit documents before booking a call?", "The gate ensures every consultation is with a serious, pre-qualified prospect. It also means your advisor walks into the call already knowing your situation — no time wasted on basics."],
  ["Where is my data stored?", "All data — including identity documents and financial information — is encrypted and stored within the EU, with GDPR-compliant data-portability and exit terms."],
  ["How long does review take?", "Typically 1–3 business days. You are notified by email (and WhatsApp, if enabled) the moment your application is approved and booking unlocks."],
  ["What happens to my information if I do not proceed?", "You can request export or deletion of your records at any time. Nothing is shared with third parties without your consent."],
  ["Which services can I apply for?", "Company formation, accounting & tax, tax residency, immigration, licensing and banking. Each has a tailored intake form so you only answer relevant questions."],
  ["How is pricing structured?", "Three engagements — Essentials, Standard and Full service — billed as a setup fee plus a monthly retainer, or a custom quote. See the pricing page for a full comparison."],
];

export default function FaqPage() {
  return (
    <div className="shell-marketing">
      <TopNav />
      <main>
        <section className="section">
          <div className="mx-auto max-w-[760px]">
            <div className="sec-head">
              <div className="eyebrow">QUESTIONS</div>
              <h2>Frequently asked.</h2>
            </div>

            <div className="acc">
              {FAQ.map(([q, a]) => (
                <details key={q} className="acc-item">
                  <summary className="acc-q">{q}<Chevron /></summary>
                  <div className="acc-a">{a}</div>
                </details>
              ))}
            </div>

            <div className="card mt-8 text-center" style={{ background: "var(--brand-50)", borderColor: "transparent" }}>
              <h3 style={{ fontWeight: 600, fontSize: "1.25rem" }}>Still have questions?</h3>
              <p className="text-muted mt-2">Start an application — you can save and exit at any point.</p>
              <Link href="/login" className="btn btn-primary mt-4">Start your application</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
