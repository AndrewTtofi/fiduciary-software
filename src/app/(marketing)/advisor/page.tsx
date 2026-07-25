import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { getBranding } from "@/lib/services/branding";
import { getClientLoginEnabled } from "@/lib/services/settings";

export const metadata = {
  title: "AI Advisor",
  description: "Tell our AI advisor what you're trying to do, from lowering tax to setting up a company, getting banking or relocating, and get an instant service and jurisdiction recommendation.",
};

export default async function AdvisorPage() {
  const [{ brandName }, clientLogin] = await Promise.all([getBranding(), getClientLoginEnabled()]);
  return (
    <main>
      <section className="phero grid-bg" style={{ paddingBottom: 30 }}>
        <div className="mk-container">
          <span className="kicker">AI Advisor</span>
          <h1>Tell Us What You&apos;re <span className="gold">Trying to Do</span></h1>
        </div>
      </section>

      <section className="ivory sec-tight sec" style={{ paddingTop: 50 }}>
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <AdvisorChat brand={brandName} applyHref={clientLogin ? "/login" : "/contact"} />
        </div>
      </section>
    </main>
  );
}
