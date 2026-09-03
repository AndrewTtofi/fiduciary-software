---
name: backend
description: Backend conventions for this Next.js 16 / Prisma 7 (pg driver adapter) / next-auth v5 fiduciary platform. Use this skill whenever you add or change an API route under src/app/api, a service in src/lib/services, a provider in src/lib/providers, the Prisma schema, the cron worker in src/worker, env config in src/lib/env.ts, rate limiting, reference numbers, email sending, or integration tests. Trigger even when the user only says "save this to the database", "add an endpoint", "send an email when X", "export to Excel", "add a cron job", "add a field", or "make the button actually work" — those all land in the backend layer described here.
---

# Backend work in this repo

The backend is deliberately thin and boring: route handler → Zod → service → Prisma,
with external systems behind provider seams. Most production incidents here have come
from build/config drift (worker build only runs in the Dockerfile, Prisma 7 adapter
rules, refused destructive `db push`), so the second half of this skill is about not
breaking prod. `CLAUDE.md` is the authority; `docs/wiki/15-api-reference.md` and
`04-data-model.md` are useful but older.

## Shape of a request

```
src/app/api/<resource>/[id]/route.ts        ← runtime = "nodejs", guards, Zod, status codes
        └─ src/lib/services/<domain>.ts     ← all Prisma reads/writes, business rules
                └─ src/lib/db.ts (prisma)   ← singleton, built with pgAdapter()
                └─ src/lib/providers/*      ← storage / email / calendar / notify / screening
                └─ logActivity()            ← src/lib/services/activity.ts (audit trail)
```

A representative route (`src/app/api/onboarding/submit/route.ts`):

```ts
export const runtime = "nodejs";
export async function POST(req: Request) {
  const user = await assertRole("prospect", "client", "staff");
  const body = await req.json().catch(() => ({}));
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  const out = await commitFormAnswers(user.id, parsed.data);
  if (!out.ok) return NextResponse.json({ error: out.errors }, { status: 422 });
  return NextResponse.json({ ok: true, prospect: { id: out.prospect.id } });
}
```

## Conventions

- **Guards first.** `assertRole(...roles)` from `src/lib/auth/guards.ts` (roles:
  `prospect | client | staff`). Plan-gated features call `blockBelowTier(tier)` from
  `src/lib/auth/tier-guard.ts` before that and return its response if non-null.
  `src/middleware.ts` only protects page prefixes, never `/api`, so a route without a
  guard is public. Note that `assertRole` throws `UNAUTHENTICATED` / `FORBIDDEN` and
  routes don't catch it, so unauthenticated calls currently surface as a 500; that is
  the existing pattern, don't paper over it inconsistently in one route.
- **Ownership is checked in the service, not just the role.** A client may only touch
  their own prospect/client/document rows; look at how `src/lib/services/documents.ts`
  and `client-view.ts` scope queries by `userId` and copy that.
- **Validation:** Zod on every body and query. Shared schemas live in `src/lib/schema/`
  when the UI reuses them; route-local schemas are fine otherwise. Parse with
  `schema.safeParse(await req.json().catch(() => ({})))`.
- **Status vocabulary:** `422` invalid input (dominant), `404` not found, `400`/`409`
  business errors, `429` rate limited, `413`/`415` upload problems, `403` tier or
  super-admin. Errors are `{ error: string | issues }`, success is `{ ok: true, ... }`
  or the resource.
- **Services own Prisma.** They import the singleton (`import { prisma } from "@/lib/db"`)
  and never receive a client as an argument. There is no `$transaction` anywhere in
  services or routes today; multi-write flows are sequential. If you need atomicity,
  `$transaction` is fine and the test harness (`wrapTx`) already supports it.
- **Audit.** Writes that matter to staff or clients call `logActivity({ entityType,
  entityId, action, actorId, meta })`. `ActivityAction` is a closed union in
  `src/lib/services/activity.ts`; add your new action string there. Document reads are
  logged too, because documents are PII.
- **Rate limiting** is `rateLimit({ bucket, key, limit, windowSec })` from
  `src/lib/rate-limit.ts`, process-local, keyed by IP for public routes and user id for
  authenticated ones. `Bucket` is a closed union; add a name for each new call site.
  Any unauthenticated write route must have one.
- **Branding in non-React code:** `getServerBranding()` from
  `src/lib/services/branding-server.ts` (`brandName`, `legalName`, `referencePrefix`,
  `contactEmail`, `jurisdiction`). Read once per operation, not per row. Never write a
  firm name into an email, reference number, or calendar invite.
- **Reference numbers:** `allocateReferenceNumber()` in `src/lib/services/reference.ts`
  gives `{PREFIX}-{year}-{NNNNN}` with collision retry; don't roll your own.
- **Providers:** each of `storage`, `email`, `calendar`, `notify`, `screening` in
  `src/lib/providers/` is an interface + implementations + a cached factory selected by a
  driver env var (`STORAGE_DRIVER`, `EMAIL_DRIVER`, ...). App code calls the factory
  (`email()`, `storage()`), never a concrete class. To add an implementation: implement
  the interface, add a branch in the factory, add the driver value and its config to the
  Zod schema in `src/lib/env.ts`, document it in `.env.example`.
- **Env:** everything goes through `env()` / `features.*` in `src/lib/env.ts`. Required
  vars fail boot loudly; optional integrations get a `features.x` boolean so an
  unconfigured channel no-ops. The `NEXT_PHASE === "phase-production-build"` placeholder
  branch exists so `next build` doesn't need real secrets; leave it alone.
- **Worker:** jobs are `src/worker/jobs/*.ts` exporting one `xTick()`; register in
  `src/worker/index.ts` with `cron.schedule(expr, () => xTick().catch(log))`. Never let a
  tick throw out of the callback. The worker builds its own `PrismaClient({ adapter:
  pgAdapter() })`.
- **Emails:** send via `email()` from `src/lib/providers/email.ts`; look at an existing
  transactional email in `src/lib/services/auth-flows.ts` or `booking.ts` and follow its
  shape (plain-text body plus simple HTML, brand from `getServerBranding()`, links built
  from `env().APP_URL`).

## Database rules (Prisma 7, no migrations)

- `prisma/schema.prisma` has no `url`; the CLI reads `prisma.config.ts`, the runtime uses
  the pg adapter. Every `new PrismaClient()` passes `adapter: pgAdapter()` from
  `src/lib/prisma-adapter.ts`. No `datasources` / `datasourceUrl` options exist in v7.
- No `@@map`; tables are the PascalCase model names. `OrgSettings` is a singleton row
  with id `"singleton"`.
- Schema sync is `prisma db push`. Additive changes (new nullable column, new enum value,
  new model) deploy automatically. Destructive changes (drop column/table/enum value)
  are refused by the prod deploy and print `WARNING: prisma db push did not apply`;
  they need the "Sync DB schema (accept data loss)" workflow run once afterwards. Prefer
  additive designs: add the new field, backfill, stop reading the old one, drop later.
- After editing the schema run `npx prisma generate` before typechecking.
- Seed logic lives in `src/worker/seed.ts` (called by `prisma/seed.ts`) so it compiles in
  the worker build too. Seed accounts use `axenorconsulting.com` demo data; don't add a
  new brand there.

## Tests

- `npm run test:unit` for pure logic (`src/**/__tests__/*.test.ts`, no DB).
- `npm run test:integration` for routes, services and worker jobs. Harness:
  `getTestPrisma()` (`src/test/db.ts`, testcontainers Postgres, `db push`, plan tier
  forced to `scale`), `inRollbackTx(prisma, async (tx) => ...)` and `wrapTx(tx)`
  (`src/test/tx.ts`), `makeReq` / `makeParams` (`src/test/route.ts`), `mockSession`
  (`src/test/auth.ts`, must run before importing anything that imports `@/lib/auth`),
  factories in `src/test/seed.ts`. Copy the structure of
  `src/app/api/onboarding/services/__tests__/route.test.ts`: mock `@/lib/db` and
  `@/lib/auth/guards`, load the route with the tx-scoped client, wrap each test in a
  rollback transaction.
- No Docker locally? Push a branch and read CI; don't assume.

## Before you finish

```bash
npx prisma generate            # if schema changed
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration       # needs Docker, else rely on CI
npm run worker:build           # if you touched src/lib/** shared with the worker, tsconfig*, or deps
```

Then check: guard present on every new route; Zod on every input; rate limit on public
writes; `logActivity` on meaningful writes; new env var in `env.ts` and `.env.example`;
new install commands use `--legacy-peer-deps`; `CHANGELOG.md` untouched; commit message
is a Conventional Commit (`feat(scope): ...`, `fix(scope): ...`).

## Related skills

`frontend` for the page or form that calls your route; `security` before merging
anything that touches auth, tokens, documents, admin settings, or public endpoints.
