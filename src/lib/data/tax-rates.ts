/* =====================================================================
   Cyprus tax rates and filing calendar — the single editable rates table
   that drives every public tool (Tools spec, "Reference data").

   These are the CODE DEFAULTS. The effective values are the stored admin
   overrides (ToolSettings singleton) merged over them — see
   lib/services/tool-settings.ts. Nothing in the tool pages reads a rate from
   anywhere but that merged object, so the firm can roll figures forward each
   January without a developer.

   Every figure below is 2026 unless marked. Items the spec marks CONFIRM
   are called out with `confirm` notes that surface in the admin editor.
   Rates are decimals (0.088 = 8.8%); money is euro.
   ===================================================================== */

export type TaxBand = {
  /** Upper bound of the band (inclusive), or null for the top band. */
  upTo: number | null;
  rate: number;
};

export type CalendarEntry = {
  id: string;
  title: string;
  /** Who it applies to — the calendar's filter. */
  applies: ("individuals" | "companies" | "employers")[];
  frequency: "monthly" | "quarterly" | "annual";
  /** How the next due date is derived:
   *  - "end-of-following-month": due by the last day of the month after the period
   *  - "day-of-following-month": due by `day` of the month after the period
   *  - "quarter-second-month": due by `day` of the second month after quarter end
   *  - "fixed": due on the ISO `date` (rolled forward by the admin each year) */
  rule: "end-of-following-month" | "day-of-following-month" | "quarter-second-month" | "fixed";
  day?: number;
  date?: string; // YYYY-MM-DD, for `fixed`
  detail: string;
  /** True while the exact 2026 date still needs confirming against the Tax
   *  Department schedule. Shown to staff in the admin, never to visitors. */
  confirm?: boolean;
};

export type ToolSettings = {
  /** Tax year the figures describe. */
  taxYear: number;
  /** Shown as "correct as at" on every tool. ISO date. */
  correctAsAt: string;
  incomeTaxBands: TaxBand[];
  socialInsurance: {
    employee: number;
    employer: number;
    selfEmployed: number;
    /** Insurable earnings ceiling per year (CONFIRM — updated annually). */
    ceiling: number;
  };
  gesy: {
    employee: number;
    employer: number;
    selfEmployed: number;
    /** Dividends, rents and interest. */
    passive: number;
    /** Income cap per year the contribution is charged on. */
    cap: number;
  };
  employerFunds: {
    socialCohesion: number;
    redundancy: number;
    hrda: number;
  };
  corporateTax: number;
  vatRates: number[];
  /** Years Non-Dom status lasts. */
  nonDomYears: number;
  /** IP Box: share of qualifying profit exempt. */
  ipBoxExemption: number;
  /** Digital Nomad Visa thresholds — CONFIRM before the permit tool relies on
   *  them; null means "not stated on the site". */
  digitalNomad: { minMonthlyIncome: number | null; capOnPlaces: number | null };
  /** Permanent residency property route threshold (Regulation 6(2)). */
  permanentResidencyProperty: number;
  calendar: CalendarEntry[];
};

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  taxYear: 2026,
  correctAsAt: "2026-01-01",
  incomeTaxBands: [
    { upTo: 22_000, rate: 0 },
    { upTo: 32_000, rate: 0.2 },
    { upTo: 42_000, rate: 0.25 },
    { upTo: 72_000, rate: 0.3 },
    { upTo: null, rate: 0.35 },
  ],
  socialInsurance: { employee: 0.088, employer: 0.088, selfEmployed: 0.166, ceiling: 68_904 },
  gesy: { employee: 0.0265, employer: 0.029, selfEmployed: 0.04, passive: 0.0265, cap: 180_000 },
  employerFunds: { socialCohesion: 0.02, redundancy: 0.012, hrda: 0.005 },
  corporateTax: 0.15,
  vatRates: [0.19, 0.09, 0.05, 0],
  nonDomYears: 17,
  ipBoxExemption: 0.8,
  digitalNomad: { minMonthlyIncome: null, capOnPlaces: null },
  permanentResidencyProperty: 300_000,
  calendar: [
    {
      id: "paye",
      title: "Employer PAYE, social insurance and GESY contributions",
      applies: ["employers"],
      frequency: "monthly",
      rule: "end-of-following-month",
      detail: "Tax withheld from salaries and the employer and employee contributions for the month, due by the end of the following month.",
    },
    {
      id: "vies",
      title: "VIES return",
      applies: ["companies"],
      frequency: "monthly",
      rule: "day-of-following-month",
      day: 15,
      detail: "For companies making intra-EU supplies of goods or services. Due by the 15th of the month following the reporting month.",
    },
    {
      id: "vat",
      title: "VAT return and payment",
      applies: ["companies", "individuals"],
      frequency: "quarterly",
      rule: "quarter-second-month",
      day: 10,
      detail: "Quarterly VAT return and payment of any VAT due, by the 10th of the second month after the end of the quarter.",
    },
    {
      id: "ir1",
      title: "Personal income tax return (IR1 / TD1)",
      applies: ["individuals"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-07-31",
      detail: "Individual income tax return for the previous year, filed electronically.",
      confirm: true,
    },
    {
      id: "ir7",
      title: "Employer's return (IR7 / TD7)",
      applies: ["employers"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-05-31",
      detail: "Annual employer's return summarising salaries paid and tax withheld in the previous year.",
      confirm: true,
    },
    {
      id: "ir4",
      title: "Corporate income tax return (IR4 / TD4)",
      applies: ["companies"],
      frequency: "annual",
      rule: "fixed",
      date: "2027-03-31",
      detail: "Corporate income tax return for the 2025 tax year, due fifteen months after the year end.",
      confirm: true,
    },
    {
      id: "temp-tax-1",
      title: "Temporary tax assessment — first instalment",
      applies: ["companies", "individuals"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-07-31",
      detail: "Estimate of the current year's taxable income and payment of the first of two instalments.",
      confirm: true,
    },
    {
      id: "temp-tax-2",
      title: "Temporary tax assessment — second instalment (and revision)",
      applies: ["companies", "individuals"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-12-31",
      detail: "Second instalment of the temporary tax, with the option to revise the estimate.",
      confirm: true,
    },
    {
      id: "he32",
      title: "Annual return (HE32) to the Registrar of Companies",
      applies: ["companies"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-12-31",
      detail: "Filed within 28 days of the company's annual return date, with the previous year's financial statements attached. Your company's own date depends on its incorporation.",
      confirm: true,
    },
    {
      id: "registrar-other",
      title: "Other Registrar obligations (UBO register annual confirmation)",
      applies: ["companies"],
      frequency: "annual",
      rule: "fixed",
      date: "2026-12-31",
      detail: "Annual confirmation of the beneficial ownership details on the Registrar's UBO register. The former annual company levy was abolished in 2024.",
      confirm: true,
    },
  ],
};

/* ── pure calculation helpers (shared by the tool pages) ─────────────── */

/** 0.0265 → "2.65%", 0.088 → "8.8%", 0.15 → "15%". */
export const fmtPct = (r: number): string => `${Math.round(r * 10000) / 100}%`;

/** Progressive income tax over `bands`. Returns the total and the per-band
 *  breakdown (amount of income falling in each band and the tax on it). */
export function incomeTax(income: number, bands: TaxBand[]): { total: number; rows: { from: number; to: number | null; rate: number; amount: number; tax: number }[] } {
  let lower = 0;
  let total = 0;
  const rows = bands.map((b) => {
    const upper = b.upTo ?? Infinity;
    const amount = Math.max(0, Math.min(income, upper) - lower);
    const tax = amount * b.rate;
    total += tax;
    const row = { from: lower, to: b.upTo, rate: b.rate, amount, tax };
    lower = upper;
    return row;
  });
  return { total, rows };
}

/** Next due date for a calendar entry, from `today`. */
export function nextDue(entry: CalendarEntry, today: Date): Date | null {
  const y = today.getFullYear();
  const m = today.getMonth();
  const endOfMonth = (yy: number, mm: number) => new Date(yy, mm + 1, 0);
  switch (entry.rule) {
    case "end-of-following-month": {
      // Period = previous month; due end of this month. If passed, next month end.
      const d = endOfMonth(y, m);
      return d >= today ? d : endOfMonth(y, m + 1);
    }
    case "day-of-following-month": {
      const d = new Date(y, m, entry.day ?? 15);
      return d >= today ? d : new Date(y, m + 1, entry.day ?? 15);
    }
    case "quarter-second-month": {
      // Quarter ends Mar/Jun/Sep/Dec; due `day` of the second month after.
      for (let k = 0; k < 6; k++) {
        const qEndMonth = Math.floor((m + k) / 3) * 3 + 2; // 2,5,8,11
        const d = new Date(y, qEndMonth + 2, entry.day ?? 10);
        if (d >= today) return d;
      }
      return null;
    }
    case "fixed": {
      if (!entry.date) return null;
      const [yy, mm, dd] = entry.date.split("-").map(Number);
      return new Date(yy, (mm ?? 1) - 1, dd ?? 1);
    }
  }
}
