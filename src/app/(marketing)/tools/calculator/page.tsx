import { TaxCalculator } from "@/components/marketing/TaxCalculator";

export const metadata = {
  title: "Tax calculator",
  description:
    "Estimate your effective corporate tax rate in Cyprus or the UAE — corporate income tax, GESY and the IP Box regime. Free, illustrative estimate.",
};

/** Official Cyprus government resources on corporate taxation. External links
 *  only — all destinations are government-operated (.gov.cy / mof.gov.cy). */
const CY_GOV_LINKS: { href: string; title: string; desc: string }[] = [
  {
    href: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/index_en/index_en",
    title: "Cyprus Tax Department",
    desc: "The Ministry of Finance Tax Department portal — legislation, circulars, forms and announcements on direct taxation, including corporate income tax.",
  },
  {
    href: "https://www.gov.cy/mof-tax/en/",
    title: "Tax Department on gov.cy",
    desc: "The Tax Department's page on the central government portal — services, guidance and contact points for businesses and their tax obligations.",
  },
  {
    href: "https://www.mof.gov.cy/mof/tax/taxdep.nsf/ced22_en/ced22_en?OpenDocument",
    title: "Companies — Direct Taxation",
    desc: "The Tax Department's dedicated section for companies: registration, corporate income tax returns, special defence contribution and employer obligations.",
  },
  {
    href: "https://taxforall.mof.gov.cy/",
    title: "Tax For All (TFA) portal",
    desc: "The government's unified online tax platform, progressively replacing TAXISnet for registrations, returns and payments.",
  },
  {
    href: "https://taxisnet.mof.gov.cy/",
    title: "TAXISnet",
    desc: "The established e-filing system — still used for the corporate income tax return (T.D.4) until its migration to Tax For All completes.",
  },
  {
    href: "https://www.mof.gov.cy/mof/TAX/taxdep.nsf/page17_en/page17_en",
    title: "Tax Department e-Services",
    desc: "Directory of the Tax Department's electronic services — tax portal access, payments, certificates and taxpayer registration.",
  },
  {
    href: "https://www.companies.gov.cy/en/",
    title: "Registrar of Companies",
    desc: "Company incorporation, annual returns and corporate filings — the statutory registry every Cyprus company reports to alongside its tax filings.",
  },
  {
    href: "https://www.businessincyprus.gov.cy/doing-business-in-cyprus/start-your-business/registering-for-income-tax-and-value-added-tax/",
    title: "Registering for Income Tax & VAT",
    desc: "Official step-by-step guidance for new businesses on obtaining a tax identification code and registering for corporate income tax and VAT.",
  },
];

export default async function CalculatorPage() {
  return (
    <main>
      <section className="phero grid-bg">
        <div className="mk-container">
          <span className="kicker">&mdash; Free Tool</span>
          <h1>Your Effective <span className="gold">Tax Rate</span></h1>
          <p className="sub">
            Slide your annual profit and see the full picture — corporate income tax,
            GESY and the IP Box regime. A rough, illustrative estimate in seconds.
          </p>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 90 }}>
        <div className="mk-container">
          <div className="calc-grid">
            <div>
              <span className="kicker">&mdash; How It Works</span>
              <h2>Cyprus at a glance</h2>
              <p className="body">
                Cyprus taxes corporate profits at <b>15%</b> (from 1 January 2026).
                Profit distributions to non-dom shareholders attract <b>0% dividend
                tax</b> — only a <b>2.65% GESY</b> health contribution applies, and the
                contribution base is capped at <b>€180,000</b>, so your effective rate
                falls as profit grows. Qualifying IP income under the <b>IP Box
                regime</b> can be taxed at an effective <b>3%</b>.
              </p>
              <p className="body">
                The numbers here are an illustrative estimate, not advice — your
                structure, residency and income mix all matter. Talk to us and we will
                map the exact position for your company.
              </p>
            </div>
            <TaxCalculator />
          </div>
        </div>
      </section>

      <section className="ivory sec" style={{ paddingTop: 0 }}>
        <div className="mk-container">
          <span className="kicker">&mdash; Official Sources</span>
          <h2>Cyprus corporate tax, from the source</h2>
          <p className="body" style={{ maxWidth: "62ch" }}>
            Everything corporate-tax related published by the Republic of Cyprus —
            the Tax Department, its filing portals and the company registry.
          </p>
          <div className="feat-grid" style={{ marginTop: 48 }}>
            {CY_GOV_LINKS.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="feat">
                <h3>{l.title} ↗</h3>
                <p>{l.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
