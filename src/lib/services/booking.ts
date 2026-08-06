import { prisma } from "@/lib/db";
import { BookingStatus, Role } from "@prisma/client";
import { calendar } from "@/lib/providers/calendar";
import { getStaffBusy, slotIsFree, createStaffCalendarEvent } from "@/lib/providers/calendar-busy";
import { email } from "@/lib/providers/email";
import { notify } from "@/lib/providers/notify";
import { getServerBranding } from "@/lib/services/branding-server";
import { logActivity } from "./activity";
import { DEFAULT_CONSULTATION_HOURS, getConsultationHours, parseHhMm, type ConsultationHours } from "./settings";

/* The schedule is firm-configurable at /admin/consultation-hours; these were
   hard-coded constants, so changing your hours needed a redeploy. Reads go
   through getConsultationHours(), which falls back to the same values. */

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
function firmTimeToUtc(y: number, m: number, d: number, minutesOfDay: number, tz: string): Date {
  const h = Math.floor(minutesOfDay / 60);
  const min = minutesOfDay % 60;
  let ts = Date.UTC(y, m, d, h, min);
  // Two passes converge because the offset is stable around working hours.
  for (let i = 0; i < 2; i++) ts = Date.UTC(y, m, d, h, min) - tzOffsetMs(tz, new Date(ts));
  return new Date(ts);
}

/** Today's calendar date in the firm's time zone. */
function firmToday(now: Date, tz: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month") - 1, d: get("day") };
}

/** Candidate slot instants across the configured horizon: the firm's chosen
 *  start times on its own wall clock, only on the weekdays it offers, with
 *  past slots and anything inside the notice window dropped. Visitors may view
 *  them in any time zone — the instants stay inside the firm's hours by
 *  construction. Exported for tests. */
export function buildCandidateSlots(now: Date, cfg: ConsultationHours): { dateIso: string; slots: Date[] }[] {
  const today = firmToday(now, cfg.timezone);
  const minutesOfDay = cfg.times.map(parseHhMm).filter((v): v is number => v !== null);
  const offered = new Set(cfg.days);
  const noticeMs = cfg.noticeMins * 60_000;

  const out: { dateIso: string; slots: Date[] }[] = [];
  for (let dayIdx = 0; dayIdx < cfg.horizonDays; dayIdx++) {
    // Date.UTC normalises day overflow, giving clean calendar arithmetic.
    const cal = new Date(Date.UTC(today.y, today.m, today.d + dayIdx));
    if (!offered.has(cal.getUTCDay())) continue;
    const slots: Date[] = [];
    for (const mins of minutesOfDay) {
      const slot = firmTimeToUtc(cal.getUTCFullYear(), cal.getUTCMonth(), cal.getUTCDate(), mins, cfg.timezone);
      if (slot.getTime() < now.getTime() + noticeMs) continue;
      slots.push(slot);
    }
    if (slots.length > 0) out.push({ dateIso: cal.toISOString().slice(0, 10), slots });
  }
  return out;
}

/** The configured grid for right now. */
async function candidateSlots(now: Date): Promise<{ cfg: ConsultationHours; days: { dateIso: string; slots: Date[] }[] }> {
  const cfg = await getConsultationHours();
  return { cfg, days: buildCandidateSlots(now, cfg) };
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
  const { cfg, days: grid } = await candidateSlots(now);
  const horizonEnd = new Date(now.getTime() + cfg.horizonDays * 24 * 60 * 60_000);

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
  const days = grid.map((day) => ({
    dateIso: day.dateIso,
    slots: day.slots.map((slot) => ({
      startUtc: slot,
      available: !takenKey.has(keyOf(slot)) && slotIsFree(slot, cfg.minutes, busy),
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
  const { cfg, days: grid } = await candidateSlots(now);
  const horizonEnd = new Date(now.getTime() + cfg.horizonDays * 24 * 60 * 60_000);
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
  for (const day of grid) {
    let dayCount = 0;
    for (const slot of day.slots) {
      if ((takenBySlot.get(keyOf(slot)) ?? 0) >= experts) continue;
      if (!slotIsFree(slot, cfg.minutes, busy)) continue;
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
  const { cfg, days: grid } = await candidateSlots(now);
  const horizonEnd = new Date(now.getTime() + cfg.horizonDays * 24 * 60 * 60_000);
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
  for (const day of grid) {
    for (const slot of day.slots) {
      if ((takenBySlot.get(keyOf(slot)) ?? 0) >= experts) continue;
      if (!slotIsFree(slot, cfg.minutes, busy)) continue;
      out.push(slot);
    }
  }
  return out;
}

/** True when the instant sits on the bookable grid (a configured slot inside
 *  the horizon, respecting the minimum notice). Guards the public booking
 *  endpoint against fabricated timestamps. */
export function isOnSlotGrid(at: Date, now: Date, cfg: ConsultationHours = DEFAULT_CONSULTATION_HOURS): boolean {
  const key = keyOf(at);
  return buildCandidateSlots(now, cfg).some((day) => day.slots.some((s) => keyOf(s) === key));
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
  const gridCfg = await getConsultationHours();
  if (Number.isNaN(startsAt.getTime()) || !isOnSlotGrid(startsAt, now, gridCfg)) {
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
  const cfg = await getConsultationHours();
  if (!slotIsFree(startsAt, cfg.minutes, busy)) return { ok: false, reason: "SLOT_TAKEN" };

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

/** Move a confirmed consultation to a different slot, as staff.

 *  There was no way to do this: staff could neither reschedule nor cancel, so
 *  moving a call meant emailing the person and editing the database by hand.
 *
 *  The new time has to be a real slot on the configured grid and free for that
 *  adviser, so a reschedule cannot put the firm somewhere it does not work.
 *  Both parties are told: the attendee gets a fresh .ics that supersedes the
 *  old one, and the staff calendar event is rewritten. */
export async function rescheduleBooking(input: {
  bookingId: string;
  startUtc: Date;
  actorId: string;
  /** Optional line from the adviser, included in the email to the attendee. */
  note?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { prospect: { include: { user: true } }, lead: true, expert: true },
  });
  if (!booking) return { ok: false as const, reason: "NOT_FOUND" as const };
  if (booking.status !== BookingStatus.confirmed) {
    return { ok: false as const, reason: "NOT_RESCHEDULABLE" as const };
  }

  const now = new Date();
  const cfg = await getConsultationHours();
  if (Number.isNaN(input.startUtc.getTime()) || !isOnSlotGrid(input.startUtc, now, cfg)) {
    return { ok: false as const, reason: "BAD_SLOT" as const };
  }
  if (input.startUtc.getTime() === booking.startsAt.getTime()) {
    return { ok: false as const, reason: "UNCHANGED" as const };
  }

  // Free for this adviser: another confirmed booking, or busy time on the
  // connected calendar, both block it.
  const clash = await prisma.booking.findFirst({
    where: {
      id: { not: booking.id },
      expertId: booking.expertId,
      status: { in: [BookingStatus.confirmed, BookingStatus.completed] },
      startsAt: input.startUtc,
    },
    select: { id: true },
  });
  if (clash) return { ok: false as const, reason: "SLOT_TAKEN" as const };

  const busy = await getStaffBusy(input.startUtc, new Date(input.startUtc.getTime() + cfg.minutes * 60_000));
  if (!slotIsFree(input.startUtc, cfg.minutes, busy)) {
    return { ok: false as const, reason: "SLOT_TAKEN" as const };
  }

  const previous = booking.startsAt;
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { startsAt: input.startUtc },
  });

  await logActivity({
    entityType: "booking",
    entityId: booking.id,
    action: "booking.rescheduled",
    actorId: input.actorId,
    meta: { from: previous.toISOString(), to: input.startUtc.toISOString(), note: input.note ?? null },
  });

  const attendeeEmail = booking.prospect?.user.email ?? booking.lead?.email ?? null;
  const attendeeName = booking.prospect?.user.fullName ?? booking.lead?.name ?? "there";
  const brand = await getServerBranding();

  // Rewrite the staff calendar entry. Best-effort, like the original booking:
  // the row is authoritative and a calendar hiccup must not lose the change.
  try {
    const eventId = await createStaffCalendarEvent({
      summary: `${brand.brandName} consultation — ${attendeeName}`,
      description: `Rescheduled from ${previous.toISOString()}.${input.note ? ` Note: ${input.note}` : ""}`,
      start: input.startUtc,
      durationMinutes: updated.durationMinutes,
      attendeeEmail: attendeeEmail ?? "",
      attendeeName,
    });
    if (eventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { calendarEventId: eventId } });
    }
  } catch (err) {
    console.error("[booking] calendar update on reschedule failed:", err);
  }

  if (attendeeEmail) {
    const when = input.startUtc.toLocaleString("en-GB", {
      dateStyle: "long", timeStyle: "short", timeZone: updated.timezone,
    });
    const ics = calendar().buildIcs({
      uid: `booking-${booking.id}@booking.local`,   // same UID: replaces, not duplicates
      startUtc: input.startUtc,
      durationMinutes: updated.durationMinutes,
      summary: `${brand.legalName} — consultation`,
      description: `Rescheduled consultation with ${brand.legalName}.`,
      organizerName: brand.legalName,
      organizerEmail: brand.contactEmail ?? "no-reply@localhost",
      attendeeEmail,
      attendeeName,
      location: "Video call (link to follow)",
    });
    try {
      await email().send({
        to: attendeeEmail,
        subject: `Your consultation with ${brand.brandName} has moved`,
        html: `<p>Hello ${escapeHtml(attendeeName)},</p>
               <p>Your consultation has been moved to <b>${escapeHtml(when)}</b>
               (${escapeHtml(updated.timezone.replace(/_/g, " "))}).</p>
               ${input.note ? `<p>${escapeHtml(input.note)}</p>` : ""}
               <p>An updated calendar invite is attached; it replaces the previous one.</p>
               <p>${escapeHtml(brand.legalName || brand.brandName)}</p>`,
        attachments: [{ filename: "consultation.ics", content: Buffer.from(ics), contentType: "text/calendar" }],
      });
    } catch (err) {
      console.error("[booking] reschedule email failed:", err);
    }
  }

  return { ok: true as const, booking: updated, previous };
}

/** Cancel a confirmed consultation, as staff.

 *  Distinct from `cancelBooking`, which is the client cancelling their own from
 *  the portal: this is the firm calling it off, so the attendee is told and the
 *  adviser's calendar hold is released. Public (lead) bookings are included —
 *  they have no owning account, so nobody but staff could ever cancel them. */
export async function cancelBookingAsStaff(input: {
  bookingId: string;
  actorId: string;
  /** Optional line from the adviser, included in the email. */
  note?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { prospect: { include: { user: true } }, lead: true },
  });
  if (!booking) return { ok: false as const, reason: "NOT_FOUND" as const };
  if (booking.status !== BookingStatus.confirmed) {
    return { ok: false as const, reason: "NOT_CANCELLABLE" as const };
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.cancelled },
  });

  await logActivity({
    entityType: "booking",
    entityId: booking.id,
    action: "booking.cancelled",
    actorId: input.actorId,
    meta: { by: "staff", startsAt: booking.startsAt.toISOString(), note: input.note ?? null },
  });

  const attendeeEmail = booking.prospect?.user.email ?? booking.lead?.email ?? null;
  const attendeeName = booking.prospect?.user.fullName ?? booking.lead?.name ?? "there";
  if (attendeeEmail) {
    const brand = await getServerBranding();
    const when = booking.startsAt.toLocaleString("en-GB", {
      dateStyle: "long", timeStyle: "short", timeZone: booking.timezone,
    });
    try {
      await email().send({
        to: attendeeEmail,
        subject: `Your consultation with ${brand.brandName} has been cancelled`,
        html: `<p>Hello ${escapeHtml(attendeeName)},</p>
               <p>We have had to cancel the consultation booked for <b>${escapeHtml(when)}</b>
               (${escapeHtml(booking.timezone.replace(/_/g, " "))}). Apologies for the inconvenience.</p>
               ${input.note ? `<p>${escapeHtml(input.note)}</p>` : ""}
               <p>You are welcome to book another time whenever suits you.</p>
               <p>${escapeHtml(brand.legalName || brand.brandName)}</p>`,
      });
    } catch (err) {
      console.error("[booking] cancellation email failed:", err);
    }
  }

  return { ok: true as const, booking: updated };
}

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
