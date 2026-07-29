import { describe, expect, it } from "vitest";
import { slotIsFree, type BusyInterval } from "../calendar-busy";

const busy = (s: string, e: string): BusyInterval => ({ start: new Date(s), end: new Date(e) });

describe("slotIsFree", () => {
  const meeting = [busy("2026-08-03T07:00:00Z", "2026-08-03T08:00:00Z")];

  it("blocks a slot fully inside a busy interval", () => {
    expect(slotIsFree(new Date("2026-08-03T07:00:00Z"), 30, meeting)).toBe(false);
    expect(slotIsFree(new Date("2026-08-03T07:30:00Z"), 30, meeting)).toBe(false);
  });

  it("blocks a slot that partially overlaps the busy interval", () => {
    expect(slotIsFree(new Date("2026-08-03T06:45:00Z"), 30, meeting)).toBe(false);
    expect(slotIsFree(new Date("2026-08-03T07:45:00Z"), 30, meeting)).toBe(false);
  });

  it("allows slots that touch the interval boundaries (half-open)", () => {
    expect(slotIsFree(new Date("2026-08-03T06:30:00Z"), 30, meeting)).toBe(true);
    expect(slotIsFree(new Date("2026-08-03T08:00:00Z"), 30, meeting)).toBe(true);
  });

  it("allows anything when there are no busy intervals", () => {
    expect(slotIsFree(new Date("2026-08-03T07:00:00Z"), 30, [])).toBe(true);
  });

  it("checks against every interval in the union", () => {
    const two = [...meeting, busy("2026-08-03T11:00:00Z", "2026-08-03T11:30:00Z")];
    expect(slotIsFree(new Date("2026-08-03T11:00:00Z"), 30, two)).toBe(false);
    expect(slotIsFree(new Date("2026-08-03T09:00:00Z"), 30, two)).toBe(true);
  });
});
