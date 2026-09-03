import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff } from "@/test/seed";
import { makeReq } from "@/test/route";

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
  isSuperAdmin: (user: { email?: string | null } | null | undefined) => {
    const allow = (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const email = user?.email?.toLowerCase();
    return !!email && allow.includes(email);
  },
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/settings/tools/route");
}

afterEach(() => {
  sessionState.user = null;
  delete process.env.SUPER_ADMIN_EMAILS;
  vi.resetModules();
});

describe("admin/settings/tools PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { toolsEnabled: { "income-tax": false } } }))
      ).rejects.toThrow();
    });
  });

  it("non-super-admin staff → 403", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(makeReq({ method: "PATCH", body: { toolsEnabled: { "income-tax": false } } }));
      expect(res.status).toBe(403);
    });
  });

  it("non-boolean value → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(makeReq({ method: "PATCH", body: { toolsEnabled: { "income-tax": "off" } } }));
      expect(res.status).toBe(422);
    });
  });

  it("super admin disables tools → 200, only off-switches stored, unknown keys dropped", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { toolsEnabled: { "income-tax": false, salary: true, bogus: false } } })
      );
      expect(res.status).toBe(200);
      const row = await tx.orgSettings.findUnique({ where: { id: "singleton" } });
      expect(row?.toolsEnabled).toEqual({ "income-tax": false });
    });
  });

  it("all-on map resets to null (default: everything enabled)", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const off = await PATCH(makeReq({ method: "PATCH", body: { toolsEnabled: { salary: false } } }));
      expect(off.status).toBe(200);
      const on = await PATCH(makeReq({ method: "PATCH", body: { toolsEnabled: { salary: true } } }));
      expect(on.status).toBe(200);
      const row = await tx.orgSettings.findUnique({ where: { id: "singleton" } });
      expect(row?.toolsEnabled).toBeNull();
    });
  });
});
