# Public booking — hard-booking flow

The public consultation form books **directly into the staff calendar**. The
slot pick is no longer a "preference" the team confirms by hand: submitting the
form reserves the slot internally and writes the event into the connected
Google/Outlook calendar.

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
