# 16 — Settings (org, services, flags, team)

The Settings area is the firm's control panel — read it as "what the
admin can configure that's not per-client". Lives at `/admin/settings`.

## Sub-tabs

```
/admin/settings              Organization (the OrgSettings singleton)
/admin/settings/services     The catalog the firm sells
/admin/settings/flags        Feature toggles (KNOWN_FLAGS)
/admin/settings/team         Staff + partner roster
```

---

## Organization `/admin/settings`

Edits the single `OrgSettings` row:

| Field | Notes |
|---|---|
| `companyName` | The firm's legal name. Shown in emails. |
| `legalAddress` | Used on contracts and PDFs. |
| `country` | ISO-2 (defaults `CY`). |
| `defaultLanguages` | Subset of `en / ru`. |
| `workingHours` | JSON: `{ mon: [start, end], … }` |
| `bookingSlotMinutes` | Granularity for /api/bookings/availability |
| `messageEmailEnabled` | If true, sending a message also emails the recipient. |
| `screeningThreshold` | Min match score for a hit to register (default 0.7). Higher = fewer hits. |

The form is a single page. Each change PATCHes
`/api/admin/settings/org` and logs `settings.org_updated` to the
ActivityLog.

---

## Services `/admin/settings/services`

The catalog of services the firm sells. Drives:

- The onboarding wizard's Step 1 picker
- The "add service" dropdown on `/admin/clients/[id]`
- The service filter on lists

### Per-service fields

- `key` (slug, e.g. `company_formation`) — immutable after create
- `name` (display) — editable
- `description` — editable (markdown)
- `active` (boolean) — inactive services don't appear in new pickers but
  remain on historical client records

### Add / edit / deactivate

`POST /api/admin/settings/services` (create)
`PATCH /api/admin/settings/services/[id]` (rename, description, toggle active)
`DELETE` is not exposed — set `active: false` instead. Deletion would
break historical `ClientService.serviceTypeKey` references.

---

## Feature flags `/admin/settings/flags`

Tabular toggle UI. Reads `KNOWN_FLAGS` from
`src/lib/services/settings.ts` and pairs each entry with the current
value from the `FeatureFlag` table.

Known flags today (in `KNOWN_FLAGS`):

| Key | Effect |
|---|---|
| `analytics.enable` | Renders the Analytics tab |
| `bookings.enable` | Renders the Bookings tab + portal page |
| `whatsapp.enable` | Enables Twilio WhatsApp forwarding (requires env) |
| `compliance.dual_review_required` | Sign-off requires a second staff approver |

To add a new flag:

1. Add to `KNOWN_FLAGS` in `settings.ts` (key + description).
2. Read it in code with `await getFlag("your.key")`.
3. The settings page exposes the toggle automatically.

Flags are loaded once per request via `getAllFlags()`; no caching across
requests, so a flip propagates immediately.

---

## Team `/admin/settings/team`

The roster of staff and partner accounts (`role IN ('staff','partner')`).

Per-row:

- email, full name, role
- created-at, last-login (when available)
- **Deactivate** — sets `User.deactivatedAt = now()`. Logging in is
  immediately blocked (see [03 — Roles & auth](./03-roles-and-auth.md)).
- **Reactivate** — clears `deactivatedAt`.

### Inviting a new user

"Invite" form at the top of the page:

1. Pick role (staff or partner)
2. Enter email + full name
3. The system:
   - Creates a `User` with `emailVerified = now()` (bypass verification —
     this is an internal account)
   - Creates a `PasswordReset` row
   - Emails them the reset link

When they click the link, they set a password and can sign in.

### Cannot demote / promote between staff and client

Role changes between staff/partner are allowed via this UI. Changes
between client and staff/partner are *not* — those would require
re-evaluating compliance status and aren't trivial. They must be done
via SQL with a paper trail.

---

## Where settings end and code begins

Settings are about *operational toggles the firm changes occasionally*.
Things that change once a year (cron schedules, encryption key
rotation, screening provider choice) live in environment variables, not
in Settings. The rule of thumb: if changing it requires a re-deploy, it's
env; if it should take effect within the next request, it's Settings.
