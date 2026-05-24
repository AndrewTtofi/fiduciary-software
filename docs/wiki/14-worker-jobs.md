# 14 — Worker jobs

The worker is a separate process from the web app. It runs `node-cron`
in production (compiled to `dist-worker/`) and `tsx watch` in dev. The
docker-compose stack starts it as the `worker` container.

## Why a separate process

Three reasons:

1. **Isolation.** A web request slowdown shouldn't delay screenings; a
   misbehaving cron shouldn't stall page loads.
2. **Independent restarts.** The web container restarts on code change;
   the worker can keep running.
3. **Clear ownership.** The worker has its own `prisma` client and its
   own logs — easy to grep, easy to debug.

## Job catalog

### `auto-rescreen` — every 1 hour

`src/worker/jobs/auto-rescreen.ts`

Finds `KycCase` rows that:

- Are in state `passed`
- Belong to a Party whose ComplianceFile is `cleared` with a known
  `riskRating`
- Whose latest `ScreeningRun.ranAt` is older than the band cadence:
  - high → 30 days
  - standard → 90 days
  - low → 365 days

For each, it runs a fresh screening. If the hit set has changed
materially (per `diffHitsForAlert`), it opens a `screening_hit`
`ReviewTask` for the file. Only one such task is open at a time per
file — re-firing doesn't spam the queue.

### `periodic-review` — every 24 hours

`src/worker/jobs/periodic-review.ts`

Finds `ComplianceFile` rows in `cleared` status whose
`lastReviewedAt` is more than a year ago. Opens a `risk_overdue`
ReviewTask so a compliance officer re-evaluates the file.

This pairs with the regulatory expectation that high/medium-risk
relationships are formally re-reviewed at least once a year. Bumping
`lastReviewedAt` happens automatically when a fresh `risk_recomputed`
or `risk_overridden` activity logs.

### `backfill-compliance` — every 24 hours, idempotent

`src/worker/jobs/backfill-compliance.ts`

Catches legacy `Prospect` and `Client` rows that pre-date the compliance
subsystem and don't have a `ComplianceFile`. For each one missing,
creates a default file (status `open`), the main_contact Party, and a
pending KycCase. Logs the creation.

Safe to run repeatedly — the `findFirst({ where: { complianceFile: null } })`
gates idempotency.

## Schedule wiring

`src/worker/index.ts`:

```ts
import cron from "node-cron";
import { autoRescreenTick } from "./jobs/auto-rescreen";
import { periodicReviewTick } from "./jobs/periodic-review";
import { backfillComplianceTick } from "./jobs/backfill-compliance";

cron.schedule("0 * * * *", autoRescreenTick);          // every hour
cron.schedule("0 3 * * *", periodicReviewTick);        // 03:00 daily
cron.schedule("0 4 * * *", backfillComplianceTick);    // 04:00 daily
```

The worker also exposes a tiny health HTTP server on port 3000 so its
container can pass the docker-compose healthcheck. The web container's
healthcheck is separate.

## Testing worker jobs

Each job has an integration test that:

- Starts a testcontainers Postgres
- Seeds a state where the job *should* fire
- Imports the tick function and runs it
- Asserts the side effects (new ReviewTask, updated `latestScreeningRunId`,
  etc.)

Files:

- `src/worker/__tests__/auto-rescreen.test.ts`
- `src/worker/__tests__/periodic-review.test.ts`
- `src/worker/__tests__/backfill-compliance.test.ts`

These run under the `integration` vitest project (real DB, no mocks for
Prisma).

## Logs

Each tick logs a single-line summary:

```
[auto-rescreen] checked=N tasksCreated=M durationMs=T
[periodic-review] flagged=N durationMs=T
[backfill-compliance] created=N durationMs=T
```

In dev: `docker logs -f oro-corporation-worker-1`. In prod: stdout is
captured by whatever supervisor runs the container.

## Failure handling

Jobs catch per-item errors and continue:

```ts
for (const kyc of due) {
  try {
    ...
  } catch (e) {
    console.error("[auto-rescreen] kycCaseId=%s error=%s", kyc.id, e.message);
  }
}
```

A single screening failure doesn't kill the whole tick. A *job* crash is
caught by node-cron and the next tick runs anyway.

## Roadmap (not yet shipped)

- **Job-health dashboard.** A small page at `/admin/health` showing last-run
  times + last-tick durations + last error per job. Currently you have
  to read logs.
- **Pluggable schedule.** Hard-coded cron strings; an admin UI would be
  the next polish.
