import { describe, expect, it } from "vitest";
import { computeLeadFlags } from "../leads";

describe("computeLeadFlags", () => {
  it("flags the immigration route for non-EU citizens who want to relocate", () => {
    const { flags } = computeLeadFlags({
      meta: { nationality: "India", relocate: "Yes, myself or my family" },
    });
    expect(flags).toContain("Immigration route required");
  });

  it("does not flag immigration for EU/EEA/UK citizens", () => {
    for (const nationality of ["Germany", "United Kingdom", "Norway, France"]) {
      const { flags } = computeLeadFlags({
        meta: { nationality, relocate: "Yes, myself and my team or company" },
      });
      expect(flags).not.toContain("Immigration route required");
    }
  });

  it("does not flag immigration when not relocating", () => {
    const { flags } = computeLeadFlags({
      meta: { nationality: "India", relocate: "No, company or structure only" },
    });
    expect(flags).not.toContain("Immigration route required");
  });

  it("flags PR-by-investment for PR or maybe property answers and marks high value", () => {
    for (const property of ["Yes, for permanent residency", "Maybe, tell me my options"]) {
      const res = computeLeadFlags({ meta: { property } });
      expect(res.flags).toContain("PR by investment opportunity");
      expect(res.highValue).toBe(true);
    }
    const res = computeLeadFlags({ meta: { property: "Yes, as an investment or a home" } });
    expect(res.flags).not.toContain("PR by investment opportunity");
  });

  it("flags licensing leads as high value via serviceKey or the services list", () => {
    expect(computeLeadFlags({ serviceKey: "licensing" }).highValue).toBe(true);
    const viaList = computeLeadFlags({
      meta: { services: "Banking, Licensing (forex, crypto, EMI, iGaming)" },
    });
    expect(viaList.flags).toContain("High value licensing lead");
    expect(viaList.highValue).toBe(true);
  });

  it("returns no flags for a plain EU company-only lead", () => {
    const res = computeLeadFlags({
      serviceKey: "company_formation",
      meta: { nationality: "Germany", relocate: "No, company or structure only", property: "No" },
    });
    expect(res.flags).toEqual([]);
    expect(res.highValue).toBe(false);
  });
});
