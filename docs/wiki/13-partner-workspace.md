# 13 — Partner workspace

Path: `/partner/*`. Access requires `role = partner`. Sign in with
`partner@oro.local` / `oroDemo!1`.

## Why partners exist

Some services (immigration permits, audit signatures, regulated tax
filings) require an external partner — a lawyer, an auditor, an
immigration consultant. The firm assigns one partner per
`ClientService`. The partner sees only the clients they're assigned to,
not the full roster.

## Pages

```
/partner                clients list (only assigned ones)
/partner/clients/[id]   per-client view (subset of admin view)
/partner/settings       partner's own profile + password
```

## List page `/partner`

Shows every `Client` where at least one `ClientService.assignedPartnerId
= currentUser.id`. Per row: company name, primary contact, the services
this partner owns (not all services), status.

## Per-client view `/partner/clients/[id]`

A narrower version of the admin client page:

**Visible:**
- Company header (read-only — they can't rename the client)
- The services *they* own (not all services)
- Key dates relevant to those services
- Documents in folders, but only with purposes relevant to their work
- Messaging thread (full thread, since the client only has one)
- Internal notes — they can read but not all (the visibility filter
  shows notes authored by staff for partners, plus their own notes)

**Hidden:**
- Compliance — partners don't run KYC; staff do
- Risk overrides
- Sign-off
- Other partners' services
- Settings tabs
- Analytics

## What partners can do

- Send messages to the client (and to staff via internal notes)
- Mark *their* services as `in_progress` / `completed`
- Upload documents into the engagement folder for their service
- Create / edit key dates tied to their service

## What partners cannot do

- Edit other partners' services
- Change a client's status
- Cancel services
- Touch the compliance file
- Convert prospects
- Access the admin panel
- Manage team / settings

Backend enforcement: every partner-facing API checks that the
`Client`/`ClientService` in question has `assignedPartnerId =
currentUser.id`. If not, returns 403.

## Onboarding a new partner

A partner account is created by staff in **Settings → Team**:

1. Click "Invite partner"
2. Enter email + name
3. The system creates a `User` with `role: partner`, emailVerified set
   (the manual creation skips the verification email), and emails them
   a password-reset link.
4. They click the link, set a password, and can sign in.

Assigning them to a client happens separately via the per-service
partner picker on `/admin/clients/[id]` or `/admin/submissions/[ref]`.

## The role check on assign-partner

`POST /api/admin/submissions/[id]/assign-partner` validates that the
target user's role is `partner` before updating. Without this guard, any
user UUID would be accepted — a bug we caught in PR #4 and fixed in
Bucket A.
