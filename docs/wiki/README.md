# ORO Corporate Services — Wiki

A complete reference for the ORO fiduciary management platform. Pages are
numbered in roughly the order a new contributor benefits from reading them.

## Contents

### Orientation
- [01 — System overview & architecture](./01-overview.md)
- [02 — Getting started (local dev)](./02-getting-started.md)
- [03 — Roles, authentication, sessions](./03-roles-and-auth.md)
- [04 — Data model (Prisma)](./04-data-model.md)

### Core workflows
- [05 — Prospect onboarding](./05-onboarding.md)
- [06 — Compliance / KYC / AML](./06-compliance.md)
- [07 — Converting a prospect to a client](./07-conversion.md)
- [08 — Documents, requests, storage](./08-documents.md)
- [09 — Messaging](./09-messaging.md)
- [10 — Bookings](./10-bookings.md)

### User interfaces
- [11 — Admin panel (every tab)](./11-admin-panel.md)
- [12 — Client portal](./12-client-portal.md)
- [13 — Partner workspace](./13-partner-workspace.md)

### Platform internals
- [14 — Worker jobs (cron)](./14-worker-jobs.md)
- [15 — API reference](./15-api-reference.md)
- [16 — Settings (org, services, flags, team)](./16-settings.md)
- [17 — Testing, CI/CD, deployment](./17-testing-and-deployment.md)
- [18 — Troubleshooting](./18-troubleshooting.md)

## Quick links

- **Login:** `http://localhost/login`
- **Demo password (all seeded accounts):** `oroDemo!1`
- **Staff:** `staff@oro.local` · **Partner:** `partner@oro.local` · **Client:** `dmitry@meridian.io`
- **Mailpit (dev inbox):** `http://localhost:8025`
- **MinIO console:** `http://localhost:9001`

## Stack at a glance

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict) |
| Database | Postgres 16 |
| ORM | Prisma 5.22 |
| Auth | Auth.js v5 (next-auth beta) — credentials + email verification |
| Storage | Local FS or S3-compatible (AES-256-GCM envelope encryption) |
| Email | SMTP (mailpit in dev) or Resend |
| Worker | node-cron + tsx (in dev) / compiled JS (in prod) |
| Tests | Vitest (unit + integration via testcontainers) + Playwright (E2E) |
| Deploy | Docker Compose; prod image on GHCR |

## Conventions

- **Server Components by default.** Client components are explicit `"use client"` and live next to their server parents.
- **All writes go through service modules** in `src/lib/services/*`. Route handlers are thin: parse → call service → return.
- **All admin/portal writes log to ActivityLog.** This is the source of truth for "who did what when."
- **Every irreversible domain change requires a role check.** `assertRole("staff")`, `assertRole("staff", "partner")`, etc.
- **Compliance gates conversion.** A prospect cannot become a client until their ComplianceFile is `cleared`.
