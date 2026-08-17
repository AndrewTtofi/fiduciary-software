import { CtaBand } from "@/components/marketing/CtaBand";
import { getToolSettings, correctAsAtLabel } from "@/lib/services/tool-settings";
import { ToolsHub } from "./ToolsHub";

export const metadata = {
  title: "Free Cyprus tax and residency tools",
  description: "Cyprus tax, calculated. Income tax, salary cost, Non-Dom savings, effective corporate rate, VAT, IP Box, which permit you need, citizenship by descent, the tax calendar and a jurisdiction comparison. No sign-up, no email required.",
};

export default async function ToolsPage() {
  const rates = await getToolSettings();
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">Free tools</span>
          <h1>Cyprus tax, <span className="gold">calculated.</span></h1>
          <p className="sub">Work out where you stand before you speak to anyone. No sign-up, no email required.</p>
          <div className="tool-badges">
            <span className="tool-badge">Updated {rates.taxYear}</span>
            <span className="tool-asat">Rates correct as at {correctAsAtLabel(rates.correctAsAt)}</span>
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 44 }}>
        <div className="mk-container">
          <ToolsHub />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
