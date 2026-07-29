import { describe, expect, it } from "vitest";
import { isOnSlotGrid } from "../booking";

// Monday 2026-08-03, 03:00 UTC — Cyprus is EEST (UTC+3) in August, so the
// 09:00 Cyprus slot that day is 06:00 UTC.
const NOW = new Date("2026-08-03T03:00:00Z");

describe("isOnSlotGrid", () => {
  it("accepts a working-hour Cyprus slot inside the horizon", () => {
    expect(isOnSlotGrid(new Date("2026-08-03T06:00:00Z"), NOW)).toBe(true); // Mon 09:00 Cyprus
    expect(isOnSlotGrid(new Date("2026-08-04T13:00:00Z"), NOW)).toBe(true); // Tue 16:00 Cyprus
  });

  it("rejects instants off the grid", () => {
    expect(isOnSlotGrid(new Date("2026-08-03T06:15:00Z"), NOW)).toBe(false); // not a slot start
    expect(isOnSlotGrid(new Date("2026-08-03T09:00:00Z"), NOW)).toBe(false); // 12:00 Cyprus — lunch gap
  });

  it("rejects weekends and slots outside the 14-day horizon", () => {
    expect(isOnSlotGrid(new Date("2026-08-08T06:00:00Z"), NOW)).toBe(false); // Saturday
    expect(isOnSlotGrid(new Date("2026-09-01T06:00:00Z"), NOW)).toBe(false); // past horizon
  });

  it("enforces the minimum notice", () => {
    const lateNow = new Date("2026-08-03T05:30:00Z"); // 30 min before the 09:00 Cyprus slot
    expect(isOnSlotGrid(new Date("2026-08-03T06:00:00Z"), lateNow)).toBe(false);
    expect(isOnSlotGrid(new Date("2026-08-03T07:00:00Z"), lateNow)).toBe(true); // 10:00 Cyprus, 90 min away
  });
});
