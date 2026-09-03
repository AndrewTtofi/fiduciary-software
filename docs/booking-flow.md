# Public booking — hard-booking flow

The public consultation form books **directly into the staff calendar**. The
slot pick is no longer a "preference" the team confirms by hand: submitting the
form reserves the slot internally and writes the event into the connected
Google/Outlook calendar.

## Step order (click before you type)

The form is four short steps, ordered so the visitor commits with clicks
before being asked for anything personal, and gives the highest-friction
field (phone) last:

| Step | Asks | Typed? | Why here |
|---|---|---|---|
| 1 · What you need | service tiles (multi-select) + "not sure yet" | no | frictionless micro-commitment that also qualifies |
| 2 · Your situation | citizenship, residence, relocate?, timeline, property (optional) | no | momentum keeps building; drives the routing flags |
| 3 · Your plan | first name + email, optional note, consent | yes | they're invested, so the ask lands; consent sits at the point of capture |
| 4 · Book your slot | calendar, then phone/WhatsApp (optional) | phone only | one tap from booked |

**Partial save.** Passing step 3 posts the answers so far to `POST /api/leads`
with `partial: true`. That upserts the `Lead` (email + source `contact`) with
`meta.funnelStage = "plan_requested"`, books nothing and sends no email. An
abandon on the calendar is therefore still a lead the team can follow up. The
final submit upserts the same record with every answer (`slot_pending`, then
`booked` once the booking lands).

**Confirmation is not a dead end.** After booking the visitor sees the slot,
an "Add to calendar" (Google template link; the .ics is in the email) and
"Reschedule" pair, the before-the-call prep videos (Admin → Content →
Consultation → "Before-the-call videos"; cards render without a link until a
URL is set), and a "what happens next" note. The internal notification fires
at the same moment so the team can reach out within minutes.

## Flow

```
visitor picks a slot (Calendly-style picker, visitor's own time zone)
  → POST /api/leads   (same lead-capture endpoint as before)
      1. upsert Lead (answers + automatic routing flags, as before)
      2. createPublicBooking:
         a. slot must sit on the Cyprus working-hour grid, ≥ 60 min from now
         b. slot must be free internally (bookings table, per staff head-count)
         c. slot must be free on the connected staff calendar (busy source)
         d. Booking row created (leadId — no account/prospect required)
         e. event written to the staff calendar (best-effort; id stored on
            the booking for future cancellation sync)
         f. visitor gets a confirmation email with an .ics invite
      3. firm notification email states the slot is booked (not "to confirm")
  → 409 SLOT_TAKEN when (b) or (c) fails → the form refreshes availability
    and asks the visitor to pick another slot; the lead is already stored.
```

## Model

`Booking.prospectId` became optional; `leadId` (→ `Lead`) covers public
bookings made without an account. `calendarEventId` stores the external
calendar event id. Exactly one of `prospectId` / `leadId` is set in practice;
reminder workers and the admin bookings page resolve the attendee from either.

## Availability

`GET /api/bookings/public-slots` (rate-limited) returns every free slot over
the next 14 days: Cyprus working-hour grid minus internal bookings minus the
staff calendar's busy/OOF/tentative windows (`CALENDAR_BUSY_DRIVER`,
`src/lib/providers/calendar-busy.ts`, ~5 min cache, fails open to
internal-only availability). The picker fetches this on mount and again after
any `SLOT_TAKEN` conflict.

## Calendar write

`createStaffCalendarEvent` in `calendar-busy.ts` shares the drivers/credentials
with the busy source:

- **google** — `events.insert` on the first configured calendar id. The OAuth
  refresh token therefore needs the read/write
  `https://www.googleapis.com/auth/calendar.events` scope (readonly is enough
  only for availability). `sendUpdates=none`: the platform sends its own
  confirmation + .ics, so Google must not double-email the visitor.
- **outlook** — Graph `POST /users/{organizer}/events` (application permission
  `Calendars.ReadWrite`); the organizer is the first configured mailbox.

A calendar-write failure never fails the booking (the internal Booking row is
authoritative); it logs loudly and leaves `calendarEventId` null. A successful
write busts the busy cache so the slot disappears immediately.

## Race handling

Same optimistic pattern as the portal: conflict check at insert time inside
`createPublicBooking`. The window between check and insert is milliseconds;
a loser of the race gets `SLOT_TAKEN` on the next attempt because the
conflict check re-runs. Qualify-first remains the safety net — staff see every
booking in Admin → Bookings.

## UI (Calendly-style)

Step 4 of the booking form is a two-panel picker: a month calendar on the left
(days with availability are enabled; 14-day horizon), the selected day's
30-minute slots on the right, both rendered in the visitor's time zone with a
time-zone selector underneath (auto-detected default). Mobile stacks the
panels. On `SLOT_TAKEN` the picker refetches availability and shows an inline
notice.
