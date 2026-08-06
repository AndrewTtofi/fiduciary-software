/* =====================================================================
   Consultation scheduling — pure helpers.

   Deliberately free of any database import: the admin editor is a client
   component, and pulling these from settings.ts dragged Prisma (and with it
   the pg driver) into the browser bundle.
   ===================================================================== */

export type TimeRange = { start: string; end: string };

export type ConsultationHours = {
  /** Weekdays offered, 0 = Sunday … 6 = Saturday. */
  days: number[];
  /** Working windows on the firm's own wall clock. Two windows give the usual
   *  lunch gap; slots are generated inside them. */
  ranges: TimeRange[];
  /** How often a slot starts inside a window, in minutes. */
  intervalMins: number;
  /** Generated start times, "HH:MM". Derived from `ranges` × `intervalMins` —
   *  a nine-to-six day at 30 minutes is 18 of them, which is not something
   *  anyone should type by hand. */
  times: string[];
  /** Consultation length in minutes. */
  minutes: number;
  /** Minimum warning before a consultation can start, in minutes. */
  noticeMins: number;
  /** How many calendar days ahead the picker opens. */
  horizonDays: number;
  /** IANA zone the times are anchored to. */
  timezone: string;
};

export const DEFAULT_RANGES: TimeRange[] = [
  { start: "09:00", end: "12:00" },
  { start: "14:00", end: "17:00" },
];

export const DEFAULT_CONSULTATION_HOURS: ConsultationHours = {
  days: [1, 2, 3, 4, 5],
  ranges: DEFAULT_RANGES,
  intervalMins: 60,
  times: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  minutes: 30,
  noticeMins: 60,
  horizonDays: 14,
  timezone: "Europe/Nicosia",
};

/** "HH:MM" → minutes past midnight, or null when malformed. */
export function parseHhMm(v: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** "HH:MM-HH:MM" → a range, or null when malformed or inverted. */
export function parseRange(v: string): TimeRange | null {
  const [a, b] = String(v).split("-");
  if (!a || !b) return null;
  const start = parseHhMm(a);
  const end = parseHhMm(b);
  if (start === null || end === null || end <= start) return null;
  return { start: a.trim(), end: b.trim() };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toHhMm = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/** Every slot start inside the windows, spaced by `intervalMins`.
 *  The whole consultation has to fit: 09:00–18:00 at 30-minute spacing with
 *  30-minute calls gives 18 starts, 09:00 through 17:30, and a window too
 *  short to hold one call yields nothing rather than a slot that overruns.
 *  Exported for tests. */
export function expandRanges(ranges: TimeRange[], intervalMins: number, durationMins = 0): string[] {
  if (intervalMins <= 0) return [];
  const out = new Set<string>();
  for (const r of ranges) {
    const from = parseHhMm(r.start);
    const to = parseHhMm(r.end);
    if (from === null || to === null || to <= from) continue;
    const lastStart = to - Math.max(durationMins, 1);
    for (let m = from; m <= lastStart; m += intervalMins) out.add(toHhMm(m));
  }
  return [...out].sort((a, b) => (parseHhMm(a) ?? 0) - (parseHhMm(b) ?? 0));
}

/** A zone the runtime actually knows — an invalid one would throw inside
 *  Intl.DateTimeFormat on every slot calculation. */
export function isValidTimeZone(tz: string | null | undefined): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
