# 01 — System overview & architecture

## What is ORO?

ORO is a fiduciary management platform for a Cyprus-based corporate-services
firm. The firm onboards prospects (individuals or representatives of a
company), runs KYC/AML compliance, and — once cleared — converts them into
active clients with engaged services (immigration, company formation,
accounting, tax). Day-to-day client work (documents, messaging, bookings,
key dates) happens through both the staff-facing admin panel and the
client-facing portal.

## Top-level surfaces

```
              ┌───────────────────────────────────────────────┐
              │  Next.js app (Server Components + API routes) │
              ├───────────────────────────────────────────────┤
   public ──▶ │  /            marketing                       │
              │  /login       sign-in & register              │
              │  /onboarding  3-step wizard (prospects)       │
              ├───────────────────────────────────────────────┤
  staff   ──▶ │  /admin/*     admin panel                     │
              │               submissions, clients, compliance│
              │               bookings, analytics, settings   │
              ├───────────────────────────────────────────────┤
  partner ──▶ │  /partner/*   partner-only client list & view │
              ├───────────────────────────────────────────────┤
  client  ──▶ │  /app/*       client portal                   │
              │               dashboard, documents, messages, │
              │               bookings, application, settings │
              ├───────────────────────────────────────────────┤
  any     ──▶ │  /api/*       JSON endpoints                  │
              └───────────────────────────────────────────────┘
                                       │
                                       ▼
              ┌───────────────────────────────────────────────┐
              │  Service layer (src/lib/services/*)           │
              │  - all business logic                         │
              │  - logs every write to ActivityLog            │
              └───────────────────────────────────────────────┘
                                       │
                ┌──────────────────────┼─────────────────────┐
                ▼                      ▼                     ▼
        ┌──────────────┐       ┌─────────────┐       ┌──────────────┐
        │ Postgres 16  │       │ Storage     │       │ Email        │
        │ (Prisma)     │       │ local | S3  │       │ smtp | resend│
        │              │       │ AES-256-GCM │       │              │
        └──────────────┘       └─────────────┘       └──────────────┘

              ┌───────────────────────────────────────────────┐
              │  Worker process (src/worker/*)                │
              │  - auto-rescreen (per-band cadence)           │
              │  - periodic-review (annual files)             │
              │  - backfill-compliance (legacy clients)       │
              └───────────────────────────────────────────────┘
```

## Architectural rules

### 1. Routes are thin

Route handlers in `src/app/api/**/route.ts` do four things and nothing more:
parse the body with a Zod schema, call a service function, translate
service errors into HTTP responses, and return JSON. They never reach into
Prisma directly — that responsibility belongs to the service layer.

### 2. Services own business logic

Everything that mutates state is a function in `src/lib/services/*`. A
service function takes the smallest possible parameters (entity IDs +
patch), validates invariants, performs the writes inside a transaction
when needed, and logs the action to ActivityLog. Services are the unit of
testing — both unit tests and integration tests target them.

### 3. ActivityLog is canonical

Every write to a domain entity must log a row to `ActivityLog`. This is
how the application reconstructs "what happened" for clients,
compliance officers, and partners. It backs the override-history panel,
the per-client activity feed, and the audit trail in submissions.

### 4. Compliance gates conversion

Conversion of a Prospect into a Client passes through
`src/lib/services/compliance/gate.ts`. If the prospect's ComplianceFile is
not `cleared` or risk rating is unset, conversion is rejected with
`COMPLIANCE_NOT_CLEARED`. This invariant is enforced at the service layer
and tested in `src/lib/services/__tests__/conversion-gate.test.ts`.

### 5. Roles are guarded server-side

Server Components and route handlers call
`assertRole("staff", "partner")` (etc.) before doing anything sensitive.
Client-side route protection is cosmetic; the real check happens on the
server. See [03 — Roles & auth](./03-roles-and-auth.md).

## Folder map

```
src/
├── app/                     Next.js App Router
│   ├── (auth)/              /login + tabbed sign-in/register
│   ├── admin/               staff admin panel
│   ├── api/                 route handlers
│   ├── app/                 client portal (note: app/app/* is the portal)
│   ├── onboarding/          prospect 3-step wizard
│   ├── partner/             partner workspace
│   └── verify/[token]/      email-verification link target
├── components/              shared UI primitives (admin shell, badges, …)
│   └── compliance/          ComplianceDashboard, RiskPanel, PartiesTable…
├── lib/
│   ├── auth/                Auth.js config + guards
│   ├── providers/           email, storage abstractions
│   ├── schema/              Zod schemas for forms + APIs
│   ├── services/            business logic (the heart)
│   │   └── compliance/      KYC/AML subsystem
│   ├── db.ts                shared Prisma client
│   └── env.ts               validated env loader
├── test/                    test helpers (testcontainers, rollback-tx, seed)
└── worker/                  cron worker (separate process)
    └── jobs/                auto-rescreen, periodic-review, backfill
prisma/
├── schema.prisma            single source of truth for DB schema
└── seed.ts                  demo-data seeder
```

## Process model

The dev stack runs as separate Docker containers:

- `web` — Next.js dev server (hot reload via bind mount)
- `worker` — node-cron worker (independent of web; restarts on crash)
- `db` — Postgres 16
- `mail` — Mailpit (catches outbound emails for dev)
- `minio` — S3-compatible storage for `STORAGE_DRIVER=s3` testing
- `proxy` — Caddy fronting :80

The worker is intentionally a separate process. It owns its own Prisma
client and runs independently of HTTP traffic so screenings, periodic
reviews, and backfills never compete with user-facing requests.

## Reading order for new contributors

1. This page.
2. [02 — Getting started](./02-getting-started.md) — get a stack running.
3. [04 — Data model](./04-data-model.md) — internalise the entities.
4. [05 — Onboarding](./05-onboarding.md) and [06 — Compliance](./06-compliance.md) — the two big workflows.
5. [11 — Admin panel](./11-admin-panel.md) — see the surfaces.
