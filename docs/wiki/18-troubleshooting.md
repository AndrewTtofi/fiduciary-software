# 18 — Troubleshooting

A grab-bag of symptoms and the fix, in the order you'll likely hit them.

## Local dev

### `Invalid environment variables` on boot

Missing `AUTH_SECRET` or `ENCRYPTION_KEY_B64` in `.env`. Re-run:

```bash
echo "AUTH_SECRET=$(openssl rand -base64 48)" >> .env
echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
```

### `SMTP_FROM: Invalid email`

You're on an old version where the env schema used `z.string().email()`.
Fix lives in `src/lib/env.ts` (the schema accepts display-name form
since the test-hardening PR). If you're seeing this *after* that PR,
you've manually narrowed the schema — relax it back to `z.string()`.

### Login 500s with `prisma error Unknown user` etc

DB schema isn't in sync with the Prisma client. Inside the web
container:

```bash
docker exec oro-corporation-web-1 node ./node_modules/prisma/build/index.js \
  db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss
```

The dev entrypoint does this automatically on boot — only run it
manually if you suspect drift.

### Demo clients missing

The `/api/test/reset` route wipes domain data; `?seed=1` only re-seeds
minimal accounts. To get the full demo (Meridian Holdings, prospects,
key dates), run the full seed:

```bash
docker exec oro-corporation-web-1 npx tsx prisma/seed.ts
```

### Hot reload stops working / `Unknown system error -35` in web logs

macOS bind-mount watcher choked. Two common causes:

1. Stray duplicate files like `*.spec 2.ts` (Finder dupes) — confuse
   webpack: `find . -name "* 2.*" -not -path "./node_modules/*" -delete`
2. Build state corrupted: `docker compose -f docker-compose.yml -f
   docker-compose.dev.yml restart web`

### Register button does nothing

Check the form's submit handler. If the API returned 500 (visible in
the Network tab), the web container log will explain — usually a
missing env var or a downstream service (`mail`) unreachable.

### Mailpit not catching emails

Verify `EMAIL_DRIVER=smtp`, `SMTP_HOST=mail`, `SMTP_PORT=1025` are set
on the web service in docker-compose.dev.yml. The Mailpit web UI lives
at `http://localhost:8025`.

## Tests

### `npm ci` fails locally

Peer-dep conflict between `next-auth@5-beta` and `@auth/core` over
`nodemailer`. Run with `--legacy-peer-deps`:

```bash
npm install --legacy-peer-deps
```

### Integration test cannot start Postgres

Testcontainers requires Docker. Verify `docker info` works. On macOS,
make sure Docker Desktop is running. On CI, `services: docker` is set
in the workflow.

### Vitest reports "ReferenceError: prisma is not defined"

The test forgot to wire the `loadRoute(db)` injection. Check the
sessionState/guards mock pattern in any working test file (e.g.
`src/app/api/account/profile/__tests__/route.test.ts`).

### Playwright spec times out at `waitForURL`

The dev stack isn't fully ready. Check:

```bash
curl -fsS http://localhost/api/health
```

If that returns 200 but the spec still times out, the failing
operation (usually register or sign-in) is throwing — look at the web
container logs.

## CI

### `Build Docker image` fails with `Environment variable not found: DATABASE_URL`

`next build`'s "Collecting page data" phase loads route modules, which
instantiate Prisma. The Dockerfile sets placeholder env vars during
build to satisfy this — make sure
the `ENV DATABASE_URL=postgresql://build:build@localhost:5432/build`
line wasn't removed.

### `Build Docker image` fails with `"/app/public": not found`

The runner stage `COPY` of `public/` requires the directory to exist.
Commit a `public/.gitkeep` placeholder.

### Integration tests fail on CI but pass locally

Most likely cause: a service is reading directly from the global
`prisma` import instead of taking it as an argument. Search for
`from "@/lib/db"` in service files — every one should accept a db
argument or be called from a route that mocks `@/lib/db`.

### `npm ci` fails in the Docker build

The Dockerfile must use `--legacy-peer-deps` like the CI workflow does.
The flag is already in the deps stage; check it wasn't reverted.

## Production

### `prisma migrate deploy` fails at container start

Pending migration was created locally but never committed, or two
contributors created conflicting migrations. Fix: roll forward with a
new migration that resolves the conflict, never `migrate resolve`
backwards on a production DB.

### Encrypted documents can't decrypt after env rotation

If you rotated `ENCRYPTION_KEY_B64`, old documents are stuck with the
old key. The `Document.encMeta.keyId` is the seam for multi-key
support, but the system today only honors one key. Plan: keep the old
key reachable via a key map (not yet implemented).

### Worker silent

Check `docker logs oro-corporation-worker-1`. Each tick logs a
single-line summary; if you see nothing for >1h, the worker crashed.
The container should restart automatically; if not, the supervisor
isn't watching it.

## Compliance

### Sign-off button stays disabled

The SignOffPanel renders the list of remaining work. Most common
blockers:

- Risk rating not set → click **Recompute risk** in the RiskPanel
- A Party still has `KycCase.state = pending` → run their checks
- A `screening_hit` ReviewTask is still open → close it from
  `/admin/compliance/tasks`

### "Convert to client" button stays disabled

Status isn't `approved` OR compliance file isn't `cleared`. The
gate is the join. Both have to be true.

### Hits keep re-firing after I clear them

The next `auto-rescreen` tick re-runs the screening and the same hits
come back. Clearing a hit's `reviewStatus` is per-run, not global. Use
`hitDedup.diffHitsForAlert` semantics: if the hit set is *unchanged*,
no new ReviewTask fires — but the hits themselves do persist on the new
run. To silence the hit forever, mark it `confirmed` (which is
permanent and escalates risk) or document a waiver via internal note.

## When in doubt

- `docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f`
- `docker exec oro-corporation-db-1 psql -U oro -d oro`
- Search ActivityLog for the action you'd expect to see —
  if it's missing, the write didn't actually happen.
