# 06 — Compliance / KYC / AML

The compliance subsystem is the largest single piece of business logic in
the app. It lives in `src/lib/services/compliance/` and is rendered via
the `src/components/compliance/*` components. This page is the canonical
reference.

## Domain entities

```
ComplianceFile  (status, riskRating)
  └── Party  (role, type)
        ├── KycCase  (state, individual check booleans)
        │     └── ScreeningRun  (outcome)
        │           └── ScreeningHit  (reviewStatus)
        ├── Document
        └── (back-ref) ReviewTask
```

A `ComplianceFile` exists from the moment a prospect submits Step 3 of
onboarding. It evolves through `open → in_review → cleared` (or
`blocked`). Risk rating is assigned by `computeRisk()` and may be
overridden manually.

## States

```
ComplianceStatus      open → in_review → cleared
                                       ↘ blocked

RiskRating            null → low / standard / high
                          (computed, optionally overridden by staff)

KycCaseState          pending → passed
                              ↘ failed
                              ↘ waived

ScreeningOutcome      clean | hits | error

HitReviewStatus       pending → cleared
                              ↘ confirmed
```

## Surfaces

- **Admin submissions side:** `/admin/submissions/[ref]/compliance` (per
  prospect)
- **Admin clients side:** `/admin/clients/[id]/compliance` (per client)
- **Per-party drilldown:** `/admin/.../compliance/parties/[partyId]`
- **Cross-file work queue:** `/admin/compliance/tasks`

All of these render the same `ComplianceDashboard` component, so behaviour
stays consistent between submissions and clients.

## Risk model

`src/lib/services/compliance/risk.ts` defines the risk band:

| Factor | Weight |
|---|---|
| Sanctions hits | high — always elevates to `high` |
| PEP-adjacent | high |
| Tax-haven nationality / residency | + medium |
| Cash-intensive business sector | + medium |
| Source-of-funds undocumented | + medium |
| Source country FATF list | + medium |
| Otherwise | low |

The function `computeRisk(file)` aggregates these into one of
`low / standard / high`. The result is persisted via
`persistComputedRisk()` (which writes to `ComplianceFile.riskRating` and
logs `compliance.risk_recomputed` to ActivityLog).

### Overrides

Staff can override the computed rating via `POST /api/admin/compliance/files/[id]/risk`.
The override:

- Updates `riskRating`
- Logs `compliance.risk_overridden` with `before`, `after`, `reason`,
  `escalated`
- Surfaces in the override-history block on the RiskPanel

The override is **not** reset by the next `recompute-risk` call. Staff
have to manually re-apply the computed value if they want to "unoverride".

## Screening

`POST /api/admin/compliance/parties/[id]/screen` triggers a fresh
`ScreeningRun` for a Party. The driver is configurable:

- `SCREENING_DRIVER=opensanctions` (default) — uses the free
  OpenSanctions API if `OPENSANCTIONS_API_KEY` is set, otherwise a
  deterministic mock that emits hits for any name containing the string
  `"sanctioned"`. The mock is the right choice for tests and demos.

A run produces:

- `ScreeningRun(outcome: clean | hits | error)`
- 0..N `ScreeningHit` rows with `reviewStatus: pending`

The Party's `latestScreeningRunId` is updated to point at the new run for
fast list-page rendering.

### Hit deduplication

`src/lib/services/compliance/hit-dedup.ts` carries `diffHitsForAlert(prev, next)`.
The auto-rescreen worker calls this to decide whether new/changed hits
warrant a new `ReviewTask`. If the same hits keep matching, no new task
is created — preventing a queue spam loop.

### Hit review

Each `ScreeningHit` carries `reviewStatus: pending → cleared / confirmed`.
Cleared means staff determined it's a false-positive; confirmed escalates
to the file (and via `riskRating` re-computation, the file as a whole).

## KYC cases

A `KycCase` tracks the state of a single Party. The individual checks
are stored as a small set of fields:

- `idVerified` — passport / ID seen
- `addressVerified` — proof-of-address validated
- `sanctionsScreened` — at least one ScreeningRun with `outcome ∈ {clean, hits}`
- `sourceOfFundsDocumented` — SoF docs uploaded + reviewed

The case state is computed:

- `passed` — all checks true, no unreviewed hits, risk known
- `failed` — at least one hit `reviewStatus=confirmed`, OR a check
  explicitly failed
- `waived` — staff override for exceptional cases
- `pending` — otherwise

`POST /api/admin/compliance/parties/[id]/kyc` updates the checks; the case
state recomputes from them.

## Sign-off

The final compliance step is sign-off:

`POST /api/admin/compliance/files/[id]/sign-off` with `{ outcome: "cleared" | "blocked" }`.

`signOff()` validates:

1. Risk rating is set.
2. Every Party has a `passed` or `waived` KycCase.
3. No `ReviewTask` of kind `screening_hit` is open.

If those hold, it sets `ComplianceFile.status = cleared` and logs
`compliance.cleared`. Otherwise it returns `COMPLIANCE_INCOMPLETE` with a
reason array, and the SignOffPanel shows them as a checklist of remaining
work.

`blocked` is the opposite — it freezes the file and prevents conversion.

## ReviewTask queue

`/admin/compliance/tasks` is the cross-file work queue. It surfaces:

- All `ReviewTask` rows with `state=open`, ordered by `dueAt`.
- The triggering kind (screening hit, info missing, doc expiring,
  overdue risk-band review).
- A direct link to the relevant Party/File.

Closing a task: `PATCH /api/admin/compliance/tasks/[id]` with `{ state:
"done" }` or `{ state: "dismissed" }`. The dispatch decision is up to the
officer — there's no automation that closes tasks for them.

## Worker integration

Three jobs run on the worker process (see [14 — Worker jobs](./14-worker-jobs.md)):

- **`auto-rescreen`** — every hour. Finds passed KycCases whose latest
  screening is older than the band cadence (high=30d, standard=90d,
  low=365d), re-screens them, and opens a ReviewTask when the hit set
  changes.
- **`periodic-review`** — daily. Opens a `risk_overdue` ReviewTask for
  cleared files whose annual review is overdue.
- **`backfill-compliance`** — daily, idempotent. Catches up legacy
  clients that pre-date the compliance subsystem and don't yet have a
  ComplianceFile.

## The dashboard

`ComplianceDashboard.tsx` is the workhorse component. It shows:

- The file's overall status + risk rating
- The RiskPanel (current rating, recompute button, override form,
  override history)
- A PartiesTable with one row per Party showing:
  - role, name, KycCase state pill
  - latest screening outcome
  - `N to review` red pill when there are unreviewed hits
  - `last Xd ago · next: Yd` (or `overdue` in red) per the band cadence
  - link to the party detail page
- The SignOffPanel (only enabled when all gates are green)

## Conversion gate

`src/lib/services/compliance/gate.ts` exports `assertConvertible(prospect)`:

```ts
if (prospect.complianceFile.status !== "cleared") throw new Error("COMPLIANCE_NOT_CLEARED");
if (!prospect.complianceFile.riskRating) throw new Error("RISK_UNSET");
```

This is the only gate. It's called by `convertProspectToClient()` and
covered by `src/lib/services/__tests__/conversion-gate.test.ts`.
