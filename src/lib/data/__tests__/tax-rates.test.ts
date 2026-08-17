import { describe, expect, it } from "vitest";
import { DEFAULT_TOOL_SETTINGS, incomeTax, nextDue } from "../tax-rates";

describe("incomeTax (2026 bands)", () => {
  const bands = DEFAULT_TOOL_SETTINGS.incomeTaxBands;

  it("charges nothing up to the nil band", () => {
    expect(incomeTax(22_000, bands).total).toBe(0);
  });

  it("applies the bands progressively", () => {
    // 22k nil, 10k @20% = 2,000, 10k @25% = 2,500, 3k @30% = 900 → 5,400 on €45,000
    const { total, rows } = incomeTax(45_000, bands);
    expect(total).toBeCloseTo(5_400, 6);
    expect(rows[1]).toMatchObject({ from: 22_000, to: 32_000, amount: 10_000, tax: 2_000 });
    expect(rows[4].amount).toBe(0); // nothing reaches the 35% band
  });

  it("taxes everything above the top threshold at the top rate", () => {
    // Up to 72k: 0 + 2,000 + 2,500 + 9,000 = 13,500; then 28k @35% = 9,800
    expect(incomeTax(100_000, bands).total).toBeCloseTo(23_300, 6);
  });
});

describe("nextDue", () => {
  const today = new Date(2026, 7, 17); // 17 Aug 2026 (local time)
  const entry = (rule: "end-of-following-month" | "day-of-following-month" | "quarter-second-month" | "fixed", extra: Partial<Parameters<typeof nextDue>[0]> = {}) =>
    ({ id: "x", title: "x", applies: ["companies" as const], frequency: "monthly" as const, rule, detail: "", ...extra });

  it("monthly filings fall on the last day of the current month", () => {
    const d = nextDue(entry("end-of-following-month"), today)!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 7, 31]);
  });

  it("day-of-following-month rolls into next month once passed", () => {
    const d = nextDue(entry("day-of-following-month", { day: 15 }), today)!;
    expect([d.getMonth(), d.getDate()]).toEqual([8, 15]); // 15 Sep
  });

  it("quarterly VAT is due on the 10th of the second month after quarter end", () => {
    const d = nextDue(entry("quarter-second-month", { day: 10 }), today)!;
    // Q3 ends 30 Sep → due 10 Nov 2026
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 10]);
  });

  it("fixed dates parse as given", () => {
    const d = nextDue(entry("fixed", { date: "2026-07-31" }), today)!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 6, 31]);
  });
});
