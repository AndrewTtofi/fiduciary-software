# 12 — Client portal

The portal lives under `/app/*`. Access requires `role = client`. Sign in
at `/login` with `dmitry@meridian.io` / `oroDemo!1` to try it.

## Pages

```
/app                  → /app/dashboard
/app/dashboard         dashboard
/app/application       (read-only snapshot of original onboarding answers)
/app/documents         per-folder document view + uploads
/app/messages          conversation thread with the firm
/app/booking           pick a slot for a meeting
/app/settings          profile / password / contact preferences
```

The portal's left rail is the `ClientShell` component (mirror of
`AdminShell`).

## Dashboard `/app/dashboard`

Three widgets across the top:

- **Open document requests** — count + link to /app/documents
- **Unread messages** — count + link to /app/messages
- **Upcoming key dates** — next 3, with dueDate + description

Beneath, a per-service status grid showing each `ClientService` row
(status, primary staff, assigned partner).

The page is fully server-rendered. Refresh to update.

## Application `/app/application`

A read-only render of the original onboarding wizard answers
(`ProspectDetail`) and uploaded documents. This is the client's
historical record of "what we told the firm at intake".

For active clients (newly converted), the page shows a small banner:
"You've been converted to an active client. Use the dashboard to manage
ongoing work."

## Documents `/app/documents`

Folder layout matches the admin side: KYC, Engagement, Filings,
Correspondence. Documents the client uploaded sit alongside documents
staff have shared with them.

### Open requests panel

At the top, an "Open document requests" panel shows every
`DocumentRequest` with state `open` for this client. Each request has:

- description, dueAt, optional service binding
- **Upload** button that opens the file picker; submitting fulfils the
  request atomically (see [08 — Documents](./08-documents.md))

### Free-standing uploads

Below the requests, an "Upload document" button lets the client upload
without an associated request. The folder is chosen by purpose.

### No delete

A note under the heading: *"Documents you upload are kept for audit.
Contact your account manager if a document needs to be removed."* This
is enforced — the client portal has no delete action.

## Messages `/app/messages`

One conversation thread between the client and the firm. The
implementation is the same as the admin messaging page; only the
visibility filter differs (see [09 — Messaging](./09-messaging.md)).

Features:
- Markdown rendering (links, bold, code)
- Attachments (multi-file)
- "Read" indicator next to each message

## Booking `/app/booking`

Pick a free slot for a meeting with the client's primary staff member.

- 14-day forward view
- Topic textarea (free-form)
- One-click to book

After booking, the page redirects to the dashboard with a confirmation
banner. The client receives an email with the slot. Cancellation goes
through the same page (each future booking has a "Cancel" link).

## Settings `/app/settings`

Self-service profile editing:

- **Profile** — full name, phone, language preference
- **Address** — current residential address, tax residency
- **Company section** — only shown if the client has a Client row
  (covers company name, registered address)
- **Password** — current password + new password

The endpoint is `POST /api/account/profile` with a strict Zod schema
that only allows whitelisted fields. Unknown fields → 422 with an
explicit error.

## What clients cannot do

By design:

- Delete documents
- Edit submitted onboarding answers (the application page is read-only)
- Edit or delete messages
- Re-assign their primary staff
- Cancel a service (must request via messaging)
- Manage their compliance file (it's staff-owned)

These constraints are enforced server-side. The UI just doesn't render
the controls.
