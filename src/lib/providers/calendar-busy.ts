import { env, features } from "@/lib/env";

/** A half-open busy window [start, end) on a staff calendar. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface CalendarEventArgs {
  summary: string;
  description: string;
  start: Date;
  durationMinutes: number;
  attendeeEmail: string;
  attendeeName: string;
}

export interface BusySource {
  /** Busy intervals across the configured staff calendars for the range.
   *  Recurring events are expanded by the calendar service itself. */
  getBusy(rangeStart: Date, rangeEnd: Date): Promise<BusyInterval[]>;
  /** Write a booking into the staff calendar; returns the external event id. */
  createEvent(args: CalendarEventArgs): Promise<string>;
}

/** True when a slot of `durationMinutes` starting at `start` does not overlap
 *  any busy interval. Exported for the slot generators and unit tests. */
export function slotIsFree(start: Date, durationMinutes: number, busy: BusyInterval[]): boolean {
  const end = start.getTime() + durationMinutes * 60_000;
  return !busy.some((b) => b.start.getTime() < end && b.end.getTime() > start.getTime());
}

/* ── Google Calendar (freebusy, OAuth refresh token) ────────────────── */

class GoogleBusySource implements BusySource {
  private accessToken: { token: string; expiresAt: number } | undefined;

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.token;
    }
    const e = env();
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: e.GOOGLE_CLIENT_ID!,
        client_secret: e.GOOGLE_CLIENT_SECRET!,
        refresh_token: e.GOOGLE_CALENDAR_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`google token exchange failed: ${res.status}`);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return this.accessToken.token;
  }

  async getBusy(rangeStart: Date, rangeEnd: Date): Promise<BusyInterval[]> {
    const ids = (env().GOOGLE_CALENDAR_IDS ?? "primary").split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${await this.token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
        items: ids.map((id) => ({ id })),
      }),
    });
    if (!res.ok) throw new Error(`google freebusy failed: ${res.status}`);
    const body = (await res.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    };
    const out: BusyInterval[] = [];
    for (const cal of Object.values(body.calendars ?? {})) {
      for (const b of cal.busy ?? []) out.push({ start: new Date(b.start), end: new Date(b.end) });
    }
    return out;
  }

  async createEvent(args: CalendarEventArgs): Promise<string> {
    // Booked into the first configured calendar (the firm's booking calendar).
    // Needs the read/write calendar.events scope on the refresh token.
    const calendarId = (env().GOOGLE_CALENDAR_IDS ?? "primary").split(",")[0].trim() || "primary";
    const end = new Date(args.start.getTime() + args.durationMinutes * 60_000);
    // sendUpdates=none: the platform sends its own confirmation + .ics — the
    // calendar service must not double-email the visitor.
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${await this.token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: args.summary,
          description: args.description,
          start: { dateTime: args.start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: [{ email: args.attendeeEmail, displayName: args.attendeeName }],
        }),
      },
    );
    if (!res.ok) throw new Error(`google event insert failed: ${res.status}`);
    const body = (await res.json()) as { id: string };
    return body.id;
  }
}

/* ── Outlook / Microsoft 365 (Graph getSchedule, client credentials) ── */

class OutlookBusySource implements BusySource {
  private accessToken: { token: string; expiresAt: number } | undefined;

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.token;
    }
    const e = env();
    const res = await fetch(`https://login.microsoftonline.com/${e.MS_TENANT_ID}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: e.MS_CLIENT_ID!,
        client_secret: e.MS_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });
    if (!res.ok) throw new Error(`graph token exchange failed: ${res.status}`);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return this.accessToken.token;
  }

  async getBusy(rangeStart: Date, rangeEnd: Date): Promise<BusyInterval[]> {
    const users = (env().MS_CALENDAR_USERS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (users.length === 0) return [];
    // One getSchedule call resolves every mailbox; the first user hosts it.
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(users[0])}/calendar/getSchedule`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await this.token()}`,
          "Content-Type": "application/json",
          Prefer: 'outlook.timezone="UTC"',
        },
        body: JSON.stringify({
          schedules: users,
          startTime: { dateTime: rangeStart.toISOString(), timeZone: "UTC" },
          endTime: { dateTime: rangeEnd.toISOString(), timeZone: "UTC" },
          availabilityViewInterval: 30,
        }),
      },
    );
    if (!res.ok) throw new Error(`graph getSchedule failed: ${res.status}`);
    const body = (await res.json()) as {
      value?: { scheduleItems?: { status: string; start: { dateTime: string }; end: { dateTime: string } }[] }[];
    };
    const out: BusyInterval[] = [];
    for (const schedule of body.value ?? []) {
      for (const item of schedule.scheduleItems ?? []) {
        // Anything that isn't free blocks the slot (busy / oof / tentative) —
        // a consultation must never double-book a provisionally held hour.
        if (item.status === "free") continue;
        out.push({ start: new Date(item.start.dateTime + "Z"), end: new Date(item.end.dateTime + "Z") });
      }
    }
    return out;
  }

  async createEvent(args: CalendarEventArgs): Promise<string> {
    // The first configured mailbox is the organizer / booking calendar.
    // Needs the application permission Calendars.ReadWrite.
    const organizer = (env().MS_CALENDAR_USERS ?? "").split(",")[0].trim();
    if (!organizer) throw new Error("MS_CALENDAR_USERS is empty");
    const end = new Date(args.start.getTime() + args.durationMinutes * 60_000);
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(organizer)}/events`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await this.token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: args.summary,
        body: { contentType: "text", content: args.description },
        start: { dateTime: args.start.toISOString(), timeZone: "UTC" },
        end: { dateTime: end.toISOString(), timeZone: "UTC" },
        attendees: [
          { emailAddress: { address: args.attendeeEmail, name: args.attendeeName }, type: "required" },
        ],
      }),
    });
    if (!res.ok) throw new Error(`graph event insert failed: ${res.status}`);
    const body = (await res.json()) as { id: string };
    return body.id;
  }
}

class NoBusySource implements BusySource {
  async getBusy(): Promise<BusyInterval[]> {
    return [];
  }

  async createEvent(): Promise<string> {
    throw new Error("no calendar connected");
  }
}

/* ── cached facade ──────────────────────────────────────────────────── */

const CACHE_TTL_MS = 5 * 60_000;
let cachedBusy: { fetchedAt: number; rangeStart: number; rangeEnd: number; busy: BusyInterval[] } | undefined;
let source: BusySource | undefined;

function busySource(): BusySource {
  if (source) return source;
  if (!features.calendarBusy) source = new NoBusySource();
  else source = env().CALENDAR_BUSY_DRIVER === "google" ? new GoogleBusySource() : new OutlookBusySource();
  return source;
}

/** Busy intervals for the range, cached for a few minutes so the public
 *  contact page doesn't hammer the calendar API. Fails open: if the calendar
 *  is unreachable the internal availability still stands — bookings are
 *  qualify-first and confirmed by the team, so a stale slot is recoverable. */
export async function getStaffBusy(rangeStart: Date, rangeEnd: Date): Promise<BusyInterval[]> {
  if (!features.calendarBusy) return [];
  if (
    cachedBusy &&
    Date.now() - cachedBusy.fetchedAt < CACHE_TTL_MS &&
    cachedBusy.rangeStart <= rangeStart.getTime() &&
    cachedBusy.rangeEnd >= rangeEnd.getTime()
  ) {
    return cachedBusy.busy;
  }
  try {
    const busy = await busySource().getBusy(rangeStart, rangeEnd);
    cachedBusy = { fetchedAt: Date.now(), rangeStart: rangeStart.getTime(), rangeEnd: rangeEnd.getTime(), busy };
    return busy;
  } catch (err) {
    console.error("[calendar-busy] fetch failed, falling back to internal availability:", err);
    return [];
  }
}

/** Write a booking into the connected staff calendar. Best-effort: returns the
 *  external event id, or null when no calendar is connected or the write
 *  failed — the internal Booking row stays authoritative either way. A
 *  successful write busts the busy cache so the slot vanishes immediately. */
export async function createStaffCalendarEvent(args: CalendarEventArgs): Promise<string | null> {
  if (!features.calendarBusy) return null;
  try {
    const id = await busySource().createEvent(args);
    cachedBusy = undefined;
    return id;
  } catch (err) {
    console.error("[calendar-busy] event write failed (booking kept):", err);
    return null;
  }
}
