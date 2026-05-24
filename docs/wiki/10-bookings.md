# 10 — Bookings

A lightweight calendar for client meetings: kick-offs, follow-ups,
document-signing sessions.

## Data shape

```
Booking {
  id, createdAt,
  clientId, staffUserId,
  startAt, endAt,
  topic,                            // text label
  status (confirmed | completed | no_show | cancelled),
  meetingUrl (nullable)             // populated if remote
}
```

A booking is always between a client and one staff member. Multi-party
meetings aren't modelled — the topic field carries that context.

## Surfaces

- **Client booking page** `/app/booking` — calendar widget showing
  available slots for the next 14 days. Client picks a slot + topic.
- **Admin bookings page** `/admin/bookings` — list view across all
  clients, filterable by date / status / staff. Defaults to today + future.

## Availability

`GET /api/bookings/availability?staffUserId=...` returns the next 14
days of free slots for one staff member. The service in
`src/lib/services/booking.ts`:

1. Reads `OrgSettings.workingHours` (default 09:00-18:00 weekdays).
2. Reads `OrgSettings.bookingSlotMinutes` (default 30).
3. Excludes existing bookings for that staff member.
4. Returns the remaining slots as ISO strings.

## Booking from the portal

`POST /api/bookings` with `{ startAt, topic, staffUserId? }`. If no
staffUserId is given, the client's `primaryStaffId` is used. The service:

1. Verifies the slot is still free (re-runs availability).
2. Creates the `Booking` with status `confirmed`.
3. Emails both parties.
4. Logs `booking.created`.

## Re-booking

If a client wants to move a confirmed booking, they currently must
cancel + re-book. There's no `PATCH` route to shift `startAt` directly —
deliberate, to keep the audit trail of "X cancelled at T1, then booked
new slot at T2".

## Cancelling

`PATCH /api/bookings/[id]` with `{ status: "cancelled" }`. Allowed if the
booking is in the future and the caller is the client or the assigned
staff. Logs `booking.cancelled`.

## Marking complete / no-show

Staff only. `PATCH /api/bookings/[id]` with `{ status: "completed" | "no_show" }`
after the booking time has passed. Logs the corresponding activity.

## Limits

- No recurring meetings.
- No multi-attendee meetings beyond client + one staff.
- No video-link auto-provisioning. `meetingUrl` is a text field the staff
  member fills in (Zoom / Meet / Teams link).
- No timezone awareness — every timestamp is stored as UTC; the UI
  renders in the viewer's local timezone but the booking owner's
  timezone is not separately tracked.

## What's missing (deferred)

- Recurring bookings (P2)
- Calendar sync (Google / Outlook) — would integrate via OAuth
- WhatsApp/SMS reminders (`features.whatsapp` is scaffolded)
