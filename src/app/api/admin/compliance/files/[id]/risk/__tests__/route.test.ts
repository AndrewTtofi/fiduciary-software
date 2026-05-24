import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createComplianceFile } from "@/test/seed";
import { makeReq, makeParams } from "@/test/route";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

const sessionState = vi.hoisted(() => ({ user: null as null | { id: string; email: string; fullName: string; role: string } }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: async (..._allowed: string[]) => {
    if (!sessionState.user) throw new Error("UNAUTHENTICATED");
    if (!_allowed.includes(sessionState.user.role)) throw new Error("FORBIDDEN");
    return sessionState.user;
  },
}));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: async () => ({ ok: true }) }),
}));
vi.mock("@/lib/providers/storage", () => ({
  storage: () => ({
    put: async (_key: string, buf: Buffer, _mime: string) => ({
      key: _key,
      encMeta: { alg: "aes-256-gcm", ivB64: "aaa=", tagB64: "bbb=", keyId: "test" },
      sizeBytes: buf.byteLength,
    }),
    delete: async () => {},
    getStream: async () => { throw new Error("not implemented"); },
  }),
}));
vi.mock("@/lib/env", () => ({
  env: () => ({ APP_URL: "http://localhost:3000" }),
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/compliance/files/[id]/risk/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/compliance/files/[id]/risk PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { rating: "low", reason: "All good here." } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { rating: "low", reason: "All good here." } }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("bad input (missing reason) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { rating: "low" } }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("bad input (invalid rating) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { rating: "extreme", reason: "Some reason here." } }),
        makeParams({ id: "any-id" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("reason too short (<5 chars) → 400", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { rating: "low", reason: "Hi" } }),
        makeParams({ id: cf.id })
      );
      // Zod min(5) catches this at 422
      expect(res.status).toBe(422);
    });
  });

  it("happy path: sets riskRating and riskOverrideReason → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { rating: "high", reason: "Client has complex structure." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      const updated = await tx.complianceFile.findUnique({ where: { id: cf.id } });
      expect(updated?.riskRating).toBe("high");
      expect(updated?.riskOverrideReason).toBe("Client has complex structure.");
    });
  });

  it("downgrade from high to low emits escalated:true in activity log", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      // Seed a file with riskComputed=high
      const cf = await createComplianceFile(tx);
      await tx.complianceFile.update({
        where: { id: cf.id },
        data: { riskComputed: "high", riskComputedScore: 8 },
      });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { rating: "low", reason: "Re-evaluated after document review." } }),
        makeParams({ id: cf.id })
      );
      expect(res.status).toBe(200);
      // Check activity log for escalated:true
      const logs = await tx.activityLog.findMany({
        where: { entityId: cf.id, action: "compliance.risk_overridden" },
        orderBy: { createdAt: "desc" },
      });
      expect(logs.length).toBeGreaterThan(0);
      const meta = logs[0].meta as Record<string, unknown>;
      expect(meta.escalated).toBe(true);
    });
  });
});
