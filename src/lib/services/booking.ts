import { prisma } from "@/lib/db";
import { BookingStatus, Role } from "@prisma/client";
import { calendar } from "@/lib/providers/calendar";
import { getStaffBusy, slotIsFree, createStaffCalendarEvent } from "@/lib/providers/calendar-busy";
import { email } from "@/lib/providers/email";
import { notify } from "@/lib/providers/notify";
import { getServerBranding } from "@/lib/services/branding-server";
import { logActivity } from "./activity";

const SLOT_HOURS = [9, 10, 11, 14, 15, 16] as const;
const SLOT_MINUTES = 30;
/** A consultation can't start sooner than this — staff need warning. */
const MIN_NOTICE_MS = 60 * 60_000;

/** The firm operates on Cyprus time; every slot grid is anchored to it. */
const FIRM_TZ = "Europe/Nicosia";

/** Millisecond offset of `tz` from UTC at the given instant (east positive). */
function tzOffsetMs(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUtc - at.getTime();
}

/** UTC instant of a wall-clock time in the firm's time zone (DST-safe). */
function firmTimeToUtc(y: number, m: number, d: number, hour: number): Date {
  let ts = Date.UTC(y, m, d, hour);
  // Two passes converge because the offset is stable around working hours.
  for (let i = 0; i < 2; i++) ts = Date.UTC(y, m, d, hour) - tzOffsetMs(FIRM_TZ, new Date(ts));
  return new Date(ts);
}

/** Today's calendar date in the firm's time zone. */
function firmToday(now: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FIRM_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

/** Candidate slot instants for the next `days` firm-local working days:
 *  SLOT_HOURS on Cyprus wall-clock time, weekends skipped, past slots dropped.
 *  Visitors may view them in any time zone — the instants stay inside the
 *  firm's Cyprus working hours by construction. */
function candidateSlots(now: Date, days = 14): { dateIso: string; slots: Date[] }[] {
  const today = firmToday(now);
  const out: { dateIso: string; slots: Date[] }[] = [];
  for (let dayIdx = 0; dayIdx < days; dayIdx++) {
    // Date.UTC normalises day overflow, giving clean calendar arithmetic.
    const cal = new Date(Date.UTC(today.y, today.m, today.d + dayIdx));
    if (cal.getUTCDay() === 0 || cal.getUTCDay() === 6) continue;
    const slots: Date[] = [];
    for (const h of SLOT_HOURS) {
      const slot = firmTimeToUtc(cal.getUTCFullYear(), cal.getUTCMonth(), cal.getUTCDate(), h);
      if (slot.getTime() < now.getTime() + MIN_NOTICE_MS) continue;
      slots.push(slot);
    }
    if (slots.length > 0) out.push({ dateIso: cal.toISOString().slice(0, 10), slots });
  }
  return out;
}

/** All staff who can be picked as experts on the booking page. */
export async function listExperts() {
  return prisma.user.findMany({
    where: { role: Role.staff },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

/** Generate the 2-week availability matrix for a given expert. Pure function
 *  over the database — no IO outside `prisma.findMany`. */
export async function listAvailability(expertId: string, tz: string) {
  const now = new Date();
  const horizonEnd = new Date(Date.now() + 14 * 24 * 60 * 60_000);

  const taken = await prisma.booking.findMany({
    where: {
      expertId,
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
      startsAt: { gte: now, lte: horizonEnd },
    },
    select: { startsAt: true },
  });
  const takenKey = new Set(taken.map((b) => keyOf(b.startsAt)));
  // Real staff availability: subtract busy time from the connected calendar
  // (Google / Outlook) as well as internal bookings.
  const busy = await getStaffBusy(now, horizonEnd);

  // Cyprus working-hour instants; the tz is used purely for display.
  const days = candidateSlots(now).map((day) => ({
    dateIso: day.dateIso,
    slots: day.slots.map((slot) => ({
      startUtc: slot,
      available: !takenKey.has(keyOf(slot)) && slotIsFree(slot, SLOT_MINUTES, busy),
    })),
  }));
  return { tz, days };
}

function keyOf(d: Date): string {
  return d.toISOString();
}

/** Aggregate availability for the public contact form: the next few slot times
 *  where at least one staff expert is still free. Deliberately anonymous — no
 *  expert identity, no per-expert matrix — so it is safe to render publicly.
 *  Actual booking still happens post-approval; the form only records preference. */
export async function listPublicSlots(limit = 6, perDay = 3): Promise<Date[]> {
  const experts = await prisma.user.count({ where: { role: Role.staff } });
  if (experts === 0) return [];

  const now = new Date();
  const horizonEnd = new Date(Date.now() + 14 * 24 * 60 * 60_000);
  const taken = await prisma.booking.groupBy({
    by: ["startsAt"],
    where: {
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
      startsAt: { gte: now, lte: horizonEnd },
    },
    _count: { _all: true },
  });
  const takenBySlot = new Map(taken.map((t) => [keyOf(t.startsAt), t._count._all]));
  // Real staff availability: a slot is only offered when the connected
  // calendar (Google / Outlook) is free too, not just our own booking table.
  const busy = await getStaffBusy(now, horizonEnd);

  // Spread the offer across days (capped per day) so the pick list shows a
  // realistic week, not six slots on the same morning.
  const out: Date[] = [];
  for (const day of candidateSlots(now)) {
    let dayCount = 0;
    for (const slot of day.slots) {
      if ((takenBySlot.get(keyOf(slot)) ?? 0) >= experts) continue;
      if (!slotIsFree(slot, SLOT_MINUTES, busy)) continue;
      out.push(slot);
      if (++dayCount >= perDay || out.length >= limit) break;
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** Every free slot over the horizon, for the public Calendly-style picker:
 *  the Cyprus working-hour grid minus internal bookings minus the connected
 *  staff calendar's busy time. */
export async function listPublicAvailability(): Promise<Date[]> {
  const experts = await prisma.user.count({ where: { role: Role.staff } });
  if (experts === 0) return [];

  const now = new Date();
  const horizonEnd = new Date(Date.now() + 14 * 24 * 60 * 60_000);
  const taken = await prisma.booking.groupBy({
    by: ["startsAt"],
    where: {
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
      startsAt: { gte: now, lte: horizonEnd },
    },
    _count: { _all: true },
  });
  const takenBySlot = new Map(taken.map((t) => [keyOf(t.startsAt), t._count._all]));
  const busy = await getStaffBusy(now, horizonEnd);

  const out: Date[] = [];
  for (const day of candidateSlots(now)) {
    for (const slot of day.slots) {
      if ((takenBySlot.get(keyOf(slot)) ?? 0) >= experts) continue;
      if (!slotIsFree(slot, SLOT_MINUTES, busy)) continue;
      out.push(slot);
    }
  }
  return out;
}

/** True when the instant sits on the bookable grid (Cyprus working-hour slot
 *  inside the horizon, respecting the minimum notice). Guards the public
 *  booking endpoint against fabricated timestamps. */
export function isOnSlotGrid(at: Date, now: Date): boolean {
  const key = keyOf(at);
  return candidateSlots(now).some((day) => day.slots.some((s) => keyOf(s) === key));
}

export type PublicBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; reason: "INVALID_SLOT" | "SLOT_TAKEN" };

/** Hard-book a public (lead) consultation: reserve the slot internally and
 *  mirror it into the connected staff calendar. See docs/booking-flow.md. */
export async function createPublicBooking(input: {
  leadId: string;
  name: string;
  email: string;
  slotIso: string;
  timezone: string;
}): Promise<PublicBookingResult> {
  const now = new Date();
  const startsAt = new Date(input.slotIso);
  if (Number.isNaN(startsAt.getTime()) || !isOnSlotGrid(startsAt, now)) {
    return { ok: false, reason: "INVALID_SLOT" };
  }

  // Internal availability: one of the staff must be free at that instant.
  const staff = await prisma.user.findMany({
    where: { role: Role.staff },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
  if (staff.length === 0) return { ok: false, reason: "SLOT_TAKEN" };
  const clashes = await prisma.booking.findMany({
    where: {
      startsAt,
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
    },
    select: { expertId: true },
  });
  const busyExperts = new Set(clashes.map((b) => b.expertId));
  const expert = staff.find((s) => !busyExperts.has(s.id));
  if (!expert) return { ok: false, reason: "SLOT_TAKEN" };

  // Real calendar availability (fresh-ish; ~5 min cache).
  const busy = await getStaffBusy(now, new Date(startsAt.getTime() + 24 * 60 * 60_000));
  if (!slotIsFree(startsAt, SLOT_MINUTES, busy)) return { ok: false, reason: "SLOT_TAKEN" };

  const booking = await prisma.booking.create({
    data: {
      leadId: input.leadId,
      expertId: expert.id,
      startsAt,
      timezone: input.timezone,
      status: BookingStatus.confirmed,
    },
  });

  await logActivity({
    entityType: "booking",
    entityId: booking.id,
    action: "booking.created",
    meta: { leadId: input.leadId, startsAt: startsAt.toISOString(), source: "public" },
  });

  const brand = await getServerBranding();

  // Mirror into the staff calendar (best-effort; booking row is authoritative).
  const eventId = await createStaffCalendarEvent({
    summary: `${brand.brandName} consultation — ${input.name}`,
    description: `Booked via the website. Lead record: ${input.email}. All answers are on the lead in the admin CRM.`,
    start: startsAt,
    durationMinutes: booking.durationMinutes,
    attendeeEmail: input.email,
    attendeeName: input.name,
  });
  if (eventId) {
    await prisma.booking.update({ where: { id: booking.id }, data: { calendarEventId: eventId } });
  }

  // Confirmation + .ics straight to the visitor.
  const ics = calendar().buildIcs({
    uid: `booking-${booking.id}@booking.local`,
    startUtc: startsAt,
    durationMinutes: booking.durationMinutes,
    summary: `${brand.legalName} — consultation`,
    description: `Free consultation with ${brand.legalName}.`,
    organizerName: brand.legalName,
    organizerEmail: brand.contactEmail ?? "no-reply@localhost",
    attendeeEmail: input.email,
    attendeeName: input.name,
    location: "Video call (link to follow)",
  });
  try {
    await email().send({
      to: input.email,
      subject: `Your consultation with ${brand.brandName} is booked`,
      html: `<p>Hello ${input.name.replace(/</g, "&lt;")},</p>
             <p>Your 30-minute consultation is booked for
             <b>${startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: input.timezone })}</b>
             (${input.timezone.replace(/_/g, " ")}). A calendar invite is attached.</p>
             <p>Your answers are read before the call, so you never repeat your story.</p>
             <p>${brand.legalName || brand.brandName}</p>`,
      attachments: [{ filename: "consultation.ics", content: Buffer.from(ics), contentType: "text/calendar" }],
    });
  } catch (err) {
    console.error("[booking] public confirmation email failed:", err);
  }

  return { ok: true, bookingId: booking.id };
}

export interface CreateBookingInput {
  userId: string;
  expertId: string;
  startUtc: Date;
  timezone: string;
}

export async function createBooking(input: CreateBookingInput) {
  const prospect = await prisma.prospect.findUnique({
    where: { userId: input.userId },
    include: { user: true },
  });
  if (!prospect) return { ok: false as const, reason: "NO_PROSPECT" as const };
  if (prospect.status !== "approved") return { ok: false as const, reason: "NOT_APPROVED" as const };

  // Conflict check at insert time — the unique constraint isn't on (expertId, startsAt)
  // by design (cancellations can free a slot), so check explicitly.
  const existing = await prisma.booking.findFirst({
    where: {
      expertId: input.expertId,
      startsAt: input.startUtc,
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
    },
  });
  if (existing) return { ok: false as const, reason: "SLOT_TAKEN" as const };

  const booking = await prisma.booking.create({
    data: {
      prospectId: prospect.id,
      expertId: input.expertId,
      startsAt: input.startUtc,
      timezone: input.timezone,
      status: BookingStatus.confirmed,
    },
    include: { expert: true },
  });

  await logActivity({
    entityType: "booking",
    entityId: booking.id,
    action: "booking.created",
    actorId: input.userId,
    meta: { startsAt: input.startUtc.toISOString(), expertId: input.expertId },
  });

  // Fire-and-forget confirmation + .ics
  const brand = await getServerBranding();
  const ics = calendar().buildIcs({
    uid: `booking-${booking.id}@booking.local`,
    startUtc: booking.startsAt,
    durationMinutes: booking.durationMinutes,
    summary: `${brand.legalName} — consultation`,
    description: `Free consultation with ${brand.legalName}.`,
    organizerName: brand.legalName,
    organizerEmail: brand.contactEmail ?? "no-reply@localhost",
    attendeeEmail: prospect.user.email,
    attendeeName: prospect.user.fullName,
    location: "Google Meet (link to follow)",
  });

  await notify().send({
    channel: "email",
    to: prospect.user.email,
    template: "booking-confirmation",
    data: {
      expert: booking.expert.fullName,
      when: booking.startsAt.toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: booking.timezone }),
    },
  });

  return { ok: true as const, booking, ics };
}

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { prospect: true } });
  if (!booking) return { ok: false as const, reason: "NOT_FOUND" as const };
  // Lead (public) bookings have no owning account — nobody can self-cancel them.
  if (booking.prospect?.userId !== userId) return { ok: false as const, reason: "FORBIDDEN" as const };
  if (booking.status !== BookingStatus.confirmed) return { ok: false as const, reason: "NOT_CANCELLABLE" as const };
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.cancelled },
  });
  await logActivity({
    entityType: "booking",
    entityId: bookingId,
    action: "booking.cancelled",
    actorId: userId,
  });
  return { ok: true as const, booking: updated };
}
