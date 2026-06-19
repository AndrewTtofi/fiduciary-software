import Link from "next/link";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";

export const metadata = { title: "Pricing" };

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

type Plan = {
  tier: string;
  amount: string;
  unit: string;
  feat?: boolean;
  features: [boolean, string][];
};

const PLANS: Plan[] = [
  {
    tier: "Essentials",
    amount: "€1,200",
    unit: "one-off + from €90/mo",
    features: [
      [true, "Cyprus company formation"],
      [true, "Registered office & secretary"],
      [true, "Client dashboard & document vault"],
      [true, "Email support"],
      [false, "Accounting & VAT"],
      [false, "Banking introductions"],
      [false, "Dedicated advisor"],
    ],
  },
  {
    tier: "Standard",
    amount: "€2,400",
    unit: "setup + from €240/mo",
    feat: true,
    features: [
      [true, "Everything in Essentials"],
      [true, "Accounting & VAT compliance"],
      [true, "Annual tax filing"],
      [true, "Priority review (1 business day)"],
      [true, "Secure messaging with your advisor"],
      [true, "Deadline reminders"],
      [false, "Banking introductions"],
    ],
  },
  {
    tier: "Full service",
    amount: "Custom",
    unit: "tailored to your engagement",
    features: [
      [true, "Everything in Standard"],
      [true, "Banking introductions (25+ partners)"],
      [true, "Tax residency (Non-Dom)"],
      [true, "Immigration & relocation support"],
      [true, "AML / KYC packaging"],
      [true, "Dedicated advisor"],
      [true, "Priority support"],
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="shell-marketing">
      <TopNav />
      <main>
        <section className="section">
          <div className="mx-auto max-w-[1200px]">
            <div className="sec-head text-center mx-auto" style={{ maxWidth: "62ch" }}>
              <div className="eyebrow">PRICING</div>
              <h2>One firm. Priced to replace four.</h2>
              <p>Every engagement is delivered fully managed, with a dedicated advisor and complete visibility. No setup headaches.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 items-start mt-10">
              {PLANS.map((p) => (
                <div key={p.tier} className={`price-card${p.feat ? " feat" : ""}`}>
                  <div className="tier">{p.tier}</div>
                  <div className="amt">{p.amount} <span>{p.unit}</span></div>
                  <ul>
                    {p.features.map(([on, label]) => (
                      <li key={label} style={on ? undefined : { color: "var(--muted)" }}>
                        <span style={{ width: 18, height: 18, flex: "none", marginTop: 2, color: on ? "var(--success)" : "var(--border-strong)" }}>
                          <Check />
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className={`btn btn-block ${p.feat ? "btn-primary" : "btn-secondary"}`}>
                    Choose {p.tier}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-muted mt-8" style={{ fontSize: "0.875rem" }}>
              Indicative pricing — your exact quote depends on jurisdiction and scope.{" "}
              <Link href="/login" className="text-brand">Start an application →</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
