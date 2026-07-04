import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { getBranding } from "@/lib/services/branding";

export const metadata = {
  title: "AI Advisor",
  description: "Tell our AI advisor what you're trying to do — lower tax, set up a company, get banking, relocate — and get an instant service + jurisdiction recommendation.",
};

export default async function AdvisorPage() {
  const { brandName } = await getBranding();
  return (
    <main>
      <section className="phero grid-bg" style={{ paddingBottom: 30 }}>
        <div className="mk-container">
          <span className="kicker">&mdash; AI Advisor</span>
          <h1>Tell Us What You&apos;re <span className="gold">Trying to Do</span></h1>
        </div>
      </section>

      <section className="ivory sec-tight sec" style={{ paddingTop: 50 }}>
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <AdvisorChat brand={brandName} />
        </div>
      </section>
    </main>
  );
}
