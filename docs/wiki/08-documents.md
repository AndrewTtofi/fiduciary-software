# 08 — Documents, requests, storage

## Document lifecycle

Every document in the system is one of three things:

1. **An onboarding-required file** uploaded by a prospect during the
   wizard (passport, proof-of-address).
2. **A staff-requested file** uploaded by a client in response to a
   DocumentRequest issued by their account manager.
3. **A staff-uploaded file** placed into a client's folder directly by an
   admin user (a copy of a contract, an internal due-diligence doc).

All three follow the same code path:

```
POST /api/documents/upload   (multipart form: file + metadata)
        │
        ▼
uploadDocument()  in  src/lib/services/documents.ts
        │
        ├── encrypt buffer with AES-256-GCM
        ├── put to storage driver (local | s3)
        ├── create Document row with encMeta + storage key
        ├── if fulfillsRequestId → atomically mark DocumentRequest fulfilled
        └── logActivity('document.uploaded')
```

## DocPurpose

Newer code keys documents by `DocPurpose`:

- `passport`
- `proof_of_address`
- `source_of_funds`
- `kyc_internal`
- `other`

Older code (the onboarding wizard) still uses the legacy `DocType` enum
(`passport / proof_of_address / other`). Both fields exist on the
`Document` row; new uploads always set `purpose`, old reads use `type`
when `purpose` is null.

## Storage drivers

Selectable via `STORAGE_DRIVER=local|s3`. Both implement the same
`StorageProvider` interface in `src/lib/providers/storage.ts`:

```ts
put(key, buffer, mime): Promise<{ key, encMeta, sizeBytes }>
getStream(key, encMeta): Promise<Readable>
delete(key): Promise<void>
```

### Local driver

Files live under `STORAGE_LOCAL_DIR` (defaults to `/data/docs`, mounted
as a Docker volume). Each file is the encrypted blob — there is no
plaintext on disk.

### S3 driver

When `STORAGE_DRIVER=s3`, uses the AWS SDK against any S3-compatible
service. Configure via `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. For path-style endpoints
(MinIO), set `S3_FORCE_PATH_STYLE=true`.

The dev compose includes a MinIO container so you can test the S3 path
without leaving localhost. Console at `http://localhost:9001` with
`oro_dev` / `oro_dev_password`.

## Encryption

Every document is encrypted with **AES-256-GCM**, envelope-style:

- The data key is `ENCRYPTION_KEY_B64` (32 raw bytes, base64).
- For each file, a fresh 12-byte IV is generated.
- The ciphertext is stored at `storageKey`; the IV + auth tag + key id
  are stored on the Document row in `encMeta`.

On download (`GET /api/documents/[id]`), `getDocumentStream()` reads the
ciphertext, the metadata, and decrypts in-memory. The response is the
plaintext stream. No plaintext is ever written to disk.

The key id (`encMeta.keyId`) is the seam for future key rotation: a new
key gets a new id, old documents keep working with their original key
until re-encrypted.

## DocumentRequest

Staff issue document requests from `/admin/clients/[id]/request-docs`.
Each request has:

- `description` — what the client should upload
- `dueAt` (optional)
- `serviceTypeKey` (optional — ties the request to a service)
- `state` — `open / fulfilled / cancelled`

### Editing an open request

Before fulfilment, staff can edit description + dueAt via
`PATCH /api/admin/document-requests/[id]` with `{ description?, dueAt? }`.
After fulfilment the request is locked (use a new request instead).

### Cancelling

`PATCH /api/admin/document-requests/[id]` with `{ state: "cancelled" }`
closes the request without fulfilment. The client sees it disappear from
their open-requests list.

### Fulfilment

When a client uploads a document and names `fulfillsRequestId` in the
form, `uploadDocument()` atomically:

1. Creates the Document row with `purpose` derived from the request type.
2. Marks the DocumentRequest `state = fulfilled` with `fulfilledAt`.
3. Logs `document.uploaded` and `doc_request.fulfilled`.

If the upload fails, the request stays open. No partial state.

## Per-folder organisation in the admin UI

`/admin/clients/[id]` shows documents grouped into folders:

- **KYC** — purposes `passport`, `proof_of_address`, `source_of_funds`,
  `kyc_internal`
- **Engagement** — service-related contracts (purpose `other` with
  `serviceTypeKey` set)
- **Filings** — government docs (also purpose `other`)
- **Correspondence** — everything else

The UploadButton component lets admins pick the purpose before browsing
for a file. Each folder's default purpose pre-fills the dropdown.

## Client-portal documents

Clients see the same folders at `/app/documents`. They can:

- Upload into open requests (fulfilment-aware)
- Upload free-standing into folders
- View / download anything in their own folders

They cannot delete. The portal page shows a note: *"Documents you upload
are kept for audit. Contact your account manager if a document needs to be
removed."*

## Audit trail

Every document operation logs to `ActivityLog`:

- `document.uploaded`
- `document.downloaded` (when staff or client view via `/api/documents/[id]`)
- `document.deleted` (staff only)
- `doc_request.created`
- `doc_request.updated`
- `doc_request.fulfilled`
- `doc_request.cancelled`

The per-client activity feed in `/admin/clients/[id]` pulls these rows
and renders them with the actor's name.
