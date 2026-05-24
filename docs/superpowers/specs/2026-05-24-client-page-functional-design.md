# Client Detail Page — Full Functionality — Design

**Date:** 2026-05-24
**Author:** Brainstormed with Claude (superpowers:brainstorming)
**Status:** Approved — ready for implementation plan
**Triggering observation:** The admin client detail page (`/admin/clients/[id]`) contains multiple dead links, stubbed buttons (`alert(...)`), unrendered anchor targets, and read-only sections where edit/CRUD is required for the admin role to actually manage clients. This spec defines a two-phase rewrite that closes all gaps on that page.

---

## 1. Purpose

Make every UI element on the admin client detail page functionally complete, so a staff member can manage the full client relationship from that one page:

- Edit profile (company info, country, registration/VAT numbers, tax residency, engagement letter).
- Manage Services Engaged: add, edit, remove, reassign partner.
- Manage Key Dates: add, edit, mark complete, delete, filter.
- Manage Documents per service folder: upload, view inline, set status, delete; create/track document requests.
- Reach the existing Compliance file from this page (currently orphaned).
- Send messages to the client (Phase 2).
- Request documents from the client (Phase 2).

Out of scope (deferred to later sub-projects): staff-initiated booking creation, archive/delete client, the client-side portal (clients reading their own data and replying).

---

## 2. Design decisions captured during brainstorm

| Decision | Choice | Reason |
|---|---|---|
| Scope groups in this iteration | A + B + C + D + G (Phase 1) and E + F (Phase 2) | All gaps on the visible client page; everything else is its own sub-project |
| Documents UI shape | Per-folder collapsible sections with real `id="docs-X"` anchors | Matches existing folder-grid mental model; the URL fragments the user is hitting actually work |
| Messaging shape | One thread per client | Simplest; matches existing flat `Message` model |
| Document-request model | Separate `DocumentRequest` table | Keeps `Document` fields NOT-NULL; cleanly auditable; supports state transitions |
| Service taxonomy source for Add Service | DB-backed `prisma.service` (active=true) | The Settings-built Service table is the source of truth |
| Profile fields | Company, country, address, registrationNumber, vatNumber, taxResidency, engagementLetterDate, phone | All four field-groups the user picked |
| Key-date row actions | Mark complete, edit, delete + filter | Full row-level control |
| Reassign team | Replace `alert()` with a real modal that picks primary staff + links into per-service partner assignment | Don't duplicate the per-service UI |

---

## 3. Data model

### 3.1 `Client` (extend)

| Field | Type | Notes |
|---|---|---|
| `country` | `String?` | ISO 3166-1 alpha-2; country of incorporation |
| `address` | `String?` | Registered address (free text) |
| `registrationNumber` | `String?` | Cyprus HE registry number |
| `vatNumber` | `String?` | EU VAT identifier |
| `taxResidency` | `String?` | ISO 3166-1 alpha-2; tax-residency country |
| `engagementLetterDate` | `DateTime?` | Date the engagement letter was signed |

### 3.2 `Document` (extend)

| Field | Type | Notes |
|---|---|---|
| `serviceTypeKey` | `String?` | Matches `Service.key` from the DB-backed taxonomy. Buckets the doc into a service folder on the client page. Null = no service folder (Correspondence / general). |

(Existing `partyId` + `purpose` continue to drive KYC bucketing.)

### 3.3 New model — `DocumentRequest`

```prisma
model DocumentRequest {
  id                  String    @id @default(uuid())
  clientId            String
  client              Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  description         String
  serviceTypeKey      String?
  requestedById       String
  requestedBy         User      @relation("DocRequestedBy", fields: [requestedById], references: [id])
  dueAt               DateTime?
  state               DocumentRequestState @default(open)
  fulfilledById       String?
  fulfilledAt         DateTime?
  fulfilledDocumentId String?   @unique
  fulfilledDocument   Document? @relation("DocRequestFulfilledDoc", fields: [fulfilledDocumentId], references: [id])
  createdAt           DateTime  @default(now())

  @@index([clientId, state])
}

enum DocumentRequestState {
  open
  fulfilled
  cancelled
}
```

`User` gains a back-relation `DocumentRequest[] @relation("DocRequestedBy")`. `Document` gains an inverse `DocumentRequest? @relation("DocRequestFulfilledDoc")`.

### 3.4 Existing models — no further changes

`ClientService`, `KeyDate`, `Message` already have all fields needed for the new actions. We rely on existing fields:
- `ClientService.status` / `assignedPartnerId` / `startDate` / `notes`
- `KeyDate.description` / `dueDate` / `status`
- `Message.prospectId` / `clientId` / `senderId` / `body` / `attachments`

---

## 4. Page layout (Phase 1)

Two-column structure preserved. What each section becomes:

**Main column (top → bottom):**

1. **EditableClientHeader** — pencil-icon-to-form-in-place edit for: `companyName`, `country`, `address`, `registrationNumber`, `vatNumber`, `taxResidency`, `engagementLetterDate`, `User.phone`. Save → `PATCH /api/admin/clients/[id]`.
2. **ComplianceBar** — server component. Reads `ComplianceFile.status` + `riskRating`. Renders a single row: status pill + risk-rating badge + `→ Open compliance file` link to `/admin/clients/[id]/compliance`.
3. **ServicesEngagedList** — per-row inline edit (status select, partner picker, notes input), delete confirm. **+ Add service** button opens `AddServiceModal` (service picker sourced from active `Service` taxonomy + optional partner + optional startDate + notes).
4. **KeyDates section** — filter chip "Hide completed" at top. Per-row actions: `Mark complete`, `Edit` (inline form for description + dueDate), `Delete`. Existing add form retained.
5. **DocumentsSection** — folder grid at top still serves as a quick-jump. Below it, one `<section id="docs-X">` per folder (KYC, each active service, Correspondence). Each section contains:
   - Heading + count + `Upload` button (file picker; mime + size validation reused from `uploadDocument`).
   - `DocumentRow` list: filename, type, size, uploaded-at, status badge, `View` (inline iframe via existing signed-URL doc route), `Set status` (`received` / `under_review` / `approved` / `reupload_needed`), `Delete`.
   - "Open requests" sub-block when `DocumentRequest`s exist for this folder: description + due date + `Mark cancelled`.
6. **Consultation History** — unchanged (display only).

**Right sidebar:**

- **ClientStatusPanel** — keeps the status select. "Reassign / Manage Team" `alert()` replaced by `ReassignModal`: picks primary staff from staff list; per-service partner assignment links into each ServicesEngagedList row's partner picker (no duplicated UI).
- **ClientNotes** — unchanged.
- **ClientActivity** — unchanged.
- **QuickActions** — all wired:
  - `Send Message` → `/admin/clients/[id]/messages` (Phase 2)
  - `Request Docs` → `/admin/clients/[id]/request-docs` (Phase 2)
  - `Add Service` → opens `AddServiceModal`
  - `Add Key Date` → scrolls to + focuses the existing add form

---

## 5. API surface

All routes require `assertRole("staff")`. All mutations log to `ActivityLog`.

### 5.1 Existing route — extended

| Method | Path | Purpose |
|---|---|---|
| `PATCH` | `/api/admin/clients/[id]` | Today: accepts `status`. Extend to accept any of: `companyName`, `country`, `address`, `registrationNumber`, `vatNumber`, `taxResidency`, `engagementLetterDate`, `primaryStaffId`, plus `phone` (proxied to `User.phone`). |

### 5.2 New routes — Phase 1

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/clients/[id]/services` | Add ClientService row |
| `PATCH` | `/api/admin/clients/[id]/services/[serviceId]` | Edit row (status / partner / startDate / notes) |
| `DELETE` | `/api/admin/clients/[id]/services/[serviceId]` | Remove row (leaves docs intact — they reference `serviceTypeKey` string, not FK) |
| `PATCH` | `/api/admin/clients/[id]/key-dates/[keyDateId]` | Edit description / dueDate / status |
| `DELETE` | `/api/admin/clients/[id]/key-dates/[keyDateId]` | Delete |
| `POST` | `/api/admin/clients/[id]/documents` | Staff multipart upload; body fields: `file`, `serviceTypeKey?`, `purpose?`, `fulfillsRequestId?` |
| `PATCH` | `/api/admin/documents/[id]` | Set status and/or re-bucket serviceTypeKey |
| `DELETE` | `/api/admin/documents/[id]` | Remove (unlinks any DocumentRequest fulfillment) |

### 5.3 New routes — Phase 2

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/clients/[id]/messages` | Fetch full thread |
| `POST` | `/api/admin/clients/[id]/messages` | Staff sends a message; creates `Message` + fires email via `NotificationProvider` |
| `POST` | `/api/admin/clients/[id]/document-requests` | Create a DocumentRequest; emails client |
| `PATCH` | `/api/admin/document-requests/[id]` | Cancel or update due date |

Fulfillment flow: when `POST /api/admin/clients/[id]/documents` is called with `?fulfillsRequestId=X` (or body field), the upload service atomically writes the `Document` row AND marks the request `fulfilled` with the new document id.

---

## 6. Service-layer organisation

| File | Functions |
|---|---|
| `src/lib/services/clients.ts` (existing — extend) | `updateClientProfile(clientId, patch, actorId)`, `updatePrimaryStaff(clientId, primaryStaffId, actorId)` |
| `src/lib/services/client-services.ts` (new) | `addClientService`, `updateClientService`, `removeClientService` |
| `src/lib/services/key-dates.ts` (new) | `updateKeyDate`, `deleteKeyDate` |
| `src/lib/services/documents.ts` (existing — extend) | `uploadDocument` accepts `serviceTypeKey` + optional `fulfillsRequestId`; new `setDocumentStatus`, `deleteDocument` |
| `src/lib/services/document-requests.ts` (new) | `createRequest`, `cancelRequest`, `fulfillRequest` (called from upload path) |
| `src/lib/services/messages.ts` (new) | `sendMessage(clientId, senderId, body, attachments?)`, `listThread(clientId)` |

Each new mutating function emits an ActivityLog entry.

### 6.1 ActivityLog actions added

Extend `ActivityAction` union in `src/lib/services/activity.ts`:

- `client.profile_updated`
- `client.primary_staff_changed`
- `client.service_updated`, `client.service_removed`
- `client.key_date_updated`, `client.key_date_completed`, `client.key_date_deleted`
- `document.deleted`
- `message.sent`
- `doc_request.created`, `doc_request.cancelled`, `doc_request.fulfilled`

`entityType` gains `"message"` and `"doc_request"`.

(`client.created`, `client.status_changed`, `client.service_added`, `client.key_date_added`, `document.uploaded`, `document.viewed`, `document.status_changed` already exist.)

---

## 7. UI components

### 7.1 New / rewritten components

| Component | Type | File |
|---|---|---|
| `EditableClientHeader` | client | `src/app/admin/clients/[id]/EditableClientHeader.tsx` |
| `ComplianceBar` | server | `src/app/admin/clients/[id]/ComplianceBar.tsx` |
| `ServicesEngagedList` | server wrapping `ServiceRowClient` | `src/app/admin/clients/[id]/ServicesEngagedList.tsx` |
| `ServiceRowClient` | client (inline edit) | `src/app/admin/clients/[id]/ServiceRowClient.tsx` |
| `AddServiceModal` | client | `src/app/admin/clients/[id]/AddServiceModal.tsx` |
| `KeyDatesSection` | server wrapping `KeyDateRowClient` + filter chip | `src/app/admin/clients/[id]/KeyDatesSection.tsx` |
| `KeyDateRowClient` | client | `src/app/admin/clients/[id]/KeyDateRowClient.tsx` |
| `DocumentsSection` | server | `src/app/admin/clients/[id]/DocumentsSection.tsx` |
| `FolderSection` | server (per service / KYC / Correspondence) | `src/app/admin/clients/[id]/FolderSection.tsx` |
| `DocumentRow` | client | `src/app/admin/clients/[id]/DocumentRow.tsx` |
| `UploadButton` | client | `src/app/admin/clients/[id]/UploadButton.tsx` |
| `ReassignModal` | client | `src/app/admin/clients/[id]/ReassignModal.tsx` |
| `QuickActions` | client (was server) | `src/app/admin/clients/[id]/QuickActions.tsx` (replaces inline functions in `page.tsx`) |

### 7.2 New pages

| Path | Purpose |
|---|---|
| `/admin/clients/[id]/messages` | Thread view + composer (Phase 2) |
| `/admin/clients/[id]/request-docs` | Create request + list of open requests (Phase 2) |

### 7.3 Page assembly

`src/app/admin/clients/[id]/page.tsx` is reduced to a thin server component that fetches everything once and passes down. Heavy lifting moves into the new components above.

---

## 8. Lifecycle / flows

### 8.1 Profile edit flow

1. Staff clicks pencil icon on header.
2. Header swaps to inline form (`<EditableClientHeader>` flips state).
3. Submit → `PATCH /api/admin/clients/[id]` with changed fields only.
4. Server runs Zod validation, writes via `updateClientProfile`, logs `client.profile_updated` activity.
5. Returns 200; component swaps back to display.

### 8.2 Add service flow

1. Staff clicks "+ Add service".
2. `AddServiceModal` opens; fetches active `Service[]` from `prisma.service.findMany({ where: { active: true } })` (server-rendered modal trigger or fetched on open).
3. Staff picks service, optional partner, optional startDate, optional notes.
4. Submit → `POST /api/admin/clients/[id]/services`.
5. `addClientService` creates row + logs `client.service_added`.
6. Modal closes, list re-fetches.

### 8.3 Document upload flow (per folder)

1. Staff clicks `Upload` in a folder section.
2. File picker → file selected.
3. Multipart POST to `/api/admin/clients/[id]/documents` with `serviceTypeKey` (or `purpose=passport/poa/sof` for KYC), file.
4. Route validates (mime/size from existing constants), calls `uploadDocument` (encrypted local storage / S3), creates `Document` row with `serviceTypeKey` set.
5. If `fulfillsRequestId` provided, atomically marks `DocumentRequest` `fulfilled`.
6. Returns the new doc; folder re-fetches.

### 8.4 Document request flow (Phase 2)

1. Staff goes to `/admin/clients/[id]/request-docs`.
2. Fills form: description, optional service-folder, optional dueAt.
3. `POST /api/admin/clients/[id]/document-requests` → row created + email sent (template: "ORO has requested a document from you: [description]. Upload here: [link]").
4. Request shows up in the relevant folder's "Open requests" sub-block on the main client page.
5. Later: client uploads via portal (future) or staff uploads on their behalf with `fulfillsRequestId` → request flips to `fulfilled`.

### 8.5 Message flow (Phase 2)

1. Staff clicks "Send Message" (or visits `/admin/clients/[id]/messages` directly).
2. Composer at bottom of thread; submit → `POST /api/admin/clients/[id]/messages`.
3. `sendMessage` writes `Message` row + emails client (`NotificationProvider`).
4. Thread re-renders with new message at top.
5. Client replies via email (out of band for now; portal sub-project will add in-thread reply).

---

## 9. Error / edge cases

| Case | Handling |
|---|---|
| Delete a service that still has documents (`serviceTypeKey` matches) | Allowed — the docs lose folder bucketing and fall into Correspondence. Activity log notes the orphan count. |
| Edit profile with invalid country code | Zod validates ISO 3166-1 alpha-2 → 422. |
| Upload doc exceeding 10MB | Existing `MAX_BYTES` check → 413. |
| Fulfill a request that's already `fulfilled` | Idempotent: upload succeeds, request stays `fulfilled`, no double-log. |
| Cancel a request that's `fulfilled` | Rejected with 400. |
| Send empty message | Zod min(1) → 422. |
| Reassign primary staff to a non-staff user | Server-side check (target.role === "staff") → 400. |
| Concurrent edits (two staff edit the same key date) | Last-write-wins (no optimistic concurrency for MVP). |

---

## 10. Out of scope (explicit)

- **Staff-initiated booking** (group H) — own sub-project.
- **Archive / soft-delete client** (group I) — own sub-project.
- **Client portal** — clients reading own data + replying to messages + uploading docs from a logged-in client UI. Belongs in the existing planned "Client self-service portal" cluster.
- **File attachments in messages** — `Message.attachments` exists in schema; UI not wired this iteration.
- **Per-service messaging threads** — flat thread only.
- **WhatsApp/SMS notifications** — schema has `NotificationProvider`; email-only this iteration.
- **Document version history** — replacing a doc creates a new row; old row stays unless explicitly deleted.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `serviceTypeKey` drift if Service taxonomy keys change | Documented as a free-text bucket; Settings UI should warn before editing a key that has Documents associated. (Future hardening — not in this iteration.) |
| Inline edit with auto-save causes accidental data loss | Save on explicit click only; no auto-save. |
| Email send failures silently swallowed | `sendMessage` does the DB write inside a transaction; email is best-effort with error logged + visible in activity log. Message still persists. |
| Large doc list slows page render | Limit per folder to most-recent 50; "Show all" link goes to a dedicated `/admin/clients/[id]/documents/[folder]` page. Defer to "Show all" only if folders grow beyond ~50; otherwise inline render is fine. |
| Race between fulfillment + cancellation | The DocumentRequest PATCH cancel checks state before flipping; fulfillment also checks; both wrapped in `prisma.$transaction`. |

---

## 12. Testing approach

- **TDD** for `updateClientProfile` (Zod schema + activity log emit) and `updatePrimaryStaff` (role check).
- **Service tests with mocked Prisma** for `addClientService`, `updateClientService`, `removeClientService`, `setDocumentStatus`, `sendMessage` (especially the email side-effect).
- **Pure unit tests** for any folder-bucketing helper (mapping a Document to its folder).
- **Smoke** of every new route via `curl` after wire-up.
- **Manual UI walkthrough** as the final acceptance check per phase.

---

## 13. Out-the-door per phase

**Phase 1 ships** when, against a live client in the dev stack:
- Every quick-action link works (no 404).
- Every visible section is editable + saves persist + show up on refresh.
- Documents folder anchors actually scroll to a section that exists.
- A doc can be uploaded, viewed inline, status-changed, deleted.
- Compliance bar visible and links to the existing compliance page.
- `npm test` + `npm run typecheck` green.

**Phase 2 ships** when:
- Staff can send a message; client receives an email; the message persists in the thread.
- Staff can request a document; client receives an email; staff can mark the request cancelled; uploading a doc with `fulfillsRequestId` flips the request to fulfilled.
- `npm test` + `npm run typecheck` green.
