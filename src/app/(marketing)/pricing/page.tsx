import Link from "next/link";
import { CtaBand } from "@/components/marketing/CtaBand";
import { CheckIc } from "@/components/marketing/mk";

export const metadata = { title: "Packages" };

/* Scope comparison only — no fee numbers anywhere. Every package routes to
   the booking form; the quote is personalised after the call. */
type Pkg = {
  tag: string;
  title: string;
  sub: string;
  features: string[];
  feat?: boolean;
};

const PKGS: Pkg[] = [
  {
    tag: "Essential",
    title: "Formation",
    sub: "Get a clean Cyprus company up and running.",
    features: [
      "Company formation and registration",
      "Registered office and secretary",
      "Corporate bank or EMI introduction",
      "First year compliance calendar",
    ],
  },
  {
    tag: "Most chosen",
    title: "Formation and Tax",
    sub: "Company plus your Non-Dom tax residency.",
    feat: true,
    features: [
      "Everything in Formation",
      "Tax residency and Non-Dom setup",
      "60-day rule structuring",
      "Accounting and VAT registration",
    ],
  },
  {
    tag: "Full service",
    title: "Relocation",
    sub: "You, your family and your company, landed.",
    features: [
      "Everything in Formation and Tax",
      "Immigration and residence permits",
      "Property and Permanent Residency guidance",
      "Ongoing accounting and advisory",
    ],
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">How we work</span>
          <h1>Choose the Scope That <span className="gold">Fits</span></h1>
          <p className="sub">
            Three ways to engage us. Your personalised quote comes after your call, once we
            understand your situation.
          </p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 72 }}>
        <div className="mk-container">
          <div className="price-grid">
            {PKGS.map((p) => (
              <div key={p.title} className={`price-card reveal${p.feat ? " feat" : ""}`}>
                <div className="tier">{p.tag}</div>
                <h3>{p.title}</h3>
                <div className="psub">{p.sub}</div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{CheckIc}<span>{f}</span></li>
                  ))}
                </ul>
                <Link href="/contact" className={`pill${p.feat ? "" : " ghost"}`}>
                  Book Your Free 30-Minute Consultation
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8" style={{ fontSize: ".875rem", color: "var(--mk-grey)" }}>
            No price lists here on purpose. Every structure is different, so your quote is
            personalised after your call.
          </p>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
