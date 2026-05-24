# 05 — Prospect onboarding

Path: `/onboarding`. Available to any signed-in user with role `prospect`.

## The 3-step wizard

```
Step 1: Services      → POST /api/onboarding/draft     (saves draft)
Step 2: Personal      → POST /api/onboarding/submit    (commitFormAnswers)
Step 3: Documents     → PUT  /api/onboarding/submit    (submitProspect)
                       → creates ComplianceFile + Party + KycCase
                       → emails the firm
                       → user is bounced to a success page
```

### Step 1 — Pick services

The user chooses one or more of:

- `immigration` — work permit, family relocation
- `company_formation` — new Cyprus / UAE entity
- `accounting` — bookkeeping, payroll, VAT
- `tax` — tax planning + filings

The selection is saved as a draft in `Prospect.servicesRequested` (the
prospect record is created lazily on first save).

### Step 2 — Personal & business details

A single form gated by the per-service Zod refinements. Required for every
prospect:

- Full legal name, date of birth, nationality, residence country,
  current address
- Business description (≥100 chars — forces them to actually describe it)
- Expected turnover bracket
- Timeline (immediately / 1-3m / 3-6m / longer)
- Source (where they heard about the firm)

Conditional fields depending on services:

| If service | Adds |
|---|---|
| `immigration` | permit type, family count |
| `company_formation` | proposed company name, shareholder count |
| `accounting` | current bookkeeper, monthly volume |
| `tax` | tax residencies (multi-select) |

The answers are stored as rows in `ProspectDetail` keyed by `fieldName`,
not as JSON. This keeps them queryable for analytics ("how many prospects
in the last 30 days asked for immigration?") without parsing.

### Step 3 — Documents

The wizard requires at minimum a `passport` and a `proof_of_address`
document. Extras (corporate certificates, share registers) can be
uploaded as `other`.

Uploads go to `POST /api/documents/upload` and are stored encrypted via
the configured storage driver. The Document row carries the storage key
+ `encMeta` (IV, auth tag, key id).

### Final submit

`PUT /api/onboarding/submit` calls `submitProspect()` which:

1. Validates that all required docs exist.
2. Sets `Prospect.status = pending`, generates a reference
   (`ORO-XXXXXX`).
3. Creates a `ComplianceFile` (status `open`) with `Party.role =
   main_contact` for the prospect themselves.
4. Creates a `KycCase` for that party.
5. Emails the staff inbox.
6. Returns the reference so the prospect can quote it in
   correspondence.

The user is then bounced to a success page showing the reference and the
expected next step (a staff member will reach out).

## What happens behind the scenes

Once submitted, the prospect appears in the admin **Submissions** tab.
From there:

- Staff can change status to `in_review`, `needs_info`, `approved`, or
  `rejected`.
- Setting `needs_info` or `rejected` emails the prospect.
- Compliance work runs in parallel — see [06 — Compliance](./06-compliance.md).
- When status reaches `approved` *and* the compliance file is `cleared`,
  the **Convert** button lights up in the submission detail view. See
  [07 — Conversion](./07-conversion.md).

## Editing after submission

A prospect can keep editing while their status is `pending` or
`needs_info`. Once a submission is `approved` or `rejected`, the form
becomes read-only — the prospect must communicate via messaging.

The dashboard at `/onboarding` after submission shows:

- Current status
- Recent activity (messages from staff, document requests)
- The original submission reference

## Documents requested mid-onboarding

If staff need additional documents *before* approval, they can issue a
`DocumentRequest` from the submission detail page. The prospect sees a
"Documents requested" panel on their onboarding page with the description
+ due date, and can upload directly into that request.

## Data retention

Prospects who are rejected are *not* deleted. Their data remains for
audit but the prospect cannot log in to advance the wizard (status is
locked). This is a compliance requirement, not a UX choice.
