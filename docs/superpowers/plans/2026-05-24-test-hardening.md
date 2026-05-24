# Test Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real CI-gated coverage: testcontainers-backed API + worker tests, Playwright E2E for critical flows, and split the vitest config into unit/integration projects per `docs/superpowers/specs/2026-05-24-test-hardening-design.md`.

**Architecture:** Vitest gains two projects (`unit` = mocked-Prisma, fast; `integration` = real Postgres via testcontainers). API route handlers are tested directly (call the exported `POST`/`PATCH` functions with fabricated `Request` objects + a vi-mocked `auth()` for sessions). Playwright drives a docker-compose dev stack with a NODE_ENV-guarded reset route. CI gains two new jobs (`integration`, `e2e`) atop the existing `unit` job.

**Tech Stack:** Vitest 4, `@testcontainers/postgresql`, Playwright + Chromium, Prisma + Postgres 16, Next.js 15 App Router. Existing patterns reused.

---

## Conventions used throughout

- All file paths absolute from repo root.
- All commits via `git -c commit.gpgsign=false commit -m "..."`. No Co-Authored-By line.
- Tests use Vitest's `describe` / `it` / `expect` (already in use).
- For DB tests: import the singleton from `src/test/db.ts` (do not call `new PrismaClient()` directly).
- Each route test file lives at `src/app/api/.../__tests__/route.test.ts` next to its `route.ts`.
- Worker test files live at `src/worker/__tests__/<job>.test.ts`.
- Playwright specs live at `e2e/*.spec.ts`.
- Don't write fixtures inline — use the factories in `src/test/seed.ts`.
- **CHANGELOG.md MUST be updated in the same PR** (a CI gate already enforces this).

---

## Phase 1 — Infra

### Task 1: Install deps + vitest project split + test helpers

**Files:**
- Modify: `package.json` (deps + scripts)
- Modify: `vitest.config.ts` (split into projects)
- Create: `src/test/db.ts`
- Create: `src/test/tx.ts`
- Create: `src/test/auth.ts`
- Create: `src/test/seed.ts`
- Create: `src/test/route.ts`

- [ ] **Step 1: Install deps**

```bash
npm install --save-dev @testcontainers/postgresql @playwright/test --legacy-peer-deps
```

Expected: packages added; no peer-dep failures.

- [ ] **Step 2: Update `package.json` scripts**

Replace the existing `test` / `test:watch` / `test:coverage` lines (under `"scripts"`) with:

```json
"test": "vitest run",
"test:unit": "vitest run --project=unit",
"test:integration": "vitest run --project=integration",
"test:watch": "vitest --project=unit",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test"
```

- [ ] **Step 3: Rewrite `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/lib/services/**", "src/lib/providers/**", "src/app/api/**", "src/worker/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: [
            "src/**/__tests__/**/*.test.ts",
            "src/**/*.test.ts",
          ],
          exclude: [
            "src/app/api/**/__tests__/**",
            "src/worker/__tests__/**",
            "src/lib/services/__tests__/screening.test.ts",
            "src/lib/services/__tests__/client-portal.test.ts",
            "e2e/**",
          ],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: [
            "src/app/api/**/__tests__/route.test.ts",
            "src/worker/__tests__/**/*.test.ts",
            "src/lib/services/__tests__/screening.test.ts",
            "src/lib/services/__tests__/client-portal.test.ts",
          ],
          environment: "node",
          testTimeout: 60_000,    // allow testcontainer boot on first call
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
```

- [ ] **Step 4: Create `src/test/db.ts`**

```ts
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

let container: StartedPostgreSqlContainer | undefined;
let prismaClient: PrismaClient | undefined;

/**
 * Boots a Postgres container once per vitest worker, runs `prisma db push` to
 * sync the schema, and returns a singleton PrismaClient bound to that container.
 * Subsequent calls within the same worker reuse the same client.
 */
export async function getTestPrisma(): Promise<PrismaClient> {
  if (prismaClient) return prismaClient;
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const url = container.getConnectionUri();
  execSync("npx prisma db push --skip-generate --accept-data-loss --schema=./prisma/schema.prisma", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  prismaClient = new PrismaClient({ datasources: { db: { url } } });
  return prismaClient;
}

export async function stopTestPrisma() {
  await prismaClient?.$disconnect();
  await container?.stop();
  prismaClient = undefined;
  container = undefined;
}
```

- [ ] **Step 5: Create `src/test/tx.ts`**

```ts
import type { PrismaClient } from "@prisma/client";

class RollbackSignal extends Error { constructor() { super("__rollback__"); } }

/**
 * Runs `fn` inside a Prisma transaction that is always rolled back at the end,
 * leaving the DB clean for the next test. Returns whatever fn returns.
 *
 * Usage:
 *   await inRollbackTx(prisma, async (tx) => {
 *     const u = await tx.user.create({ data: ... });
 *     // ... assertions ...
 *   });
 */
export async function inRollbackTx<T>(prisma: PrismaClient, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  let result!: T;
  await prisma.$transaction(async (tx) => {
    result = await fn(tx as unknown as PrismaClient);
    throw new RollbackSignal();
  }).catch((e) => { if (!(e instanceof RollbackSignal)) throw e; });
  return result;
}
```

- [ ] **Step 6: Create `src/test/auth.ts`**

```ts
import { vi } from "vitest";

export type TestUser = {
  id: string;
  email: string;
  fullName: string;
  role: "prospect" | "client" | "staff" | "partner";
};

/**
 * Stubs @/lib/auth's `auth()` to return a session for the duration of the test.
 * Must be called BEFORE any module that imports auth() is loaded
 * (use in beforeEach + dynamic import of the route module).
 */
export function mockSession(user: TestUser | null) {
  vi.doMock("@/lib/auth", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/auth")>();
    return {
      ...actual,
      auth: async () => (user ? { user } : null),
    };
  });
}

export function resetAuth() {
  vi.doUnmock("@/lib/auth");
}
```

- [ ] **Step 7: Create `src/test/seed.ts`**

```ts
import type { PrismaClient, Role } from "@prisma/client";

let counter = 0;
const uniq = () => `${Date.now()}-${++counter}`;

export async function createUser(tx: PrismaClient, opts: { role?: Role; fullName?: string; email?: string } = {}) {
  return tx.user.create({
    data: {
      email: opts.email ?? `u-${uniq()}@test.local`,
      fullName: opts.fullName ?? "Test User",
      role: opts.role ?? "prospect",
      emailVerified: new Date(),
      passwordHash: "x",
    },
  });
}

export async function createProspect(tx: PrismaClient, opts: { userId?: string; status?: "pending" | "approved" | "needs_info" | "rejected" } = {}) {
  const userId = opts.userId ?? (await createUser(tx, { role: "prospect" })).id;
  return tx.prospect.create({
    data: {
      userId,
      referenceNumber: `ORO-TEST-${uniq()}`,
      status: opts.status ?? "approved",
      servicesSelected: [],
    },
  });
}

export async function createClient(tx: PrismaClient, opts: { userId?: string; prospectId?: string; primaryStaffId?: string } = {}) {
  const userId = opts.userId ?? (await createUser(tx, { role: "client" })).id;
  const prospectId = opts.prospectId ?? (await createProspect(tx, { userId })).id;
  const primaryStaffId = opts.primaryStaffId ?? (await createUser(tx, { role: "staff" })).id;
  return tx.client.create({
    data: { userId, prospectId, primaryStaffId },
  });
}

export async function createStaff(tx: PrismaClient) {
  return createUser(tx, { role: "staff" });
}
```

- [ ] **Step 8: Create `src/test/route.ts`**

```ts
/** Build a fake Request for calling route handlers directly. */
export function makeReq(opts: {
  method?: string;
  body?: unknown;
  form?: FormData;
  headers?: HeadersInit;
  url?: string;
}): Request {
  const init: RequestInit = { method: opts.method ?? "GET", headers: opts.headers };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "Content-Type": "application/json", ...(opts.headers ?? {}) };
  } else if (opts.form) {
    init.body = opts.form;
  }
  return new Request(opts.url ?? "http://localhost/test", init);
}

/** Wrap params in the Promise shape Next.js 15 route handlers expect. */
export function makeParams<T>(value: T): { params: Promise<T> } {
  return { params: Promise.resolve(value) };
}
```

- [ ] **Step 9: Smoke**

```bash
npm run test:unit
```

Expected: existing 47 tests pass.

```bash
npm run test:integration -- --reporter=verbose
```

Expected: 0 tests run (no integration test files yet) — exits 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/
git -c commit.gpgsign=false commit -m "test(infra): split unit/integration vitest projects + testcontainers + helpers"
```

---

## Phase 2 — API route tests

> **Template (memorize this):** every API route test follows the same shape. Set up a real-DB PrismaClient + `vi.mock("@/lib/db", { prisma: testPrisma })` + `mockSession(seededUser)` + import the route handler dynamically + call it via `makeReq` + assert response + assert DB state. Wrap each test body in `inRollbackTx`.

> **Example to copy** (don't duplicate; this single shape is reused for every route test):
>
> ```ts
> import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
> import type { PrismaClient } from "@prisma/client";
> import { getTestPrisma, stopTestPrisma } from "@/test/db";
> import { inRollbackTx } from "@/test/tx";
> import { mockSession, resetAuth } from "@/test/auth";
> import { createUser } from "@/test/seed";
> import { makeReq, makeParams } from "@/test/route";
>
> let prisma: PrismaClient;
> beforeAll(async () => { prisma = await getTestPrisma(); });
> afterAll(async () => { await stopTestPrisma(); });
>
> // Re-mock @/lib/db inside each test so the route module sees our test prisma.
> vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
>
> async function loadRoute() {
>   // bind the mock to the live test prisma each time so vi.mock above resolves correctly
>   const dbMod = await import("@/lib/db");
>   (dbMod as { prisma: PrismaClient }).prisma = prisma;
>   return import("@/app/api/.../route");  // path varies per test
> }
>
> afterEach(() => { resetAuth(); vi.resetModules(); });
>
> describe("POST /api/...", () => {
>   it("401 when unauthenticated (assertRole throws => 500 in our code)", async () => {
>     await inRollbackTx(prisma, async (tx) => {
>       mockSession(null);
>       const { POST } = await loadRoute();
>       // assertRole throws "UNAUTHENTICATED" => uncaught => Next would 500; the route returns
>       // a 500 in practice. We assert by catching the throw OR by reading the response.
>       const res = await POST(makeReq({ method: "POST", body: {} })).catch((e) => e);
>       expect(res).toBeInstanceOf(Error);
>     });
>   });
>
>   it("422 on invalid body", async () => {
>     await inRollbackTx(prisma, async (tx) => {
>       const u = await createUser(tx, { role: "staff" });
>       mockSession({ id: u.id, email: u.email, fullName: u.fullName, role: "staff" });
>       const { POST } = await loadRoute();
>       const res = await POST(makeReq({ method: "POST", body: { bogus: 1 } }));
>       expect(res.status).toBe(422);
>     });
>   });
>
>   it("200 + persists on happy path", async () => {
>     await inRollbackTx(prisma, async (tx) => {
>       // ...build state, mock session, call POST, assert response + DB
>     });
>   });
> });
> ```

Use this template for every route test. Each task below lists which routes to cover and any specifics unique to that route.

### Task 2: Account routes

**Files:**
- Create: `src/app/api/account/messages/__tests__/route.test.ts`
- Create: `src/app/api/account/documents/__tests__/route.test.ts`
- Create: `src/app/api/account/profile/__tests__/route.test.ts`
- Create: `src/app/api/account/password/__tests__/route.test.ts`

- [ ] **Step 1: Write `messages/__tests__/route.test.ts`**

Cover:
- Unauthenticated → throws (assertRole behavior)
- Empty body → 422
- Client posts → 200, `Message.clientId` set
- Prospect posts → 200, `Message.prospectId` set

Use the template above. Concretely:
```ts
import { POST } from "../route"; // via dynamic import in loadRoute
// ...
it("client posts: Message.clientId set", async () => {
  await inRollbackTx(prisma, async (tx) => {
    const client = await createClient(tx);
    const user = await tx.user.findUnique({ where: { id: client.userId } });
    mockSession({ id: user!.id, email: user!.email, fullName: user!.fullName, role: "client" });
    const { POST } = await loadRoute();
    const res = await POST(makeReq({ method: "POST", body: { body: "hello" } }));
    expect(res.status).toBe(200);
    const msgs = await tx.message.findMany({ where: { clientId: client.id } });
    expect(msgs).toHaveLength(1);
    expect(msgs[0].body).toBe("hello");
  });
});
```

- [ ] **Step 2: Write `documents/__tests__/route.test.ts`**

Cover:
- Unauth → throws
- Missing file → 422
- File too large (mock `file.size > MAX_BYTES`) → 413
- Client uploads → 200, Document row created
- Tries to fulfill another client's request → 400 (or whatever uploadClientDocument throws)

- [ ] **Step 3: Write `profile/__tests__/route.test.ts`**

Cover:
- Unknown field rejected → 400 (uploadClientSelfProfile throws)
- Update profile fields → 200, User row updated
- Update Client fields → 200, Client row updated

- [ ] **Step 4: Write `password/__tests__/route.test.ts`**

Cover:
- Unauth → throws
- Wrong current password → 400
- Valid change → 200, hash updated

- [ ] **Step 5: Run + commit**

```bash
npm run test:integration -- src/app/api/account
git add src/app/api/account
git -c commit.gpgsign=false commit -m "test(api): /api/account/* route tests"
```

### Task 3: Documents serve + onboarding routes

**Files:**
- Create: `src/app/api/documents/[id]/__tests__/route.test.ts`
- Create: `src/app/api/documents/upload/__tests__/route.test.ts`
- Create: `src/app/api/onboarding/services/__tests__/route.test.ts`
- Create: `src/app/api/onboarding/personal/__tests__/route.test.ts`
- Create: `src/app/api/onboarding/submit/__tests__/route.test.ts`

- [ ] **Step 1: Read each route's `route.ts` first** (each onboarding sub-route may have specific Zod shapes):
  ```bash
  cat src/app/api/onboarding/*/route.ts | head -200
  ```

- [ ] **Step 2: `documents/[id]/route.test.ts`**

Cover:
- Unauth → throws
- Wrong owner (try to read another user's doc) → 403
- Owner reads → 200, binary body returned

- [ ] **Step 3: `documents/upload/route.test.ts`**

Cover:
- Unauth → throws
- Bad mime → 415 or 422
- Oversized file → 413
- Valid upload as prospect → 200, doc + activity log

- [ ] **Step 4: Onboarding routes**

For each (`services`, `personal`, `submit`):
- Unauth → throws
- Bad shape → 422
- Happy path → 200, expected mutation visible in DB

- [ ] **Step 5: Run + commit**

```bash
npm run test:integration -- src/app/api/documents src/app/api/onboarding
git add src/app/api/documents src/app/api/onboarding
git -c commit.gpgsign=false commit -m "test(api): /api/documents + /api/onboarding route tests"
```

### Task 4: Auth routes

**Files:**
- Create: `src/app/api/auth/register/__tests__/route.test.ts`
- Create: `src/app/api/auth/verify/__tests__/route.test.ts`
- Create: `src/app/api/auth/forgot/__tests__/route.test.ts`
- Create: `src/app/api/auth/reset/__tests__/route.test.ts`

- [ ] **Step 1: `register/route.test.ts`**

Cover:
- Missing required fields → 422
- Duplicate email → 200 (per spec, returns generic OK without leaking existence) AND no new User row
- New email → 200, User + Prospect created; in dev `emailVerified` is set (auto-verify)

- [ ] **Step 2: `verify/route.test.ts`**

Cover:
- Missing/invalid token → 400
- Expired token → 400
- Valid token → 200; User.emailVerified flipped

- [ ] **Step 3: `forgot/route.test.ts`**

Cover:
- Unknown email → 200 (generic OK; no leak)
- Known email → 200; PasswordReset row created

- [ ] **Step 4: `reset/route.test.ts`**

Cover:
- Bad token → 400
- Valid token → 200; passwordHash updated; PasswordReset usedAt set

- [ ] **Step 5: Run + commit**

```bash
npm run test:integration -- src/app/api/auth
git add src/app/api/auth
git -c commit.gpgsign=false commit -m "test(api): /api/auth/* route tests"
```

### Task 5: Admin clients + notes + users

**Files:**
- Create: `src/app/api/admin/clients/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/services/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/services/[serviceId]/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/key-dates/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/key-dates/[keyDateId]/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/documents/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/document-requests/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/[id]/messages/__tests__/route.test.ts`
- Create: `src/app/api/admin/clients/convert/__tests__/route.test.ts`
- Create: `src/app/api/admin/documents/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/document-requests/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/notes/__tests__/route.test.ts`
- Create: `src/app/api/admin/users/[id]/verify/__tests__/route.test.ts`

For each, apply the template. Coverage per route, minimum:
- 1× unauth → throws
- 1× non-staff → throws
- 1× 422 on bad body
- 1× 200 happy path (assert DB state)
- 1× 404 / 403 on cross-tenant where applicable

- [ ] **Step 1-3: Write tests file-by-file.** Don't batch — one route per commit-able chunk.

- [ ] **Step 4: Special-case `convert/route.test.ts`** — also assert the compliance gate:
  ```ts
  it("blocks conversion when compliance is not cleared", async () => {
    await inRollbackTx(prisma, async (tx) => {
      const prospect = await createProspect(tx, { status: "approved" });
      await tx.complianceFile.create({ data: { prospectId: prospect.id, status: "open" } });
      const staff = await createStaff(tx);
      mockSession({ id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" });
      const { POST } = await loadRoute();
      const res = await POST(makeReq({ method: "POST", body: { prospectId: prospect.id } }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toMatch(/compliance/);
      // assert no Client row was created
      const clients = await tx.client.findMany({ where: { prospectId: prospect.id } });
      expect(clients).toHaveLength(0);
    });
  });
  ```

- [ ] **Step 5: Run + commit**

```bash
npm run test:integration -- src/app/api/admin/clients src/app/api/admin/notes src/app/api/admin/users src/app/api/admin/documents src/app/api/admin/document-requests
git add src/app/api/admin/clients src/app/api/admin/notes src/app/api/admin/users src/app/api/admin/documents src/app/api/admin/document-requests
git -c commit.gpgsign=false commit -m "test(api): admin clients/notes/users/documents/document-requests route tests"
```

### Task 6: Admin compliance routes

**Files:**
- Create: `src/app/api/admin/compliance/files/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/files/[id]/sign-off/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/files/[id]/recompute-risk/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/files/[id]/risk/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/files/[id]/parties/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/parties/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/parties/[id]/kyc/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/parties/[id]/screen/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/parties/[id]/documents/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/hits/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/compliance/tasks/[id]/__tests__/route.test.ts`

Apply template. Coverage per route:
- 1× unauth → throws
- 1× non-staff → throws
- 1× 422/400 on bad input
- 1× happy path with DB-state assertion
- 1× scenario-specific edge (e.g., sign-off rejects when not all parties passed; sanctions-hit auto-block)

For `parties/[id]/screen/route.test.ts`, mock the screening provider via `__setScreeningProviderForTests` (already exposed by `@/lib/providers/screening`).

- [ ] **Step 1-3: Write the 11 files.**

- [ ] **Step 4: Run + commit**

```bash
npm run test:integration -- src/app/api/admin/compliance
git add src/app/api/admin/compliance
git -c commit.gpgsign=false commit -m "test(api): admin compliance route tests"
```

### Task 7: Admin settings + submissions

**Files:**
- Create: `src/app/api/admin/settings/org/__tests__/route.test.ts`
- Create: `src/app/api/admin/settings/services/__tests__/route.test.ts`
- Create: `src/app/api/admin/settings/services/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/settings/team/__tests__/route.test.ts`
- Create: `src/app/api/admin/settings/team/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/settings/flags/[key]/__tests__/route.test.ts`
- Create: `src/app/api/admin/submissions/[id]/__tests__/route.test.ts`
- Create: `src/app/api/admin/submissions/[id]/assign-partner/__tests__/route.test.ts`

Apply template, same coverage shape. For services CRUD, also assert:
- Delete with assigned clients → 409 (per the service guard).

- [ ] **Step 1-3: Write files.**
- [ ] **Step 4: Run + commit**

```bash
npm run test:integration -- src/app/api/admin/settings src/app/api/admin/submissions
git add src/app/api/admin/settings src/app/api/admin/submissions
git -c commit.gpgsign=false commit -m "test(api): admin settings/submissions route tests"
```

---

## Phase 3 — Worker job tests

### Task 8: Worker job tests

**Files:**
- Create: `src/worker/__tests__/auto-rescreen.test.ts`
- Create: `src/worker/__tests__/periodic-review.test.ts`
- Create: `src/worker/__tests__/backfill-compliance.test.ts`

- [ ] **Step 1: `auto-rescreen.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx } from "@/test/tx";
import { createClient } from "@/test/seed";
import { __setScreeningProviderForTests } from "@/lib/providers/screening";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
async function loadJob() {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = prisma;
  return import("@/worker/jobs/auto-rescreen");
}

describe("autoRescreenTick", () => {
  it("creates a screening_hit ReviewTask when a new hit appears", async () => {
    await inRollbackTx(prisma, async (tx) => {
      // Seed: Client -> ComplianceFile(status=cleared, riskRating=high) -> Party -> KycCase(state=passed) -> old ScreeningRun(clear, 60d ago)
      const client = await createClient(tx);
      const cf = await tx.complianceFile.create({
        data: { clientId: client.id, status: "cleared", riskRating: "high" },
      });
      const party = await tx.party.create({
        data: { complianceFileId: cf.id, type: "individual", role: "main_contact", fullName: "Joe Test", nationality: "CY" },
      });
      const kyc = await tx.kycCase.create({ data: { partyId: party.id, state: "passed" } });
      const oldRun = await tx.screeningRun.create({
        data: {
          kycCaseId: kyc.id, provider: "stub", query: {}, outcome: "clear",
          ranAt: new Date(Date.now() - 60 * 86400_000),
        },
      });
      await tx.kycCase.update({ where: { id: kyc.id }, data: { latestScreeningRunId: oldRun.id } });

      // Mock provider to return a new hit
      __setScreeningProviderForTests({
        name: "stub",
        match: async () => ({
          outcome: "hits", hits: [{
            externalId: "X-1", matchedName: "Joe Test", matchedSchema: "Person",
            matchedTopics: ["sanction"], matchScore: 0.95, matchedListings: [],
          }], raw: {},
        }),
      });

      const { autoRescreenTick } = await loadJob();
      await autoRescreenTick();

      const tasks = await tx.reviewTask.findMany({ where: { complianceFileId: cf.id, kind: "screening_hit" } });
      expect(tasks).toHaveLength(1);
    });
  });

  it("does not create duplicate tasks when run twice in a row", async () => {
    await inRollbackTx(prisma, async (tx) => {
      // Same seed as above
      // After first call, second call should leave task count at 1
    });
  });
});
```

Fill in the second test body following the same pattern.

- [ ] **Step 2: `periodic-review.test.ts`**

Cover:
- Cleared file with no prior review → creates a periodic_review task
- File with an open periodic_review → no new task
- File with completed periodic_review within cadence → no new task
- File whose last completed review exceeded cadence → new task

- [ ] **Step 3: `backfill-compliance.test.ts`**

Cover:
- Existing Prospect without ComplianceFile → backfill creates it + main_contact Party + KycCase
- Existing Client whose prospect already has a ComplianceFile → backfill just links the clientId
- Running twice → no duplicate ComplianceFile, no duplicate Parties

- [ ] **Step 4: Run + commit**

```bash
npm run test:integration -- src/worker
git add src/worker/__tests__
git -c commit.gpgsign=false commit -m "test(worker): auto-rescreen + periodic-review + backfill integration tests"
```

---

## Phase 4 — Playwright E2E

### Task 9: Playwright config + test-only reset route

**Files:**
- Create: `playwright.config.ts`
- Create: `src/app/api/test/reset/route.ts`
- Modify: `package.json` (already done in Task 1; verify the `test:e2e` script exists)

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,    // shared dev DB; serialize specs
  retries: 2,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

- [ ] **Step 2: `src/app/api/test/reset/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const DOMAIN_TABLES = [
  "DocumentRequest", "Message", "InternalNote", "Booking",
  "ReviewTask", "ScreeningHit", "ScreeningRun", "KycCase", "Party", "ComplianceFile",
  "Document", "KeyDate", "ClientService", "Client", "Prospect",
  "ActivityLog", "PasswordReset", "VerificationToken", "Session", "Account",
  "User", "OrgSettings", "Service", "FeatureFlag",
];

export async function POST() {
  if (process.env.NODE_ENV !== "test" && process.env.ALLOW_TEST_RESET !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${DOMAIN_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`,
  );
  return NextResponse.json({ ok: true });
}
```

> **NOTE:** the route allows `ALLOW_TEST_RESET=1` as a fallback so the dev docker stack (`NODE_ENV=development`) can be used by CI's Playwright job. CI sets the env var; production never does.

- [ ] **Step 3: Smoke**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
until curl -fsS http://localhost/api/health > /dev/null 2>&1; do sleep 1; done
printf "POST /api/test/reset (without env) -> "
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost/api/test/reset
# Expected: 404 (NODE_ENV=development, ALLOW_TEST_RESET unset)
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts 'src/app/api/test/reset/route.ts'
git -c commit.gpgsign=false commit -m "test(e2e): Playwright config + NODE_ENV-guarded reset route"
```

### Task 10: Playwright specs

**Files:**
- Create: `e2e/_fixtures.ts` (shared helpers)
- Create: `e2e/auth.spec.ts`
- Create: `e2e/onboarding-submit.spec.ts`
- Create: `e2e/convert-to-client.spec.ts`
- Create: `e2e/messaging.spec.ts`
- Create: `e2e/doc-request.spec.ts`
- Create: `e2e/compliance-gate.spec.ts`

- [ ] **Step 1: Install Chromium**

```bash
npx playwright install chromium
```

- [ ] **Step 2: `e2e/_fixtures.ts`**

```ts
import { request as pwRequest, type APIRequestContext, type Page } from "@playwright/test";

export async function resetDb(req: APIRequestContext) {
  await req.post("/api/test/reset");
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(admin|app|partner|onboarding)/);
}
```

- [ ] **Step 3: `e2e/auth.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { resetDb } from "./_fixtures";

test.beforeEach(async ({ request }) => { await resetDb(request); });

test("register → login → dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.getByLabel(/full name/i).fill("Test User");
  await page.getByLabel(/email/i).fill("e2e@test.local");
  await page.locator("input[name='phoneNumber']").fill("99123456");
  await page.locator("input[name='password']").fill("oroTest!1");
  await page.getByRole("button", { name: /create account/i }).click();
  // Dev auto-verifies + signs in
  await page.waitForURL(/\/(onboarding|app)/);
  await expect(page).toHaveURL(/\/(onboarding|app)/);
});
```

- [ ] **Step 4: `e2e/onboarding-submit.spec.ts`** — drive the 3-step onboarding wizard to submission.

- [ ] **Step 5: `e2e/convert-to-client.spec.ts`** — needs an admin pre-seeded; reset + seed via direct API or via `resetDb` + a small "seed staff" call:

```ts
async function seedStaff(req: APIRequestContext) {
  // Idempotent SQL via the reset endpoint or a small dedicated test route.
  // Simplest: rely on the seeded staff@oro.local + oroDemo!1 — but reset wiped them.
  // Option: extend reset route to also re-seed minimum demo accounts.
}
```

> **Implementation note:** extend `/api/test/reset` to optionally re-seed the demo accounts when called with `?seed=1`. This avoids creating a parallel seed path.

- [ ] **Step 6: `e2e/messaging.spec.ts`, `doc-request.spec.ts`, `compliance-gate.spec.ts`** — analogous structure.

- [ ] **Step 7: Run**

```bash
npm run test:e2e
```

Expected: 6 specs all green.

- [ ] **Step 8: Commit**

```bash
git add e2e/ 'src/app/api/test/reset/route.ts'
git -c commit.gpgsign=false commit -m "test(e2e): 6 critical-path Playwright specs"
```

---

## Phase 5 — Service-test migration

### Task 11: Migrate `screening.test.ts` + `client-portal.test.ts` to real DB

**Files:**
- Modify: `src/lib/services/__tests__/screening.test.ts`
- Modify: `src/lib/services/__tests__/client-portal.test.ts`

These tests currently use `vi.hoisted` + `vi.mock("@/lib/db")` with in-memory maps. Switch to the testcontainers `getTestPrisma()` pattern.

- [ ] **Step 1: Rewrite `screening.test.ts`**

Replace the in-memory `db` helper with:
```ts
let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });
```

Each test wraps its body in `inRollbackTx` and seeds real `Client → ComplianceFile → Party → KycCase` via `createClient` + extending `seed.ts` if needed (add `createPartyKyc(tx, complianceFileId, ...)`).

Keep the screening provider mock via `__setScreeningProviderForTests`.

- [ ] **Step 2: Rewrite `client-portal.test.ts`** — same approach.

- [ ] **Step 3: Update `vitest.config.ts`**

These files now belong to the `integration` project. The exclude/include rules in Task 1 Step 3 already place them there — verify no further changes needed.

- [ ] **Step 4: Run + commit**

```bash
npm run test:integration -- src/lib/services
git add src/lib/services/__tests__
git -c commit.gpgsign=false commit -m "test(services): migrate screening + client-portal tests to real DB"
```

---

## Phase 6 — CI wiring + CHANGELOG

### Task 12: CI integration

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `CHANGELOG.md` (Unreleased section)

- [ ] **Step 1: Read current `ci.yml`**

```bash
cat .github/workflows/ci.yml
```

- [ ] **Step 2: Replace contents**

```yaml
name: CI

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write

jobs:
  changelog:
    name: Changelog updated
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Verify CHANGELOG.md is in this PR's diff
        run: |
          base="origin/${{ github.base_ref }}"
          git fetch origin "${{ github.base_ref }}" --depth=1
          changed=$(git diff --name-only "$base"...HEAD)
          echo "Files changed in this PR:"
          echo "$changed"
          non_doc=$(echo "$changed" | grep -Ev '^(docs/|\.github/pull_request_template\.md$|CHANGELOG\.md$)' || true)
          if [ -z "$non_doc" ]; then
            echo "Docs-only PR — changelog requirement waived."
            exit 0
          fi
          if echo "$changed" | grep -qx 'CHANGELOG.md'; then
            echo "CHANGELOG.md updated."
            exit 0
          fi
          echo "::error::CHANGELOG.md was not updated. Add an entry under the Unreleased section in CHANGELOG.md before merging."
          exit 1

  unit:
    name: Unit tests + lint + typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --no-audit --no-fund --legacy-peer-deps
      - run: npx prisma generate
      - run: npx prisma validate
        env:
          DATABASE_URL: postgresql://ci:ci@localhost:5432/ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit

  integration:
    name: Integration tests (testcontainers)
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --no-audit --no-fund --legacy-peer-deps
      - run: npx prisma generate
      - run: npm run test:integration

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: integration
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --no-audit --no-fund --legacy-peer-deps
      - name: Start dev stack
        run: |
          cp .env.example .env
          echo "AUTH_SECRET=$(openssl rand -base64 48)" >> .env
          echo "ENCRYPTION_KEY_B64=$(openssl rand -base64 32)" >> .env
          echo "POSTGRES_USER=oro" >> .env
          echo "POSTGRES_PASSWORD=oro" >> .env
          echo "POSTGRES_DB=oro" >> .env
          echo "APP_URL=http://localhost" >> .env
          echo "AUTH_URL=http://localhost" >> .env
          echo "ALLOW_TEST_RESET=1" >> .env
          # public/ dir required by Dockerfile COPY
          mkdir -p public
          docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
          for i in $(seq 1 60); do
            if curl -fsS http://localhost/api/health > /dev/null; then echo ready; break; fi
            sleep 2
          done
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  build-image:
    name: Build Docker image
    runs-on: ubuntu-latest
    needs: [unit, integration]
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v'))
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Compute tags
        id: tags
        run: |
          owner_lc=$(echo "${{ github.repository_owner }}" | tr '[:upper:]' '[:lower:]')
          repo_lc=$(echo "${{ github.event.repository.name }}" | tr '[:upper:]' '[:lower:]')
          base="ghcr.io/${owner_lc}/${repo_lc}"
          tags="${base}:sha-${GITHUB_SHA::7}"
          if [ "${GITHUB_REF}" = "refs/heads/main" ]; then
            tags="${tags},${base}:latest"
          fi
          if [[ "${GITHUB_REF}" == refs/tags/v* ]]; then
            v="${GITHUB_REF#refs/tags/}"
            tags="${tags},${base}:${v}"
          fi
          echo "tags=${tags}" >> $GITHUB_OUTPUT
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.tags.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 3: Update CHANGELOG.md**

Add to the Unreleased section:
```markdown
### Added — Test hardening (PR #4)
- Vitest projects split into `unit` (fast, mocked Prisma) and `integration` (real Postgres via @testcontainers/postgresql).
- ~75-95 new API route tests, one per `route.ts`, with auth + ownership + validation + happy-path coverage.
- Worker job integration tests for `autoRescreenTick`, `periodicReviewTick`, `backfillCompliance`.
- 6 Playwright E2E specs (`auth`, `onboarding-submit`, `convert-to-client`, `messaging`, `doc-request`, `compliance-gate`).
- NODE_ENV-guarded `/api/test/reset` route for E2E DB resets (also gated by `ALLOW_TEST_RESET=1` env for CI's dev stack).
- CI gains `integration` and `e2e` jobs; coverage report uploaded as artifact (no gate yet).
- Migrated `screening.test.ts` + `client-portal.test.ts` from mocked Prisma to real DB to catch schema drift.
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml CHANGELOG.md
git -c commit.gpgsign=false commit -m "ci: add integration + e2e jobs; coverage tracked"
```

---

## Phase 7 — Smoke + PR

### Task 13: Local smoke + push + open PR

- [ ] **Step 1: Run everything locally**

```bash
npm run test:unit
npm run test:integration
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
until curl -fsS http://localhost/api/health > /dev/null 2>&1; do sleep 1; done
ALLOW_TEST_RESET=1 npm run test:e2e
```

All three must pass.

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin feature/test-hardening
gh pr create --base main --head feature/test-hardening \
  --title "test: real CI-gated coverage (API + worker + E2E)" \
  --body "$(cat <<'EOF'
## Summary

Adds real test coverage per docs/superpowers/specs/2026-05-24-test-hardening-design.md.

- Vitest split into `unit` (47 existing, fast) and `integration` (new, testcontainers).
- ~80 new API route tests; 3 worker job tests; 6 Playwright E2E specs.
- Service tests for `screening` + `client-portal` migrated from mocked Prisma to real DB.
- CI gains `integration` and `e2e` jobs.
- Coverage tracked (no gate yet).

## Test plan
- [x] `npm run test:unit` green
- [x] `npm run test:integration` green
- [x] `npm run test:e2e` green locally
- [ ] CI passes all 4 jobs (unit / integration / e2e / changelog)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review

**Spec coverage:**
- §3 Vitest layout → Task 1 ✓
- §4 Infra helpers → Task 1 ✓
- §5 API tests → Tasks 2-7 ✓
- §6 Worker tests → Task 8 ✓
- §7 Playwright → Tasks 9-10 ✓
- §8 Service migration → Task 11 ✓
- §9 CI → Task 12 ✓
- §10 Test reset route → Task 9 ✓
- §11 Out of scope → respected (no component/visual/load tests)

**Placeholder scan:**
- "Apply the template" appears multiple times — that's instructional, not a placeholder, because the template is fully worked above (in Phase 2 preamble).
- Each task explicitly enumerates which routes to cover; no "etc." or hand-waving.

**Type consistency:**
- `getTestPrisma` / `stopTestPrisma` / `inRollbackTx` / `mockSession` / `resetAuth` / `makeReq` / `makeParams` / `createUser` / `createProspect` / `createClient` / `createStaff` — names match between Task 1 (creation) and Tasks 2-11 (consumers).
- The dynamic-import `loadRoute()` pattern is consistent.
- `__setScreeningProviderForTests` (already exists in `@/lib/providers/screening`) is the same name in Task 6, 8, 11.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-24-test-hardening.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task with two-stage review per prior sub-projects' workflow.

**2. Inline Execution** — Same session via executing-plans.
