import { CompareTool } from "./CompareTool";
import { RATES_REVIEWED } from "@/lib/data/jurisdictions";
import { getClientLoginEnabled } from "@/lib/services/settings";

export const metadata = {
  title: "Compare jurisdictions",
  description: "Compare 18+ corporate jurisdictions side by side: corporate tax, VAT, formation time, minimum capital and tax treaties.",
};

export default async function ComparePage() {
  const applyHref = (await getClientLoginEnabled()) ? "/login" : "/contact";
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">Free Tool</span>
          <h1>Compare Jurisdictions <span className="gold">Side by Side</span></h1>
          <p className="sub">Select the jurisdictions you are weighing up. Best value in each column is highlighted.</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <CompareTool applyHref={applyHref} />
          <p className="muted mt-6" style={{ fontSize: "var(--fs-xs)", maxWidth: "80ch" }}>
            Corporate income tax and VAT/GST figures are checked against{" "}
            <a href="https://taxsummaries.pwc.com" target="_blank" rel="noreferrer noopener" className="link-gold">PwC Worldwide Tax Summaries</a>
            {" "}— last full review {RATES_REVIEWED}. Any row added since is marked{" "}
            <span className="tag" style={{ color: "var(--mk-warn, #B5751B)" }}>unchecked</span>{" "}
            until it has been through the same review. Every row links to its source.
            Headline rates simplify many special regimes, and formation time, minimum capital and
            treaty counts are indicative. This is general information, not tax advice.
            Verify before relying.
          </p>
        </div>
      </section>
    </main>
  );
}
