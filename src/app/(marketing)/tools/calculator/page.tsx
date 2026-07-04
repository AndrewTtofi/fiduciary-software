import { CalculatorTool } from "./CalculatorTool";

export const metadata = {
  title: "Tax calculator",
  description: "Estimate your corporate tax savings across jurisdictions. Free, illustrative comparison.",
};

export default async function CalculatorPage() {
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; Free Tool</span>
          <h1>Estimate Your <span className="gold">Tax Savings</span></h1>
          <p className="sub">A rough, illustrative comparison of corporate tax on your profit. Enter your email to reveal the full breakdown.</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <CalculatorTool />
        </div>
      </section>
    </main>
  );
}
