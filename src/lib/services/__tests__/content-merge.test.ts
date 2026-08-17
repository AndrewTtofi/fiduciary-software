import { describe, expect, it } from "vitest";
import { CONTENT_VERSION, DEFAULT_CONTENT, mergeContent } from "../content";

describe("mergeContent", () => {
  it("ignores a stored blob from an older content version (reviewed defaults win)", () => {
    const stale = { hero: { lead: "old lead" }, contact: { phone: "+357 22 037 063" }, stats: [{ v: "8", l: "old" }] };
    const out = mergeContent(stale as never);
    expect(out.hero.lead).toBe(DEFAULT_CONTENT.hero.lead);
    expect(out.contact.phone).toBe(DEFAULT_CONTENT.contact.phone);
    expect(out.stats).toEqual(DEFAULT_CONTENT.stats);
  });

  it("honours a stored blob stamped with the current version, per field", () => {
    const stored = { _v: CONTENT_VERSION, hero: { lead: "edited lead" }, contact: { hours: "Mon–Fri 9–5" } };
    const out = mergeContent(stored as never);
    expect(out.hero.lead).toBe("edited lead");
    expect(out.hero.display).toBe(DEFAULT_CONTENT.hero.display); // untouched fields keep the default
    expect(out.contact.hours).toBe("Mon–Fri 9–5");
    expect(out.contact.phone).toBe(DEFAULT_CONTENT.contact.phone);
  });
});
