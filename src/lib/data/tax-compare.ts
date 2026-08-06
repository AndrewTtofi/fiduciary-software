/* Country-comparison figures for the effective-tax-rate calculator.

   Each country's number is the effective TOTAL tax on the same fully
   distributed profit the Cyprus engine models: the company pays corporate tax,
   then the owner pays dividend tax on what is left.

       effective = corporate + (1 − corporate) × dividend

   These used to be four opaque percentages marked "PLACEHOLDERS pending the
   confirmed per-country model". Storing the two components instead makes every
   figure reproducible and checkable against its `sourceUrl`, and means adding a
   country is a sourced fact rather than an invented total. The model reproduces
   the firm's published Germany claim of "more than 48%" (48.5%).

   Rates checked against PwC Worldwide Tax Summaries, August 2026. The dividend
   figure is the rate a resident individual owner pays on a distribution, top
   bracket where the country uses brackets.

   Deliberately excluded: Ireland, Switzerland and Australia, whose imputation,
   partial-taxation and franking systems this simple two-step model would
   misrepresent. Better absent than wrong. */

export type CompareCountry = {
  label: string;
  /** Combined corporate income tax, as a decimal. */
  corp: number;
  /** Tax the owner pays on the distribution, as a decimal. */
  dividend: number;
  /** How the two figures were arrived at — shown under the comparison. */
  basis: string;
  sourceUrl: string;
};

const PWC = "https://taxsummaries.pwc.com";

/** Effective total tax on fully distributed profit. */
export function effectiveRate(c: CompareCountry): number {
  return c.corp + (1 - c.corp) * c.dividend;
}

export const COMPARE_COUNTRIES: Record<string, CompareCountry> = {
  DE: {
    label: "Germany", corp: 0.30, dividend: 0.26375,
    basis: "15% federal + 5.5% solidarity + municipal trade tax (≈30% Berlin); 25% Abgeltungsteuer + solidarity on the dividend.",
    sourceUrl: `${PWC}/germany/corporate/taxes-on-corporate-income`,
  },
  FR: {
    label: "France", corp: 0.25, dividend: 0.314,
    basis: "25% CIT; 31.4% flat tax (PFU) from Jan 2026 — 12.8% income tax + 18.6% social contributions.",
    sourceUrl: `${PWC}/france/individual/taxes-on-personal-income`,
  },
  NL: {
    label: "Netherlands", corp: 0.258, dividend: 0.31,
    basis: "25.8% top CIT; Box 2 substantial-holding rate, 31% top bracket in 2026.",
    sourceUrl: `${PWC}/netherlands/individual/income-determination`,
  },
  IT: {
    label: "Italy", corp: 0.279, dividend: 0.26,
    basis: "24% IRES + ≈3.9% regional IRAP; 26% substitute tax on dividends.",
    sourceUrl: `${PWC}/italy/corporate/taxes-on-corporate-income`,
  },
  GB: {
    label: "United Kingdom", corp: 0.25, dividend: 0.3375,
    basis: "25% main CIT; 33.75% higher-rate dividend tax (39.35% at the additional rate).",
    sourceUrl: `${PWC}/united-kingdom/corporate/taxes-on-corporate-income`,
  },
  ES: {
    label: "Spain", corp: 0.25, dividend: 0.28,
    basis: "25% general CIT; savings income top rate of 28% on the dividend.",
    sourceUrl: `${PWC}/spain/corporate/taxes-on-corporate-income`,
  },
  BE: {
    label: "Belgium", corp: 0.25, dividend: 0.30,
    basis: "25% CIT; 30% withholding on dividends.",
    sourceUrl: `${PWC}/belgium/corporate/taxes-on-corporate-income`,
  },
  AT: {
    label: "Austria", corp: 0.23, dividend: 0.275,
    basis: "23% CIT; 27.5% capital-yields tax on the distribution.",
    sourceUrl: `${PWC}/austria/corporate/taxes-on-corporate-income`,
  },
  SE: {
    label: "Sweden", corp: 0.206, dividend: 0.30,
    basis: "20.6% CIT; 30% on investment income (closely-held company rules may differ).",
    sourceUrl: `${PWC}/sweden/corporate/taxes-on-corporate-income`,
  },
  DK: {
    label: "Denmark", corp: 0.22, dividend: 0.42,
    basis: "22% CIT; 42% top share-income rate on the dividend (27% below the threshold).",
    sourceUrl: `${PWC}/denmark/corporate/taxes-on-corporate-income`,
  },
  PT: {
    label: "Portugal", corp: 0.19, dividend: 0.28,
    basis: "19% CIT; 28% flat rate on dividends.",
    sourceUrl: `${PWC}/portugal/corporate/taxes-on-corporate-income`,
  },
  PL: {
    label: "Poland", corp: 0.19, dividend: 0.19,
    basis: "19% CIT; 19% flat tax on dividends.",
    sourceUrl: `${PWC}/poland/corporate/taxes-on-corporate-income`,
  },
  GR: {
    label: "Greece", corp: 0.22, dividend: 0.05,
    basis: "22% CIT; 5% withholding on dividends.",
    sourceUrl: `${PWC}/greece/corporate/taxes-on-corporate-income`,
  },
  US: {
    label: "United States", corp: 0.21, dividend: 0.238,
    basis: "21% federal CIT (state tax extra); 20% qualified-dividend rate + 3.8% net investment income tax.",
    sourceUrl: `${PWC}/united-states/corporate/taxes-on-corporate-income`,
  },
  AE: {
    label: "UAE", corp: 0.09, dividend: 0,
    basis: "9% CIT above AED 375k; no personal tax on dividends.",
    sourceUrl: `${PWC}/united-arab-emirates/corporate/taxes-on-corporate-income`,
  },
};

export const DEFAULT_COMPARE = "DE";

/* Cyprus engine constants (2026 rules) */
export const CY_CORPORATE_RATE = 0.15;
export const CY_IP_BOX_EFFECTIVE_RATE = 0.025; // 2.5% effective on qualifying IP under the 80% deemed deduction
export const CY_GESY_RATE = 0.0265;
export const CY_GESY_CAP = 180_000; // max GESY contribution = €4,770/yr
