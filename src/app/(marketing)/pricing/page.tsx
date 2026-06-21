import Link from "next/link";
import { TopNav } from "@/components/marketing/TopNav";
import { Footer } from "@/components/marketing/Footer";
import { PricingTool } from "@/components/marketing/PricingTool";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="shell-marketing">
      <TopNav />
      <main>
        <section className="section">
          <div className="mx-auto max-w-[1200px]">
            <div className="sec-head text-center mx-auto" style={{ maxWidth: "62ch", margin: "0 auto var(--space-10)" }}>
              <div className="eyebrow">PRICING</div>
              <h2>One platform. Priced to replace four tools.</h2>
              <p>Every plan is delivered fully managed and white-labelled. No setup headaches.</p>
            </div>

            <PricingTool />

            <p className="text-center text-muted mt-8" style={{ fontSize: "0.875rem" }}>
              A single converted client is typically worth several thousand euros in year one — one client covers the platform for a year.{" "}
              <Link href="/tools/calculator" className="text-brand">Estimate the value →</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
