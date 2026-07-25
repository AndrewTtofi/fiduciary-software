/* Country-comparison figures for the effective-tax-rate calculator.
   Each rate is the headline effective TOTAL tax on the same fully
   distributed profit scenario the Cyprus engine models.

   PLACEHOLDERS pending the confirmed per-country model from the firm —
   kept in config, not component code, so they can be updated without
   touching calculator logic. The Germany figure aligns with the firm's
   published article ("more than 48%"). */

export type CompareCountry = { label: string; rate: number };

export const COMPARE_COUNTRIES: Record<string, CompareCountry> = {
  DE: { label: "Germany", rate: 0.48 },
  GB: { label: "United Kingdom", rate: 0.45 },
  IT: { label: "Italy", rate: 0.47 },
  US: { label: "United States", rate: 0.45 },
  // Next (figures pending): AE (UAE), AU (Australia)
};

export const DEFAULT_COMPARE = "DE";

/* Cyprus engine constants (2026 rules) */
export const CY_CORPORATE_RATE = 0.15;
export const CY_IP_BOX_EFFECTIVE_RATE = 0.025; // 2.5% effective on qualifying IP under the 80% deemed deduction
export const CY_GESY_RATE = 0.0265;
export const CY_GESY_CAP = 180_000; // max GESY contribution = €4,770/yr
