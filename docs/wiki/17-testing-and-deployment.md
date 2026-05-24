# 17 — Testing, CI/CD, deployment

## Test strategy

Three layers, runnable independently:

```
┌──────────────────────────────────────────────────────────────┐
│  Unit (Vitest)                  src/**/*.test.ts             │
│    - service-level logic with prisma mocked                  │
│    - tiny + fast, no Docker                                  │
├──────────────────────────────────────────────────────────────┤
│  Integration (Vitest)           src/**/__tests__/*.test.ts   │
│    - REAL Postgres via @testcontainers/postgresql            │
│    - tests inside a $transaction that always rolls back      │
│    - covers ~30 API routes + 3 worker jobs                   │
├──────────────────────────────────────────────────────────────┤
│  E2E (Playwright)               e2e/*.spec.ts                │
│    - browser hitting the dev compose stack                   │
│    - covers auth, onboarding, conversion, doc-request,       │
│      messaging, compliance gate                              │
└──────────────────────────────────────────────────────────────┘
```

### Vitest project split

`vitest.config.ts` defines two projects:

- **`unit`** — fast, no DB. Mock `@/lib/db`.
- **`integration`** — boots a Postgres container per test file.

Run individually:

```bash
npm run test:unit
npm run test:integration
```

Or together via the workspace command (`vitest`).

### The integration test pattern

Every route test uses the same scaffolding:

```ts
let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

const sessionState = vi.hoisted(() => ({ user: null as null | { id, email, fullName, role } }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: async (...allowed) => { if (!sessionState.user) throw new Error("UNAUTHENTICATED"); … },
  requireUser: async () => { … },
  requireRole: async (...allowed) => { … },
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/your/route");
}

afterEach(() => { sessionState.user = null; vi.resetModules(); });

it("...", async () => {
  await inRollbackTx(prisma, async (tx) => {
    sessionState.user = { id, email, fullName, role: "staff" };
    const { POST } = await loadRoute(wrapTx(tx));
    const res = await POST(makeReq({ body: { … } }));
    expect(res.status).toBe(200);
  });
});
```

The key helpers:

- **`getTestPrisma()` / `stopTestPrisma()`** — boots/tears down a
  Postgres testcontainer once per file.
- **`inRollbackTx`** — wraps `fn` in a transaction that always rolls
  back. Tests can write freely.
- **`wrapTx`** — Proxy so nested `prisma.$transaction(cb)` inside
  services pass through to the same tx.
- **`sessionState` + guards mock** — toggles auth per-test without
  needing real next-auth state.
- **`loadRoute(db)`** — late-binds the route's `prisma` to the test tx.

### Playwright E2E

Specs in `e2e/*.spec.ts`. Each spec:

1. Calls `POST /api/test/reset?seed=1` to start clean.
2. Optionally seeds via `POST /api/test/setup-client` for cleared-client
   flows.
3. Walks the UI via `page.goto`, `page.fill`, etc.

The dev compose stack must be up first. Playwright targets
`http://localhost` directly.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
npm run test:e2e
```

## CI / CD

GitHub Actions workflow: `.github/workflows/ci.yml`.

### Jobs

```
changelog         requires CHANGELOG.md to be in the PR diff (gate)
unit              tsc --noEmit + next lint + npm run test:unit
integration       npm ci + npx prisma generate + npm run test:integration
e2e               docker compose up; playwright install; npm run test:e2e
build-image       only on push to main / tags — builds + pushes the prod
                  image to GHCR
```

`unit`, `integration`, `e2e`, and `changelog` all run on PRs.
`build-image` runs only after merge.

### Changelog gate

`.github/pull_request_template.md` includes a CHANGELOG line. CI fails
if `CHANGELOG.md` isn't part of the PR diff. This forces every PR to
document what it ships under the **Unreleased** section. When a release
cuts, the Unreleased block becomes a dated section.

## Deployment

### Image

The prod image is built from the multi-stage `Dockerfile`:

1. `deps` — installs production dependencies
2. `builder` — runs `next build` (standalone output) + `worker:build`
3. `runner` — minimal Alpine + non-root user + entrypoint script

The same image runs both `web` and `worker` — the `command:` field in
docker-compose picks which.

### Compose

Production: `docker-compose.yml` alone (no `.dev.yml`). Differences from
dev:

- Caddy fronts everything on :443 with auto-HTTPS
- No bind mount, no hot reload — the prebuilt image is the source of
  truth
- `SEED_ON_BOOT=false` by default; flip to `true` once for first-launch
- Real SMTP env (no mailpit)
- `STORAGE_DRIVER=s3` typically

### Entrypoint

`deploy/entrypoint.sh` runs at every container start:

```sh
prisma migrate deploy --schema=./prisma/schema.prisma
if [ "$SEED_ON_BOOT" = "true" ]; then
  node dist-worker/seed.js
fi
exec "$@"      # node server.js | node dist-worker/worker/index.js
```

Migrations are *additive* — never re-applied if already at the head.

### Health probes

- **`/api/health`** — cheap liveness: returns `{ok:true,...}` without
  touching the DB. Used by the container healthcheck.
- **`/api/ready`** — readiness: hits Postgres with `SELECT 1`. Use this
  for k8s readiness probes; load balancers should use `/health`.

## Release process

1. PR with changes → CHANGELOG.md updated under "Unreleased" → CI green → merge.
2. After merge, `build-image` job tags and pushes a new image to GHCR.
3. (Manual today) `docker compose pull && docker compose up -d` on the
   target host runs migrations and brings up the new image.

A proper rollout would gate on the readiness probe and use a blue/green
strategy — not in scope for the MVP host setup.
