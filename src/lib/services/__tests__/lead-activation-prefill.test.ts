import { describe, it, expect } from "vitest";
import { leadServicesToPlatformKeys, draftFromLead } from "@/lib/services/lead-activation";

describe("leadServicesToPlatformKeys", () => {
  it("maps marketing keys and booking titles to platform service lines, deduplicated", () => {
    const keys = leadServicesToPlatformKeys({
      serviceKey: "company-formation",
      meta: { services: "Company Formation, Tax Residency and Non-Dom, International Companies and Licensing, Not sure yet" },
    });
    expect(keys).toEqual(["company_formation", "tax_residency", "licensing"]);
  });
  it("accepts a platform key directly and ignores unknowns", () => {
    expect(leadServicesToPlatformKeys({ serviceKey: "banking", meta: null })).toEqual(["banking"]);
    expect(leadServicesToPlatformKeys({ serviceKey: "not_sure", meta: { services: "Not sure yet — I'd like guidance" } })).toEqual([]);
  });
});

describe("draftFromLead", () => {
  it("pre-fills identity and intent fields from the booking answers", () => {
    const draft = draftFromLead({
      name: "Jonathan A. Meyer",
      meta: { nationality: "Ireland, Switzerland", country: "Switzerland", timeline: "Within 3 months", heardFrom: "LinkedIn", relocate: "Yes, myself or my family" },
    });
    expect(draft).toEqual({
      fullLegalName: "Jonathan A. Meyer",
      nationality: "Ireland",
      residenceCountry: "Switzerland",
      currentTaxResidency: "Switzerland",
      timeline: "1_to_3_months",
      source: "social",
      permitType: "pr",
    });
  });
  it("never invents values", () => {
    expect(draftFromLead({ name: null, meta: null })).toEqual({});
  });
});
