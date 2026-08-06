import { describe, expect, it } from "vitest";
import { expandRanges, parseRange } from "../settings";

describe("expandRanges", () => {
  it("expands a nine-to-six day at 30 minutes into 18 slots", () => {
    const slots = expandRanges([{ start: "09:00", end: "18:00" }], 30, 30);
    expect(slots).toHaveLength(18);
    expect(slots[0]).toBe("09:00");
    expect(slots.at(-1)).toBe("17:30"); // a slot must START before the window ends
  });

  it("keeps a lunch gap when two windows are given", () => {
    expect(expandRanges([{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }], 60))
      .toEqual(["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]);
  });

  it("handles intervals that do not divide the window evenly", () => {
    expect(expandRanges([{ start: "09:00", end: "10:00" }], 45)).toEqual(["09:00", "09:45"]);
  });

  it("yields nothing when the window is too short to hold one consultation", () => {
    expect(expandRanges([{ start: "09:00", end: "09:20" }], 30, 30)).toEqual([]);
  });

  it("never offers a slot whose consultation would overrun the window", () => {
    // 60-minute calls in a 09:00–11:30 window: 10:30 would end at 11:30, 11:00 would not.
    expect(expandRanges([{ start: "09:00", end: "11:30" }], 30, 60))
      .toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("dedupes and orders overlapping windows", () => {
    expect(expandRanges([{ start: "10:00", end: "11:00" }, { start: "09:00", end: "10:30" }], 30))
      .toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });
});

describe("parseRange", () => {
  it("accepts a well-formed window", () => {
    expect(parseRange("09:00-17:30")).toEqual({ start: "09:00", end: "17:30" });
  });

  it("rejects an inverted or malformed window", () => {
    expect(parseRange("17:00-09:00")).toBeNull();
    expect(parseRange("09:00")).toBeNull();
    expect(parseRange("25:00-26:00")).toBeNull();
  });
});
