# 11 — Admin panel (every tab)

The admin panel lives at `/admin/*`. Access requires `role = staff`. The
left-rail nav (in `AdminShell.tsx`) carries: Submissions, Bookings,
Clients, Users, Compliance, Analytics, Content, Settings.

Sign in at `/login` with `staff@oro.local` / `oroDemo!1`.

---

## Submissions — `/admin/submissions`

The intake inbox: every prospect who has completed the 3-step onboarding
wizard lands here.

### List page

URL-driven filters (shareable):

- **Status** — `pending` (new), `in_review`, `needs_info`, `approved`,
  `rejected`
- **Service** — narrow by requested services
- **Search** — full name, email, or reference (`ORO-xxxxxx`)

Rows show: reference, name, services, status pill, submitted-at,
assigned partner. Click a row → detail.

### Detail page `/admin/submissions/[ref]`

Three panes:

**Left — applicant info.** Read-only render of every `ProspectDetail`
row. To request edits, set status to `needs_info` (emails the prospect)
and message them about what's wrong.

**Center — activity.** Internal notes, message thread, uploaded
documents (click to preview decrypted).

**Right — actions sidebar.**

- **Status dropdown** — flip pending → in_review → needs_info /
  approved / rejected. Each change logs to ActivityLog and emails the
  prospect when relevant.
- **Assign partner** — picker; only `role=partner` users accepted
  (backend enforces).
- **Compliance →** opens the KYC dashboard for this submission's file.
- **Convert to client** — disabled until status is `approved` AND
  compliance file is `cleared`. See [07 — Conversion](./07-conversion.md).

### Try it

1. Open `elena.p@limassol.cy`'s submission (she's seeded as approved
   with a cleared file).
2. Click **Compliance** to see the green checkmarks.
3. Click **Convert to client** to walk through the modal.

---

## Bookings — `/admin/bookings`

The shared booking calendar for the firm.

- **Default view:** today + future, all staff.
- **Filters:** date range, staff member, status, client.
- **Per-row actions:** open the client, mark completed/no-show (only
  after the booking time has passed), cancel.

See [10 — Bookings](./10-bookings.md) for the data model and lifecycle.

---

## Clients — `/admin/clients`

The roster of converted clients.

### List

Filters: status (`active / on_hold / completed`), service, assigned
partner, free-text search (company, name, email).

Per row: company name, primary contact, status, services count, next
key date, assigned partner.

### Detail `/admin/clients/[id]`

Five sections on one long page:

**1. Header.** Inline-editable: company name, primary contact, primary
staff, partner-per-service. Status changes log `client.status_changed`.

**2. Services.** CRUD over `ClientService` rows. Add a new service from
the catalog, change a service's status (pending → in_progress →
completed), assign a different partner per service.

**3. Key dates.** CRUD over `KeyDate`. Each key date has dueDate,
description, status, optional serviceTypeKey binding. Overdue dates
show in red.

**4. Documents.** Folder-grouped (KYC / Engagement / Filings /
Correspondence). UploadButton opens a popover with a purpose dropdown
+ file picker. Each row links to the inline preview at
`/api/documents/[id]`.

**5. Conversation.** Embedded `/admin/clients/[id]/messages` view.
Internal-notes tab beside the public messages tab.

**Sidebar actions:**

- **Request documents →** opens `/admin/clients/[id]/request-docs` (see
  below).
- **Open compliance →** `/admin/clients/[id]/compliance`.
- **Activity feed** — the per-client ActivityLog slice.

### Request docs `/admin/clients/[id]/request-docs`

Lists every DocumentRequest ever issued for this client. Per row:

- description, dueAt, state, fulfilment timestamp
- **Edit** (open requests only) — modal to change description / dueAt
- **Cancel** (open requests only)
- Link to the fulfilling Document (fulfilled requests only)

"New request" creates a `DocumentRequest` and emails the client.

---

## Users — `/admin/users`

Every `User` row in the system.

- Filter by role.
- Verify a prospect manually (`POST /api/admin/users/[id]/verify`) —
  bypasses the email-token step. Used in support cases where the user
  can't receive the email.

This page is intentionally lean. Detailed user management (deactivate,
re-role) lives under **Settings → Team**.

---

## Compliance — `/admin/compliance/tasks`

The cross-file work queue. Aggregates every open `ReviewTask` across
every ComplianceFile.

- Filters: kind (screening_hit / risk_overdue / info_missing /
  document_expiring), dueAt range.
- Per row: kind, related party + file, dueAt, age.
- Actions: open the relevant Party/File; mark task done; dismiss.

This is the daily working surface for a compliance officer. The
per-client compliance dashboard is the *deep* view; this is the
*sweep* view.

See [06 — Compliance](./06-compliance.md).

---

## Analytics — `/admin/analytics`

A small dashboard with operational metrics:

- Open submissions by status
- Conversion rate (last 30/90 days)
- Average days to conversion
- Compliance bottlenecks (files stuck in `in_review` > 7 days)
- Document-request fulfilment rate

These are computed live from Postgres on each render — no
materialised view. Good enough at current scale.

---

## Content — `/admin/content`

Manages the public-facing marketing content (the `/` landing copy,
service descriptions, FAQ).

The content store is currently a small set of `OrgSettings`-style rows.
A WYSIWYG was scoped for v1 but not implemented; the page exposes a
plain markdown textarea with a live preview.

---

## Settings — `/admin/settings`

A small index page linking to four sub-tabs:

### Settings → Organization `/admin/settings`

Edits the `OrgSettings` singleton:

- Company name, legal address, country
- Default languages (English, Russian)
- Working hours and booking slot length (used by [10 — Bookings](./10-bookings.md))
- Default `messageEmailEnabled` toggle

### Settings → Services `/admin/settings/services`

The catalog of services the firm sells. Each row is one `Service`:

- `key` (slug, used everywhere)
- `name` (display)
- `description`
- `active` (excluded from new-onboarding pickers when false)

### Settings → Flags `/admin/settings/flags`

Boolean toggles enumerated in `KNOWN_FLAGS` (in
`src/lib/services/settings.ts`). Toggling a flag writes to `FeatureFlag`.
The toggles are read by code via `getFlag(key)`.

Use this for surface-rolling new features: ship code dark, flip the flag
when you're ready.

### Settings → Team `/admin/settings/team`

The staff + partner roster. Per row:

- email, full name, role
- deactivate / reactivate (sets `User.deactivatedAt`)

Deactivating immediately blocks login — see
[03 — Roles & auth](./03-roles-and-auth.md).

---

## Cross-tab patterns

- **The AdminShell handles search + breadcrumbs.** Each page passes a
  `search={{ placeholder }}` config; the shell wires the URL parameter.
- **All write actions go through services.** Don't `prisma.update` in a
  route handler. If a feature seems missing a service, that's a bug.
- **Every list page is server-rendered.** The URL is the source of truth
  for filters; `useRouter` updates the URL and Next.js re-renders. No
  client-side state for filters.
