# 04 — Data model

The single source of truth is `prisma/schema.prisma`. This page maps the
business concepts to the schema so you don't have to read 500 lines of
Prisma DSL to find what you need.

## The big picture

```
User ──┬─ Prospect ─── ProspectDetail
       │              \
       │               └─ Document
       │
       ├─ Client ── ClientService ── (assigned Partner)
       │         ├─ KeyDate
       │         ├─ Document
       │         ├─ DocumentRequest
       │         ├─ Message
       │         ├─ InternalNote
       │         └─ Booking
       │
       └─ (also as primaryStaff / assignedPartner)

Prospect ──┐
           ├─ ComplianceFile ── Party ── KycCase ── ScreeningRun ── ScreeningHit
Client   ──┘                                 └─ Document
                                            └─ ReviewTask
```

## Entity catalog

### Identity

- **`User`** — every human in the system. One per email. `role` is the
  only field that gates UI / authz. `deactivatedAt` is a soft-delete that
  blocks login while preserving history.

- **`Account`, `Session`** — Auth.js adapter tables. Not authoritative;
  JWT carries the real session.

- **`VerificationToken`** — email-verification tokens (hashed). One-shot,
  expires in 24h.

- **`PasswordReset`** — password-reset tokens (hashed). Expires in 1h.

### Pipeline

- **`Prospect`** — a user who's started or completed onboarding. Owns
  `ProspectDetail` (key-value form answers), `Document` (passport, POA,
  optional extras), and links 1:1 with `ComplianceFile`.

- **`ProspectDetail`** — flat key-value answers keyed by `fieldName`. The
  set of fields is enforced by the Zod schemas in
  `src/lib/schema/onboarding.ts`, not by the database.

- **`Client`** — a converted prospect. Owns operational artefacts:
  services, key dates, documents, messages, internal notes, bookings.
  `primaryStaffId` points to the account manager; per-service
  `assignedPartnerId` points to the external partner.

- **`ClientService`** — many-to-many between `Client` and the services the
  firm sells. `serviceTypeKey` references the human-key in `Service`
  (e.g. `"company_formation"`). `status` is the per-service workflow
  (pending / in_progress / completed).

- **`KeyDate`** — calendar markers per client (deadlines, renewals).
  Bound to a service or free-standing. Status is one of `upcoming /
  overdue / completed`.

### Documents

- **`Document`** — uploaded files. Belongs to either a `Prospect` or a
  `Client`. Encrypted at rest (`encMeta` carries the GCM IV + auth tag +
  key id). `type` is the original DocType enum (`passport / proof_of_address
  / other`), kept for backward compatibility with the onboarding wizard.

- **`DocPurpose`** — finer-grained classification (`passport`,
  `proof_of_address`, `source_of_funds`, `kyc_internal`, `other`).
  Replaces `type` for new uploads.

- **`DocumentRequest`** — a staff-issued ask for a specific document
  from a client. Has `state` (open / fulfilled / cancelled), `dueAt`,
  optional `serviceTypeKey`. Fulfilment is *atomic with upload*: when a
  client uploads a doc that names `fulfillsRequestId`, the upload
  service marks the request fulfilled in the same transaction.

### Compliance

- **`ComplianceFile`** — the KYC dossier. One per prospect/client.
  Carries `status` (`open / in_review / cleared / blocked`) and
  `riskRating` (`low / standard / high`). Owns all parties.

- **`Party`** — a real-world person or entity attached to the file
  (the prospect themselves, UBOs, directors, signatories…). Each
  party has a `role` (PartyRole) and a `type` (individual / entity).

- **`KycCase`** — the in-progress checks against a Party. `state` is
  `pending / passed / failed / waived`. Tracks individual `KycCheckStatus`
  bools (id verified, address verified, sanctions screened, source-of-funds
  documented).

- **`ScreeningRun`** — one execution of the sanctions screening against
  one Party. Owns the hits it produced. The latest run per Party is
  referenced by `Party.latestScreeningRunId` for fast lookup.

- **`ScreeningHit`** — a single match returned by the screener. Includes
  the matched topics, the upstream `externalId`, the dataset, the score,
  and a `reviewStatus` (`pending / cleared / confirmed`).

- **`ReviewTask`** — a work item for a compliance officer. Kinds:
  `screening_hit` (a new hit needs review), `risk_overdue`, `info_missing`,
  `document_expiring`. Has `state` (`open / done / dismissed`) and `dueAt`.

### Operational

- **`Message`** — a single message in a client conversation. Sender is
  any user; recipients are derived from the client + their assigned staff.

- **`InternalNote`** — staff-only annotations on a Prospect or Client.
  Never visible to the subject.

- **`Booking`** — calendar slots clients can book (consult, follow-up,
  signing). `status` is `confirmed / completed / no_show / cancelled`.

- **`ActivityLog`** — append-only event store. **Every domain write logs
  here.** Used to render activity feeds, the risk-override history, the
  per-submission audit trail, and the compliance dashboard timeline.

### Settings

- **`OrgSettings`** — single-row table for firm-wide configuration
  (company name, address, default languages). Read with
  `getOrgSettings()` in `src/lib/services/settings.ts`.

- **`Service`** — the catalogue of services the firm sells (immigration,
  company formation, accounting, tax, …). Keyed by a human slug.

- **`FeatureFlag`** — small toggle table. `KNOWN_FLAGS` in
  `services/settings.ts` enumerates what's recognised; the UI in
  `/admin/settings/flags` reads from this list.

## Enums you'll meet often

```
ProspectStatus       pending | approved | needs_info | rejected
ClientStatus         active | on_hold | completed
SvcStatus            pending | in_progress | completed
KeyDateStatus        upcoming | overdue | completed
ComplianceStatus     open | in_review | cleared | blocked
RiskRating           low | standard | high
PartyRole            main_contact | ubo | director | shareholder | signatory | intermediary
KycCaseState         pending | passed | failed | waived
ScreeningOutcome     clean | hits | error
HitReviewStatus      pending | cleared | confirmed
ReviewTaskKind       screening_hit | risk_overdue | info_missing | document_expiring
DocPurpose           passport | proof_of_address | source_of_funds | kyc_internal | other
```

## Lifecycle in one diagram

```
sign-up   ──▶ User(prospect) ──┐
                               │
fill-form ──▶ ProspectDetail ──┤
                               │
upload    ──▶ Document          ▶ ┌──────────────────┐
                                  │ submitProspect() │
submit    ──▶ Prospect(pending) ──▶                  │
                                  │ creates          │
                                  │  ComplianceFile, │
                                  │  Party, KycCase  │
                                  └──────────┬───────┘
                                             │
staff approves submission                    │
   Prospect.status = approved                ▼
                                  ┌──────────────────────┐
                                  │ ComplianceFile.status│
   compliance officer screens     │   open → in_review   │
   parties, reviews hits          │   → cleared          │
                                  └──────────┬───────────┘
                                             │
   convert() service                         ▼
   (requires status=approved              gate check
    AND ComplianceFile.cleared)               │
                                              ▼
                                         User.role = client
                                         Client row created
                                         ClientService rows
                                         KeyDate rows
```

## Transactions

Whenever a write spans multiple tables (e.g. converting a prospect, signing
off compliance, creating a key date with an activity log entry), the
service wraps the writes in `prisma.$transaction(async (tx) => { ... })`.
Tests inject a transaction client via `wrapTx(tx)` so the same code path
runs inside a rollback transaction without changes — see
`src/test/tx.ts`.

## Where to add a new entity

1. Add the model to `prisma/schema.prisma` (include `createdAt`/`updatedAt`).
2. Run `npx prisma db push` (dev) or write a migration (prod).
3. Add a service in `src/lib/services/` that owns its CRUD.
4. Expose via a thin route handler in `src/app/api/`.
5. Always log writes via `logActivity(...)`.
6. Add tests next to the service (`__tests__/`).
