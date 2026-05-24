# Client Portal v1 — Design

**Date:** 2026-05-24
**Author:** Brainstormed with Claude (superpowers:brainstorming)
**Status:** Approved — ready for implementation plan
**Triggering observation:** The portal at `/app/*` was built for prospects only. Post-conversion clients can't see active services, key dates, compliance status, document requests, or messages sent by staff (a real bug — the new staff-side composer writes `Message.clientId` which the existing portal doesn't query). v1 extends the portal so it works for both lifecycle stages.

---

## 1. Purpose

Make the client portal at `/app/*` work properly for converted Clients (in addition to its existing Prospect-stage support), so a customer can:

- See their active services, upcoming key dates, compliance status, and open document requests on a dashboard.
- Receive and reply to messages from staff in a unified thread.
- View their documents bucketed by service folder (mirroring the admin view).
- Upload requested documents (fulfilling a `DocumentRequest`) or arbitrary documents into any folder.
- Update their own profile fields (phone, address, tax residency).
- Continue to use the existing booking flow.

Out of scope (deferred): invoices (own sub-project), per-service messaging threads, message attachments, email-reply parsing, rebooking after the first consultation, archive/delete.

---

## 2. Design decisions captured during brainstorm

| Decision | Choice | Reason |
|---|---|---|
| Scope groups | Messaging fix + Client dashboard + per-folder docs + profile edit (all 4) | All gaps that hurt a converted client |
| Document upload UX | Both: fulfill open requests + arbitrary uploads | Maximum flexibility |
| Component sharing | Dedicated portal components (`src/components/client/*` or per-page) | Different palette + different controls + different invariants |
| Client-editable profile fields | `phone`, `address`, `taxResidency` | Contact info clients know best |
| Legal/contract fields | `companyName`, `registrationNumber`, `vatNumber`, `engagementLetterDate` — staff-only | Read-only on portal with "contact your account manager" tooltip |
| Messaging unification | Read `(prospectId = X OR clientId = Y)`; write to whichever ID applies to the user's stage | No backfill needed; existing messages stay |
| Notifications | Email primary staff (or pre-conversion reviewer) on client message; email on doc-request fulfillment | Symmetrical with staff→client direction |

---

## 3. Data model (no schema changes)

Every table needed already exists. The portal is purely a second consumer of existing models.

Reference of how existing fields are used by the portal:

| Model | Used for |
|---|---|
| `User` | Self-edit subset (`phone`); identity |
| `Client` | Self-edit subset (`address`, `taxResidency`); display of legal fields |
| `Prospect` | Submission display (`/app/application`); fallback when user is still a prospect |
| `ClientService` | Active services on dashboard |
| `KeyDate` | Upcoming + recent key dates on dashboard + a small list elsewhere if needed |
| `Document` | Document list (bucketed by `serviceTypeKey` and `purpose`) |
| `DocumentRequest` | Open requests block on the Documents page |
| `Message` | Unified thread (prospectId OR clientId) |
| `ComplianceFile` | Status + risk-rating pill on dashboard |
| `Booking` | Existing booking flow + dashboard upcoming-booking surface |

---

## 4. Service layer

**New file:** `src/lib/services/client-portal.ts`

Functions:

- `getClientPortalContext(userId)` — single fetch returning everything the portal pages typically need:
  ```ts
  {
    user: User,
    prospect: Prospect & { documents, bookings },
    client: (Client & { services, keyDates, documentRequests, complianceFile? }) | null,
    messages: Message[]   // unified read
  }
  ```
  Pages call this and select the slice they need. Page-specific data not in this bundle (e.g. activity log) stays as separate fetches.

- `getMessagesForUser(userId)` — unified `OR(prospectId, clientId)` read; ordered ascending; includes sender + role.

- `sendClientMessage(userId, body)` — writes `Message.clientId` if user has a Client, else `Message.prospectId`. Side-effect: best-effort email to `client.primaryStaff` (or `prospect.reviewedBy`) with subject `New message from <client name>`.

- `uploadClientDocument(userId, args)` — wraps existing `uploadDocument`. Args: `file, mime, originalName, serviceTypeKey?, fulfillsRequestId?`. Verifies the user owns the `fulfillsRequestId` (its `clientId` matches the user's Client) before passing through. Defaults `serviceTypeKey` to the request's serviceTypeKey when fulfilling. Always sets `purpose='other'` for client uploads (clients can't upload as `passport`/`POA` — those come through onboarding).

- `updateClientSelfProfile(userId, patch)` — Zod-validated whitelist: `fullName?, phone?, languagePref?, address?, taxResidency?`. The first three go to `User` (matching the existing route's behavior); `address` and `taxResidency` go to `Client` (only if a Client row exists for this user; silently skipped otherwise). Wrapped in a `$transaction` since it may span two tables.

### Activity actions used

Existing actions cover everything:
- `message.sent` (with `meta: { side: "client" }`)
- `document.uploaded` (existing)
- `doc_request.fulfilled` (existing, fired by `uploadDocument`'s fulfillment seam)
- New action: `client.self_profile_updated` (clearer than the staff-only `client.profile_updated` for audit grep)

`ActivityAction` union gains: `"client.self_profile_updated"`.

---

## 5. API surface

All under `/api/account/*` (distinct from `/api/admin/*` and `/api/onboarding/*`). Guard with `assertRole("prospect", "client")` (existing `/api/account/profile` already uses this pattern); verify ownership inside each handler.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/account/messages` | Client posts a message. Body: `{ body }`. Returns `{ ok, id }`. |
| `POST` | `/api/account/documents` | Client uploads a document. Multipart: `file`, `serviceTypeKey?`, `fulfillsRequestId?`. Returns `{ ok, documentId }`. |
| `POST` | `/api/account/profile` | **Extends the existing route.** Adds optional `address?, taxResidency?` to the existing `{ fullName, phone, languagePref }` schema. The two new fields are only persisted when the user is a Client (silently ignored for prospects since `Client` row doesn't exist). |

Error shape: `{ error: string }` with 400/422/404. Never expose Prisma internals.

---

## 6. UI changes per page

### 6.1 `ClientShell` (`src/components/client/ClientShell.tsx`)

- Accept a new optional prop `roleBadge?: "Prospect" | "Client"` rendered next to the user's name in the side header.
- Nav stays the same but the "My Application" item gets a small subtitle "(original submission)" for clients to indicate historical context.

### 6.2 `/app/dashboard`

Server component dispatches:

```tsx
const ctx = await getClientPortalContext(user.id);
if (ctx.client) return <ClientDashboard ctx={ctx} />;
return <ProspectDashboard prospect={ctx.prospect} />;
```

`ProspectDashboard` is the existing layout (kept verbatim).
`ClientDashboard` (new): renders

- Greeting + status pill ("Active client since {since}")
- Compliance pill: `Cleared` / `In review` / `Blocked` with risk rating
- 4 stat cards: Active services (count) / Upcoming key dates (count due in next 30 days) / Open document requests (count) / Unread messages from staff (count where sender.role === "staff" AND posted after last visit — for v1 just "messages from staff in the last 7 days")
- Recent activity timeline: latest 5 entries filtered to the client's user
- Inline "Book a follow-up consultation" CTA if no booking in next 14 days

### 6.3 `/app/application`

Unchanged except for a small notice at top when user is a Client: "This is your original submission. For current service status, see Dashboard."

### 6.4 `/app/messages`

- Reads via `getMessagesForUser(userId)` (unified).
- Composer wired to `POST /api/account/messages`.
- Each message renders aligned right for the client's own posts, left for staff posts, with timestamps and sender name. Distinguishes `sender.role === "staff"` styling.

### 6.5 `/app/documents`

Rewritten layout (matches admin in spirit, simpler controls):

1. **"Requested by ORO" block** at top — list of open `DocumentRequest`s for this client.
   - Each request shows: description, due date (if any), `Upload` button → file picker → fulfillment via `POST /api/account/documents` with `fulfillsRequestId`.
2. **Folder sections** — one per (KYC | each active ClientService.serviceType | Correspondence). Each folder lists docs (filename, uploaded date, status badge) with a `View` action (existing `/api/documents/[id]` route) — no delete, no status edit.
3. **Bottom: "Upload a document" button** with a folder picker that lists "General correspondence" + each active service. POSTs to `/api/account/documents` without `fulfillsRequestId`.

For both upload paths: server-side mime + size validation reuses the existing `uploadDocument` constants.

### 6.6 `/app/booking`

Unchanged.

### 6.7 `/app/settings`

`SettingsForms` extended:
- For all users: editable `fullName`, `phone`, `languagePref` (existing).
- For Clients: additional editable `address`, `taxResidency`.
- For Clients: read-only display row for `companyName`, `registrationNumber`, `vatNumber`, `engagementLetterDate` with tooltip "Contact your account manager to change". For prospects, these aren't shown.
- Save calls the (extended) `POST /api/account/profile` route with all fields in one payload.

---

## 7. Lifecycle / flows

### 7.1 Client posts a message

1. Client types in composer, hits Send.
2. `POST /api/account/messages` → `sendClientMessage(userId, body)`.
3. `Message` row written with `clientId` set (or `prospectId` if pre-conversion).
4. Email fires to primary staff (best-effort, logged on failure).
5. Activity log: `message.sent` with `meta: { side: "client", clientId }`.
6. Client page refreshes; new message appears in thread.

### 7.2 Client uploads a requested document

1. Client clicks `Upload` on an open DocumentRequest.
2. File picker → file selected.
3. `POST /api/account/documents` with multipart (file + fulfillsRequestId).
4. Handler verifies the request's `clientId` matches the user's Client (otherwise 403).
5. Calls `uploadClientDocument` → `uploadDocument` with fulfillment seam.
6. Document is created with `serviceTypeKey` inherited from the request.
7. DocumentRequest atomically flips to `fulfilled`.
8. Activity log: `document.uploaded` + `doc_request.fulfilled`.
9. Email to primary staff: "A new document has been uploaded".
10. Page refreshes; the request disappears from "Requested by ORO" and the doc appears in its folder.

### 7.3 Client uploads an arbitrary document

Same as 7.2 minus `fulfillsRequestId`. Client picks a folder explicitly.

### 7.4 Client updates profile

1. Client edits address/taxResidency in Settings.
2. Submit → `PATCH /api/account/profile`.
3. Zod schema strips anything outside the whitelist.
4. `updateClientSelfProfile` writes to Client + User in a transaction.
5. Activity log: `client.self_profile_updated`.

---

## 8. Error / edge cases

| Case | Handling |
|---|---|
| Client tries to fulfill a request that belongs to another client | 403 (verification check in API handler) |
| Client tries to upload as `passport` or `proof_of_address` | API rejects with 422 (purpose is hardcoded to `other` server-side; the API doesn't accept a `purpose` field) |
| Message body empty/whitespace | 422 |
| Empty PATCH on /api/account/profile | 200 ok (no-op) |
| User has no Prospect AND no Client | `/app/*` pages redirect to `/onboarding` (existing behavior) |
| Concurrent fulfillment (request already fulfilled while staff also uploaded) | Upload still succeeds; the second fulfillment attempt no-ops (existing seam in `uploadDocument`) |
| Email send failures | Logged; never roll back the DB write |
| User is deactivated (`User.deactivatedAt`) | Login already blocked by `next-auth` credentials authorize check — they can't reach the portal |

---

## 9. Out of scope (explicit)

- **Invoices / billing** — separate sub-project.
- **Per-service messaging threads** — flat unified thread only.
- **Message attachments** — would require schema use of `Message.attachments` + UI; defer.
- **Email-reply parsing** — clients still reply via email; replies don't land in the in-app thread.
- **Rebooking flow** on the booking page — separate cluster.
- **In-portal notifications panel / unread counts** — v1 uses "messages in the last 7 days" as the unread heuristic; a real read/unread tracker is its own design.
- **Profile change verification** — phone changes don't require re-verification; address changes don't trigger compliance re-screening (would need to be triggered by staff manually).
- **Multi-language (i18n)** — schema has `Lang` field, UI is hardcoded English; deferred.
- **Self-served archive/delete** — clients can't delete their account from the portal.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Client fulfills a request meant for someone else (security) | API handler verifies `documentRequest.clientId === user.client.id` before fulfilling |
| Activity-log noise from frequent client messages | Acceptable for v1; pagination on activity timeline keeps display manageable |
| Existing prospect-stage portal regresses | Each page dispatches: prospect-view unchanged; client-view is additive |
| The unified `OR` query is slow on big message tables | Add `@@index([clientId, createdAt])` (already exists per schema) — query plan should be fine |
| Stale unread-message count (cached) | v1 uses a "last 7 days from staff" heuristic; explicit unread tracking is its own design |
| Client uploads garbage (e.g., 9.99 MB PDFs in volume) | Existing `MAX_BYTES` + ALLOWED_MIME from `uploadDocument` enforce. Rate-limiting is on a separate v1-hardening cluster. |

---

## 11. Testing approach

- **Unit (pure):** none new — `bucketDocument` (already TDD'd) is reused.
- **Service tests with mocked Prisma + mocked email:**
  - `sendClientMessage` writes the right side (prospectId vs clientId) and fires email
  - `uploadClientDocument` rejects fulfillment of a request not owned by the user
  - `updateClientSelfProfile` writes to the right tables and rejects unknown fields
  - `getMessagesForUser` returns the unified OR result
- **API smoke:** GET/POST/PATCH on the three new routes return reasonable codes via `curl`.
- **Manual walkthrough** (per Phase 1 + 2 of the plan when written): register → submit → convert (via staff) → confirm portal now shows client view.

---

## 12. Ship gate

v1 ships when, against a live converted client in the dev stack:
- Dashboard shows ClientDashboard (not ProspectDashboard).
- Compliance pill links to staff side (or simply shows status — clients don't get to see the full compliance file).
- Sending a message from the portal: staff sees it on `/admin/clients/[id]/messages`.
- Staff sending from admin: client sees it in `/app/messages`.
- Open DocumentRequest renders on `/app/documents`; clicking Upload fulfills it.
- Arbitrary upload into Company Formation folder appears there + on admin folder view.
- Settings save for address/taxResidency/phone persists and shows up on staff client page.
- `npm test` + `npm run typecheck` green.
