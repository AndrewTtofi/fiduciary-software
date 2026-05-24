# 15 — API reference

Every JSON endpoint in the system. Auth requirements are noted per
route. Bodies follow Zod schemas in `src/lib/schema/`; this page lists
the *shape*, not the exact validators.

## Public (no auth)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness — `{ok:true,service,time}` |
| `GET` | `/api/ready` | Readiness — verifies DB connectivity |
| `POST` | `/api/auth/register` | Sign up — `registerSchema` |
| `POST` | `/api/auth/forgot` | Start password reset — always returns ok |
| `POST` | `/api/auth/reset` | Complete password reset with token |
| `*` | `/api/auth/[...nextauth]` | Auth.js handler (signin, signout, callback, session) |

## Authenticated (any role)

| Method | Path | Purpose |
|---|---|---|
| `GET` / `POST` | `/api/account/profile` | Read or update own profile |
| `POST` | `/api/account/password` | Change own password |
| `GET` / `POST` | `/api/account/messages` | Own thread |
| `GET` | `/api/account/documents` | Own documents |
| `GET` | `/api/documents/[id]` | Stream a document (decrypts on-the-fly) |
| `POST` | `/api/documents/upload` | Upload — multipart, accepts `purpose`, `serviceTypeKey`, `fulfillsRequestId` |
| `GET` | `/api/bookings/availability` | Next 14 days of free slots |
| `POST` | `/api/bookings` | Create a booking |
| `PATCH` | `/api/bookings/[id]` | Cancel / mark complete / no-show |
| `GET` / `POST` | `/api/messages` | Aggregated messages (staff/partner inbox) |

## Onboarding (`prospect` role)

| Method | Path | Purpose |
|---|---|---|
| `GET` / `POST` | `/api/onboarding/draft` | Save Step 1 (services) draft |
| `GET` | `/api/onboarding/services` | Catalog (used by Step 1) |
| `POST` | `/api/onboarding/submit` | Step 2: commit form answers |
| `PUT` | `/api/onboarding/submit` | Step 3: final submit (creates ComplianceFile) |

## Admin — submissions

| Method | Path | Purpose |
|---|---|---|
| `PATCH` | `/api/admin/submissions/[id]` | Change status / approve / reject |
| `POST` | `/api/admin/submissions/[id]/assign-partner` | Assign partner (validates role) |

## Admin — clients

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/clients/convert` | Convert prospect → client (gated by compliance) |
| `PATCH` | `/api/admin/clients/[id]` | Edit header fields |
| `GET` / `POST` | `/api/admin/clients/[id]/services` | List or add services |
| `PATCH` / `DELETE` | `/api/admin/clients/[id]/services/[serviceId]` | Edit / remove service |
| `GET` / `POST` | `/api/admin/clients/[id]/key-dates` | List / add key dates |
| `PATCH` / `DELETE` | `/api/admin/clients/[id]/key-dates/[keyDateId]` | Edit / remove key date |
| `GET` / `POST` | `/api/admin/clients/[id]/messages` | Thread + send |
| `GET` / `POST` | `/api/admin/clients/[id]/document-requests` | List / create requests |
| `GET` | `/api/admin/clients/[id]/documents` | List documents in folders |

## Admin — documents & requests

| Method | Path | Purpose |
|---|---|---|
| `GET` / `DELETE` | `/api/admin/documents/[id]` | Stream (staff inspection) / delete |
| `PATCH` | `/api/admin/document-requests/[id]` | Cancel OR edit (`description`, `dueAt`) |

## Admin — compliance

| Method | Path | Purpose |
|---|---|---|
| `GET` / `PATCH` | `/api/admin/compliance/files/[id]` | Get / update file |
| `POST` | `/api/admin/compliance/files/[id]/parties` | Add a party |
| `POST` | `/api/admin/compliance/files/[id]/recompute-risk` | Recompute (no override) |
| `POST` | `/api/admin/compliance/files/[id]/risk` | Manually set risk + reason |
| `POST` | `/api/admin/compliance/files/[id]/sign-off` | Finalise — cleared or blocked |
| `PATCH` | `/api/admin/compliance/parties/[id]` | Edit a party |
| `GET` / `POST` | `/api/admin/compliance/parties/[id]/documents` | Per-party docs |
| `PATCH` | `/api/admin/compliance/parties/[id]/kyc` | Toggle KYC check booleans |
| `POST` | `/api/admin/compliance/parties/[id]/screen` | Trigger a screening run |
| `PATCH` | `/api/admin/compliance/hits/[id]` | Set hit review status |
| `PATCH` | `/api/admin/compliance/tasks/[id]` | Close / dismiss a ReviewTask |

## Admin — notes

| Method | Path | Purpose |
|---|---|---|
| `GET` / `POST` | `/api/admin/notes` | Per-entity internal notes |

## Admin — settings

| Method | Path | Purpose |
|---|---|---|
| `GET` / `PATCH` | `/api/admin/settings/org` | OrgSettings singleton |
| `GET` / `POST` | `/api/admin/settings/services` | List / create services |
| `PATCH` / `DELETE` | `/api/admin/settings/services/[id]` | Edit / deactivate |
| `PATCH` | `/api/admin/settings/flags/[key]` | Toggle a feature flag |
| `GET` | `/api/admin/settings/team` | Team roster |
| `PATCH` | `/api/admin/settings/team/[id]` | Deactivate / reactivate / change role |

## Admin — users

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/users/[id]/verify` | Manually verify an unverified email |

## Test-only (dev/test environments)

Gated by `NODE_ENV === "test"` OR `ALLOW_TEST_RESET=1`. Return 404 otherwise.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/test/reset` | TRUNCATE every domain table. `?seed=1` re-seeds minimal accounts |
| `POST` | `/api/test/setup-client` | Fast path to create a cleared client for E2E tests |

## Response conventions

- **Success:** `{ ok: true, ...payload }` (or just the payload, e.g. `{ id, ... }`)
- **Validation error:** 422 with `{ error: "msg" }` or `{ error, fields: { field: ["msg"] } }`
- **Auth missing:** 401 with `{ error: "UNAUTHENTICATED" }`
- **Role wrong:** 403 with `{ error: "FORBIDDEN" }`
- **Not found:** 404 with `{ error: "Not found" }`
- **Conflict:** 409 with `{ error: "..." }`
- **Server error:** 500 with `{ error: "Internal error" }` (never leak details)

## Error code map (for the compliance gate)

| Code | Meaning | Returned by |
|---|---|---|
| `COMPLIANCE_NOT_CLEARED` | File status ≠ cleared | `convertProspectToClient` |
| `RISK_UNSET` | riskRating is null | `convertProspectToClient` |
| `PROSPECT_NOT_APPROVED` | status ≠ approved | `convertProspectToClient` |
| `ALREADY_CONVERTED` | Prospect already has a Client | `convertProspectToClient` |
| `COMPLIANCE_INCOMPLETE` | Sign-off pre-conditions fail | `signOff` |

## Rate limiting

`POST /api/auth/register`, `/api/auth/forgot`, `/api/auth/reset` are
rate-limited by IP via `rateLimit()` in `src/lib/rate-limit.ts` (in-memory
bucket; 5/600s by default). For production, swap the backend for Redis.
