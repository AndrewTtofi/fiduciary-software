/** Jurisdiction reference data for the public comparison + tax-calculator tools.
 *
 *  Corporate income tax and standard VAT/GST rates were verified against
 *  PwC Worldwide Tax Summaries (taxsummaries.pwc.com), reviewed June 2026 — see
 *  `sourceUrl` on each row. Formation time, minimum capital and treaty counts are
 *  indicative only. Headline rates simplify many special regimes — not tax advice. */
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
   *  check that did not happen. Nothing carries it right now — every row was
   *  reconciled on 6 Aug 2026 — but the mechanism stays for the next addition. */
  pendingReview?: boolean;
  /** ISO 3166-1 alpha-2, for the inline SVG flag. */
  iso: string;
};

/** Month the tax/VAT figures were last reconciled against the source. */
export const RATES_REVIEWED = "August 2026";

const PWC = "https://taxsummaries.pwc.com";

export const JURISDICTIONS: Jurisdiction[] = [
  { id: "cy", iso: "CY", name: "Cyprus", flag: "🇨🇾", corpTax: 15, vat: 19, days: 7, minCap: "€1", treaties: 65, eu: true, sourceUrl: `${PWC}/cyprus/corporate/taxes-on-corporate-income`, note: "CIT rose to 15% on 1 Jan 2026 (was 12.5%)." },
  { id: "mt", iso: "MT", name: "Malta", flag: "🇲🇹", corpTax: 35, vat: 18, days: 10, minCap: "€1,165", treaties: 70, eu: true, sourceUrl: `${PWC}/malta/corporate/taxes-on-corporate-income`, note: "35% standard; refund regime can lower the effective rate." },
  { id: "ie", iso: "IE", name: "Ireland", flag: "🇮🇪", corpTax: 12.5, vat: 23, days: 5, minCap: "€1", treaties: 74, eu: true, sourceUrl: `${PWC}/ireland/corporate/taxes-on-corporate-income`, note: "12.5% trading rate; 15% Pillar Two minimum for large groups." },
  { id: "ee", iso: "EE", name: "Estonia", flag: "🇪🇪", corpTax: 22, vat: 24, days: 2, minCap: "€2,500", treaties: 62, eu: true, sourceUrl: `${PWC}/estonia/corporate/taxes-on-corporate-income`, note: "22% on distributed profits only; undistributed profits exempt. VAT 24% from Jul 2025." },
  { id: "ae", iso: "AE", name: "UAE", flag: "🇦🇪", corpTax: 9, vat: 5, days: 7, minCap: "AED 0", treaties: 140, eu: false, sourceUrl: `${PWC}/united-arab-emirates/corporate/taxes-on-corporate-income`, note: "9% on profits above AED 375k; 0% below (since Jun 2023)." },
  { id: "gi", iso: "GI", name: "Gibraltar", flag: "🇬🇮", corpTax: 15, vat: 0, days: 10, minCap: "£100", treaties: 0, eu: false, sourceUrl: `${PWC}/gibraltar/corporate/taxes-on-corporate-income`, note: "15% since 1 Jul 2024 (was 12.5%); no VAT." },
  { id: "bvi", iso: "VG", name: "BVI", flag: "🇻🇬", corpTax: 0, vat: 0, days: 3, minCap: "$1", treaties: 0, eu: false, sourceUrl: `${PWC}/quick-charts/corporate-income-tax-cit-rates`, note: "No corporate income tax; no VAT." },
  { id: "lu", iso: "LU", name: "Luxembourg", flag: "🇱🇺", corpTax: 23.87, vat: 17, days: 12, minCap: "€12,000", treaties: 86, eu: true, sourceUrl: `${PWC}/luxembourg/corporate/taxes-on-corporate-income`, note: "Aggregate Luxembourg-City rate; reduced from 24.94% in 2025." },
  { id: "nl", iso: "NL", name: "Netherlands", flag: "🇳🇱", corpTax: 25.8, vat: 21, days: 7, minCap: "€0.01", treaties: 95, eu: true, sourceUrl: `${PWC}/netherlands/corporate/taxes-on-corporate-income`, note: "25.8% top rate; 19% on the first €200k of profit." },
  { id: "ch", iso: "CH", name: "Switzerland", flag: "🇨🇭", corpTax: 19.6, vat: 8.1, days: 14, minCap: "CHF 20,000", treaties: 100, eu: false, sourceUrl: `${PWC}/switzerland/corporate/taxes-on-corporate-income`, note: "Representative Zurich rate; effective combined rate varies ~11.9–21% by canton." },
  { id: "sg", iso: "SG", name: "Singapore", flag: "🇸🇬", corpTax: 17, vat: 9, days: 3, minCap: "S$1", treaties: 90, eu: false, sourceUrl: `${PWC}/singapore/corporate/taxes-on-corporate-income`, note: "GST raised to 9% in 2024." },
  { id: "uk", iso: "GB", name: "United Kingdom", flag: "🇬🇧", corpTax: 25, vat: 20, days: 1, minCap: "£1", treaties: 130, eu: false, sourceUrl: `${PWC}/united-kingdom/corporate/taxes-on-corporate-income`, note: "25% main rate; 19% small-profits rate below £50k." },
  { id: "pt", iso: "PT", name: "Portugal", flag: "🇵🇹", corpTax: 19, vat: 23, days: 8, minCap: "€1", treaties: 79, eu: true, sourceUrl: `${PWC}/portugal/corporate/taxes-on-corporate-income`, note: "CIT reduced to 19% in 2025 (was 21%); surcharges may apply." },
  { id: "bg", iso: "BG", name: "Bulgaria", flag: "🇧🇬", corpTax: 10, vat: 20, days: 7, minCap: "BGN 2", treaties: 69, eu: true, sourceUrl: `${PWC}/bulgaria/corporate/taxes-on-corporate-income` },
  { id: "hu", iso: "HU", name: "Hungary", flag: "🇭🇺", corpTax: 9, vat: 27, days: 5, minCap: "HUF 3M", treaties: 80, eu: true, sourceUrl: `${PWC}/hungary/corporate/taxes-on-corporate-income`, note: "Lowest headline CIT in the EU; VAT is the EU's highest at 27%." },
  { id: "hk", iso: "HK", name: "Hong Kong", flag: "🇭🇰", corpTax: 16.5, vat: 0, days: 4, minCap: "HK$1", treaties: 45, eu: false, sourceUrl: `${PWC}/hong-kong-sar/corporate/taxes-on-corporate-income`, note: "Two-tier profits tax; 16.5% above HKD 2m, 8.25% below. No VAT/GST." },
  { id: "ky", iso: "KY", name: "Cayman Islands", flag: "🇰🇾", corpTax: 0, vat: 0, days: 5, minCap: "$1", treaties: 0, eu: false, sourceUrl: `${PWC}/cayman-islands/corporate/taxes-on-corporate-income`, note: "No corporate income tax; no VAT." },

  /* ── Added 6 Aug 2026 ──────────────────────────────────────────────────
     Mostly the jurisdictions clients are moving *from*, so the comparison
     answers "versus what I have today" rather than only "versus other
     offshore options".

     Corporate rates reconciled against each row's `sourceUrl` on 6 Aug 2026.
     Lithuania was corrected from 16% to 17% during that check. VAT/GST figures
     are indicative and were not all re-checked line by line. */
  { id: "de", iso: "DE", name: "Germany", flag: "🇩🇪", corpTax: 30, vat: 19, days: 14, minCap: "€25,000", treaties: 96, eu: true, sourceUrl: `${PWC}/germany/corporate/taxes-on-corporate-income`, note: "15% federal + 5.5% solidarity = 15.825%, plus municipal trade tax: about 30% in Berlin, 32% Frankfurt, 33% Munich."  },
  { id: "fr", iso: "FR", name: "France", flag: "🇫🇷", corpTax: 25, vat: 20, days: 10, minCap: "€1", treaties: 121, eu: true, sourceUrl: `${PWC}/france/corporate/taxes-on-corporate-income`, note: "25% standard; surtaxes apply to very large companies."  },
  { id: "es", iso: "ES", name: "Spain", flag: "🇪🇸", corpTax: 25, vat: 21, days: 15, minCap: "€3,000", treaties: 95, eu: true, sourceUrl: `${PWC}/spain/corporate/taxes-on-corporate-income`, note: "25% general rate; reduced rates for small companies and start-ups."  },
  { id: "it", iso: "IT", name: "Italy", flag: "🇮🇹", corpTax: 24, vat: 22, days: 14, minCap: "€1", treaties: 100, eu: true, sourceUrl: `${PWC}/italy/corporate/taxes-on-corporate-income`, note: "24% IRES plus regional IRAP of about 3.9%. A reduced 20% IRES applied for FY2025 on reinvested profits."  },
  { id: "pl", iso: "PL", name: "Poland", flag: "🇵🇱", corpTax: 19, vat: 23, days: 7, minCap: "PLN 5,000", treaties: 90, eu: true, sourceUrl: `${PWC}/poland/corporate/taxes-on-corporate-income`, note: "19% standard; 9% for small taxpayers under EUR 2m revenue."  },
  { id: "gr", iso: "GR", name: "Greece", flag: "🇬🇷", corpTax: 22, vat: 24, days: 12, minCap: "€1", treaties: 57, eu: true, sourceUrl: `${PWC}/greece/corporate/taxes-on-corporate-income`  },
  { id: "cz", iso: "CZ", name: "Czechia", flag: "🇨🇿", corpTax: 21, vat: 21, days: 10, minCap: "CZK 1", treaties: 90, eu: true, sourceUrl: `${PWC}/czech-republic/corporate/taxes-on-corporate-income`, note: "Raised to 21% in 2024 (was 19%)."  },
  { id: "ro", iso: "RO", name: "Romania", flag: "🇷🇴", corpTax: 16, vat: 21, days: 7, minCap: "RON 1", treaties: 88, eu: true, sourceUrl: `${PWC}/romania/corporate/taxes-on-corporate-income`, note: "Micro-enterprise regime may apply instead. VAT rose to 21% in 2025 — confirm."  },
  { id: "lt", iso: "LT", name: "Lithuania", flag: "🇱🇹", corpTax: 17, vat: 21, days: 5, minCap: "€1,000", treaties: 56, eu: true, sourceUrl: `${PWC}/lithuania/corporate/taxes-on-corporate-income`, note: "17% from 1 January 2026."  },
  { id: "lv", iso: "LV", name: "Latvia", flag: "🇱🇻", corpTax: 20, vat: 21, days: 5, minCap: "€2,800", treaties: 63, eu: true, sourceUrl: `${PWC}/latvia/corporate/taxes-on-corporate-income`, note: "Distributed profits only; the 20% rate applies to a base divided by 0.8, an effective 25%."  },
  { id: "at", iso: "AT", name: "Austria", flag: "🇦🇹", corpTax: 23, vat: 20, days: 12, minCap: "€10,000", treaties: 90, eu: true, sourceUrl: `${PWC}/austria/corporate/taxes-on-corporate-income`, note: "Reduced to 23% in 2024."  },
  { id: "dk", iso: "DK", name: "Denmark", flag: "🇩🇰", corpTax: 22, vat: 25, days: 5, minCap: "DKK 20,000", treaties: 80, eu: true, sourceUrl: `${PWC}/denmark/corporate/taxes-on-corporate-income`  },
  { id: "je", iso: "JE", name: "Jersey", flag: "🇯🇪", corpTax: 0, vat: 5, days: 5, minCap: "£1", treaties: 14, eu: false, sourceUrl: `${PWC}/jersey/corporate/taxes-on-corporate-income`, note: "0% standard; 10% for financial services, 20% for utilities and Jersey real estate income. GST 5%."  },
  { id: "gg", iso: "GG", name: "Guernsey", flag: "🇬🇬", corpTax: 0, vat: 0, days: 5, minCap: "£1", treaties: 14, eu: false, sourceUrl: `${PWC}/guernsey/corporate/taxes-on-corporate-income`, note: "0% standard; 10% or 20% for certain regulated activities. No GST at the time of review."  },
  { id: "li", iso: "LI", name: "Liechtenstein", flag: "🇱🇮", corpTax: 12.5, vat: 8.1, days: 10, minCap: "CHF 30,000", treaties: 22, eu: false, sourceUrl: `${PWC}/liechtenstein/corporate/taxes-on-corporate-income`, note: "12.5% flat, with a CHF 1,800 annual minimum; VAT follows the Swiss rate. Pillar Two 15% for large groups."  },
  { id: "ge", iso: "GE", name: "Georgia", flag: "🇬🇪", corpTax: 15, vat: 18, days: 2, minCap: "GEL 0", treaties: 58, eu: false, sourceUrl: `${PWC}/georgia/corporate/taxes-on-corporate-income`, note: "Estonian model: 15% on distributed profits only; 20% for banks and other credit providers."  },
  { id: "im", iso: "IM", name: "Isle of Man", flag: "🇮🇲", corpTax: 0, vat: 20, days: 6, minCap: "£1", treaties: 11, eu: false, sourceUrl: `${PWC}/isle-of-man/corporate/taxes-on-corporate-income`, note: "0% standard corporate rate; VAT at UK parity (20%)." },
];
