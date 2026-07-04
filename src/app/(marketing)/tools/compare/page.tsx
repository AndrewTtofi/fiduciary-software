import { CompareTool } from "./CompareTool";
import { RATES_REVIEWED } from "@/lib/data/jurisdictions";

export const metadata = {
  title: "Compare jurisdictions",
  description: "Compare 18+ corporate jurisdictions side by side — corporate tax, VAT, formation time, minimum capital and tax treaties.",
};

export default async function ComparePage() {
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; Free Tool</span>
          <h1>Compare Jurisdictions <span className="gold">Side by Side</span></h1>
          <p className="sub">Select the jurisdictions you are weighing up. Best value in each column is highlighted.</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <CompareTool />
          <p className="muted mt-6" style={{ fontSize: "var(--fs-xs)", maxWidth: "80ch" }}>
            Corporate income tax and VAT/GST figures verified against{" "}
            <a href="https://taxsummaries.pwc.com" target="_blank" rel="noreferrer noopener" className="link-gold">PwC Worldwide Tax Summaries</a>
            {" "}(reviewed {RATES_REVIEWED}); each row links to its source. Headline rates simplify many
            special regimes, and formation time, minimum capital and treaty counts are indicative.
            This is general information, not tax advice — verify before relying.
          </p>
        </div>
      </section>
    </main>
  );
}
