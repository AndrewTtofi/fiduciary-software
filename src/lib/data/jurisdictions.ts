/** Jurisdiction reference data for the public Compare Jurisdictions tool.
 *
 *  Cut to the FIFTEEN jurisdictions that matter to the firm's clients (Tools
 *  spec) so the annual review is realistic: Cyprus, the countries clients
 *  move from, and the international jurisdictions the firm forms companies
 *  and licences in (UK, USA, St. Lucia, Nevis, St. Vincent and the
 *  Grenadines, Mauritius).
 *
 *  Corporate income tax and standard VAT/GST rates were verified against
 *  PwC Worldwide Tax Summaries (taxsummaries.pwc.com) — see `sourceUrl` on
 *  each row and RATES_REVIEWED. Rows added since the last full review carry
 *  `pendingReview` and are marked "unchecked" in the UI until reconciled.
 *  Formation time, minimum capital and treaty counts are indicative only.
 *  Headline rates simplify many special regimes — not tax advice. */
export type Jurisdiction = {
  id: string;
  name: string;
  flag: string;
  corpTax: number;   // headline corporate income tax %
  vat: number;       // standard VAT/GST %
  days: number;      // typical formation time, business days (indicative)
  minCap: string;    // minimum share capital, display string (indicative)
  treaties: number;  // double-tax treaties (indicative)
  eu: boolean;
  sourceUrl: string; // PwC Worldwide Tax Summaries page the tax figures were checked against
  note?: string;     // caveat shown on hover / detail
  /** True when the figures have NOT been through the PwC reconciliation the
   *  rest of the table had. Surfaced in the UI so the page never claims a
   *  check that did not happen. The four rows added 17 Aug 2026 (USA, St.
   *  Lucia, Nevis, St. Vincent and the Grenadines) and Mauritius carry it
   *  until the firm's next review. */
  pendingReview?: boolean;
  /** ISO 3166-1 alpha-2, for the inline SVG flag. */
  iso: string;
};

/** Month the tax/VAT figures were last reconciled against the source. */
export const RATES_REVIEWED = "August 2026";

const PWC = "https://taxsummaries.pwc.com";

export const JURISDICTIONS: Jurisdiction[] = [
  { id: "cy", iso: "CY", name: "Cyprus", flag: "🇨🇾", corpTax: 15, vat: 19, days: 7, minCap: "€1", treaties: 65, eu: true, sourceUrl: `${PWC}/cyprus/corporate/taxes-on-corporate-income`, note: "CIT rose to 15% on 1 Jan 2026 (was 12.5%). Non-Dom residents pay 0% on dividends." },
  { id: "uk", iso: "GB", name: "United Kingdom", flag: "🇬🇧", corpTax: 25, vat: 20, days: 1, minCap: "£1", treaties: 130, eu: false, sourceUrl: `${PWC}/united-kingdom/corporate/taxes-on-corporate-income`, note: "25% main rate; 19% small-profits rate below £50k." },
  { id: "us", iso: "US", name: "United States", flag: "🇺🇸", corpTax: 21, vat: 0, days: 3, minCap: "$0", treaties: 66, eu: false, sourceUrl: `${PWC}/united-states/corporate/taxes-on-corporate-income`, note: "21% federal rate; state corporate taxes come on top. No federal VAT — state and local sales taxes instead.", pendingReview: true },
  { id: "lc", iso: "LC", name: "St. Lucia", flag: "🇱🇨", corpTax: 30, vat: 12.5, days: 5, minCap: "$1", treaties: 10, eu: false, sourceUrl: `${PWC}/saint-lucia/corporate/taxes-on-corporate-income`, note: "30% on Saint Lucia-source income; territorial system — foreign-source income of an international business company is generally outside the charge.", pendingReview: true },
  { id: "kn", iso: "KN", name: "Nevis", flag: "🇰🇳", corpTax: 33, vat: 17, days: 3, minCap: "$1", treaties: 10, eu: false, sourceUrl: `${PWC}/saint-kitts-and-nevis/corporate/taxes-on-corporate-income`, note: "Federation of St. Kitts and Nevis: 33% on local-source income; Nevis LLCs and IBCs are typically taxed on Nevis-source income only.", pendingReview: true },
  { id: "vc", iso: "VC", name: "St. Vincent and the Grenadines", flag: "🇻🇨", corpTax: 28, vat: 16, days: 5, minCap: "$1", treaties: 8, eu: false, sourceUrl: `${PWC}/quick-charts/corporate-income-tax-cit-rates`, note: "28% on domestic-source income; business companies with no local activity are generally taxed on local-source income only.", pendingReview: true },
  { id: "mu", iso: "MU", name: "Mauritius", flag: "🇲🇺", corpTax: 15, vat: 15, days: 7, minCap: "$1", treaties: 46, eu: false, sourceUrl: `${PWC}/mauritius/corporate/taxes-on-corporate-income`, note: "15% headline; an 80% partial exemption applies to certain foreign-source income, giving an effective 3%.", pendingReview: true },
  { id: "de", iso: "DE", name: "Germany", flag: "🇩🇪", corpTax: 30, vat: 19, days: 14, minCap: "€25,000", treaties: 96, eu: true, sourceUrl: `${PWC}/germany/corporate/taxes-on-corporate-income`, note: "15% federal + 5.5% solidarity = 15.825%, plus municipal trade tax: about 30% in Berlin, 32% Frankfurt, 33% Munich." },
  { id: "fr", iso: "FR", name: "France", flag: "🇫🇷", corpTax: 25, vat: 20, days: 10, minCap: "€1", treaties: 121, eu: true, sourceUrl: `${PWC}/france/corporate/taxes-on-corporate-income`, note: "25% standard; surtaxes apply to very large companies." },
  { id: "nl", iso: "NL", name: "Netherlands", flag: "🇳🇱", corpTax: 25.8, vat: 21, days: 7, minCap: "€0.01", treaties: 95, eu: true, sourceUrl: `${PWC}/netherlands/corporate/taxes-on-corporate-income`, note: "25.8% top rate; 19% on the first €200k of profit." },
  { id: "it", iso: "IT", name: "Italy", flag: "🇮🇹", corpTax: 24, vat: 22, days: 14, minCap: "€1", treaties: 100, eu: true, sourceUrl: `${PWC}/italy/corporate/taxes-on-corporate-income`, note: "24% IRES plus regional IRAP of about 3.9%." },
  { id: "es", iso: "ES", name: "Spain", flag: "🇪🇸", corpTax: 25, vat: 21, days: 15, minCap: "€3,000", treaties: 95, eu: true, sourceUrl: `${PWC}/spain/corporate/taxes-on-corporate-income`, note: "25% general rate; reduced rates for small companies and start-ups." },
  { id: "gr", iso: "GR", name: "Greece", flag: "🇬🇷", corpTax: 22, vat: 24, days: 12, minCap: "€1", treaties: 57, eu: true, sourceUrl: `${PWC}/greece/corporate/taxes-on-corporate-income` },
  { id: "pt", iso: "PT", name: "Portugal", flag: "🇵🇹", corpTax: 19, vat: 23, days: 8, minCap: "€1", treaties: 79, eu: true, sourceUrl: `${PWC}/portugal/corporate/taxes-on-corporate-income`, note: "CIT reduced to 19% in 2025 (was 21%); surcharges may apply." },
  { id: "ae", iso: "AE", name: "UAE", flag: "🇦🇪", corpTax: 9, vat: 5, days: 7, minCap: "AED 0", treaties: 140, eu: false, sourceUrl: `${PWC}/united-arab-emirates/corporate/taxes-on-corporate-income`, note: "9% on profits above AED 375k; 0% below (since Jun 2023)." },
];
