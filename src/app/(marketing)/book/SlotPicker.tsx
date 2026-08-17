"use client";

import { useEffect, useMemo, useState } from "react";

/** Day key (YYYY-MM-DD) of an instant in a given time zone. */
function dayKeyIn(tz: string, iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(iso));
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Calendly-style slot picker: month calendar on the left (days with
 *  availability enabled), the selected day's 30-minute slots on the right —
 *  everything rendered in the visitor's own time zone, with a selector.
 *  Availability is refetched on mount (freshness) and whenever `reloadToken`
 *  changes (after a SLOT_TAKEN conflict). */
export function SlotPicker({
  initialSlots,
  value,
  onChange,
  tz,
  onTzChange,
  reloadToken,
}: {
  initialSlots: string[];
  value: string | null;
  onChange: (iso: string | null) => void;
  tz: string;
  onTzChange: (tz: string) => void;
  reloadToken: number;
}) {
  const [slots, setSlots] = useState<string[]>(initialSlots);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bookings/public-slots")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { slots?: string[] } | null) => {
        if (!cancelled && j?.slots) setSlots(j.slots);
      })
      .catch(() => {/* keep server-rendered slots */});
    return () => { cancelled = true; };
  }, [reloadToken]);

  const timezones = useMemo<string[]>(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [tz];
    }
  }, [tz]);

  // Slots grouped by visitor-tz day.
  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of [...slots].sort()) {
      const key = dayKeyIn(tz, iso);
      map.set(key, [...(map.get(key) ?? []), iso]);
    }
    return map;
  }, [slots, tz]);

  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay]);
  const activeDay = selectedDay && byDay.has(selectedDay) ? selectedDay : dayKeys[0] ?? null;

  // Month grid cursor, bounded to months that contain availability.
  const firstKey = dayKeys[0];
  const lastKey = dayKeys[dayKeys.length - 1];
  const bounds = useMemo(() => {
    if (!firstKey || !lastKey) return null;
    const [fy, fm] = firstKey.split("-").map(Number);
    const [ly, lm] = lastKey.split("-").map(Number);
    return { min: fy * 12 + (fm - 1), max: ly * 12 + (lm - 1) };
  }, [firstKey, lastKey]);
  const shown = useMemo(
    () => cursor ?? (firstKey
      ? { y: Number(firstKey.slice(0, 4)), m: Number(firstKey.slice(5, 7)) - 1 }
      : null),
    [cursor, firstKey],
  );
  const shownIdx = shown ? shown.y * 12 + shown.m : 0;

  function shiftMonth(delta: number) {
    if (!shown || !bounds) return;
    const next = Math.min(Math.max(shownIdx + delta, bounds.min), bounds.max);
    setCursor({ y: Math.floor(next / 12), m: next % 12 });
  }

  // Monday-first month grid of { key, day } cells (null = leading blank).
  const cells = useMemo(() => {
    if (!shown) return [];
    const daysInMonth = new Date(Date.UTC(shown.y, shown.m + 1, 0)).getUTCDate();
    const lead = (new Date(Date.UTC(shown.y, shown.m, 1)).getUTCDay() + 6) % 7;
    const out: ({ key: string; day: number } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ key: `${shown.y}-${String(shown.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
    }
    return out;
  }, [shown]);

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }),
    [tz],
  );
  // Formats the literal calendar date of a day key (already tz-resolved).
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    [],
  );

  if (dayKeys.length === 0) {
    return <p className="charcount" style={{ textAlign: "left" }}>No slots are open right now — submit without a slot and we will offer times by email.</p>;
  }

  return (
    <div>
      <div className="slotcal">
        <div className="slotcal-cal">
          <div className="slotcal-head">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={!bounds || shownIdx <= bounds.min} aria-label="Previous month">‹</button>
            <span>{shown ? monthLabel(shown.y, shown.m) : ""}</span>
            <button type="button" onClick={() => shiftMonth(1)} disabled={!bounds || shownIdx >= bounds.max} aria-label="Next month">›</button>
          </div>
          <div className="slotcal-grid" role="grid">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <span key={d} className="slotcal-dow">{d}</span>
            ))}
            {cells.map((c, i) =>
              c === null ? (
                <span key={`b${i}`} />
              ) : (
                <button
                  key={c.key}
                  type="button"
                  className={`slotcal-day${byDay.has(c.key) ? " avail" : ""}${activeDay === c.key ? " sel" : ""}`}
                  disabled={!byDay.has(c.key)}
                  onClick={() => { setSelectedDay(c.key); onChange(null); }}
                >
                  {c.day}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="slotcal-times">
          <div className="slotcal-daylabel">
            {activeDay ? dayFmt.format(new Date(`${activeDay}T12:00:00Z`)) : ""}
          </div>
          <div className="slotcal-list">
            {(activeDay ? byDay.get(activeDay) ?? [] : []).map((iso) => (
              <button
                key={iso}
                type="button"
                className={`slot-b${value === iso ? " sel" : ""}`}
                onClick={() => onChange(iso)}
              >
                {timeFmt.format(new Date(iso))}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="slotcal-tz">
        <label htmlFor="cf-tz">Time zone</label>
        <select id="cf-tz" value={tz} onChange={(e) => onTzChange(e.target.value)}>
          {timezones.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
