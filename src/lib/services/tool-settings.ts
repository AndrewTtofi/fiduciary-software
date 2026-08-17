import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULT_TOOL_SETTINGS, type CalendarEntry, type ToolSettings } from "@/lib/data/tax-rates";

/* =====================================================================
   Effective tool settings: the admin's stored overrides merged over the
   code defaults (lib/data/tax-rates.ts). Every public calculator reads its
   rates through here, so a January rate change is an admin edit, not a
   deploy. Objects merge per field; arrays (bands, VAT rates, calendar)
   replace wholesale when stored, so an editor can add or drop a row.
   ===================================================================== */

function merge(stored: Partial<ToolSettings> | null | undefined): ToolSettings {
  const s = stored ?? {};
  const d = DEFAULT_TOOL_SETTINGS;
  const arr = <T,>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
  return {
    taxYear: typeof s.taxYear === "number" ? s.taxYear : d.taxYear,
    correctAsAt: typeof s.correctAsAt === "string" && s.correctAsAt ? s.correctAsAt : d.correctAsAt,
    incomeTaxBands: arr(s.incomeTaxBands, d.incomeTaxBands),
    socialInsurance: { ...d.socialInsurance, ...(s.socialInsurance ?? {}) },
    gesy: { ...d.gesy, ...(s.gesy ?? {}) },
    employerFunds: { ...d.employerFunds, ...(s.employerFunds ?? {}) },
    corporateTax: typeof s.corporateTax === "number" ? s.corporateTax : d.corporateTax,
    vatRates: arr(s.vatRates, d.vatRates),
    nonDomYears: typeof s.nonDomYears === "number" ? s.nonDomYears : d.nonDomYears,
    ipBoxExemption: typeof s.ipBoxExemption === "number" ? s.ipBoxExemption : d.ipBoxExemption,
    digitalNomad: { ...d.digitalNomad, ...(s.digitalNomad ?? {}) },
    permanentResidencyProperty:
      typeof s.permanentResidencyProperty === "number" ? s.permanentResidencyProperty : d.permanentResidencyProperty,
    calendar: arr<CalendarEntry>(s.calendar, d.calendar),
  };
}

/** Effective tool settings, cached per request. Falls back to the code
 *  defaults if the table is empty or unreachable — the tools must render. */
export const getToolSettings = cache(async (): Promise<ToolSettings> => {
  try {
    const row = await prisma.toolSettings.findUnique({ where: { id: "singleton" } });
    return merge(row?.data as Partial<ToolSettings> | undefined);
  } catch {
    return merge(null);
  }
});

/** Human "correct as at" label, e.g. "1 January 2026". */
export function correctAsAtLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
