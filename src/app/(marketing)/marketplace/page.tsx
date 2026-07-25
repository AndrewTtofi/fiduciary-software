import { MarketplaceTool } from "@/components/marketplace/MarketplaceTool";
import { getBranding } from "@/lib/services/branding";

export const metadata = {
  title: "Partner network",
  description: "A vetted network of banks, EMIs, corporate-service providers, advisors and licensing partners. Compare and apply with one reusable KYC profile.",
};

export default async function MarketplacePage() {
  const { brandName } = await getBranding();
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">Partner Network</span>
          <h1>Our Vetted <span className="gold">Partner Network</span></h1>
          <p className="sub">Banks, EMIs, corporate-service providers, advisors and licensing partners. Compare and apply with one reusable KYC profile.</p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <MarketplaceTool brand={brandName} authed={false} />
        </div>
      </section>
    </main>
  );
}
