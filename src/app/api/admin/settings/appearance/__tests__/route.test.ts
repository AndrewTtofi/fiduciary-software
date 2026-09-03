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
  return import("@/app/api/admin/settings/appearance/route");
}

afterEach(() => {
  sessionState.user = null;
  delete process.env.SUPER_ADMIN_EMAILS;
  vi.resetModules();
});

describe("admin/settings/appearance PATCH", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { PATCH } = await loadRoute(tx);
      await expect(
        PATCH(makeReq({ method: "PATCH", body: { frontTemplate: "meridian" } }))
      ).rejects.toThrow();
    });
  });

  it("non-super-admin staff → 403", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(makeReq({ method: "PATCH", body: { frontTemplate: "meridian" } }));
      expect(res.status).toBe(403);
    });
  });

  it("unknown template key → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(makeReq({ method: "PATCH", body: { frontTemplate: "neon" } }));
      expect(res.status).toBe(422);
    });
  });

  it("invalid override colour → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(makeReq({ method: "PATCH", body: { frontTheme: { accent: "blue" } } }));
      expect(res.status).toBe(422);
    });
  });

  it("super admin sets template + overrides → 200, persisted", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const res = await PATCH(
        makeReq({ method: "PATCH", body: { frontTemplate: "summit", frontTheme: { accent: "#128552", displayFont: "sora" } } })
      );
      expect(res.status).toBe(200);
      const row = await tx.orgSettings.findUnique({ where: { id: "singleton" } });
      expect(row?.frontTemplate).toBe("summit");
      expect(row?.frontTheme).toEqual({ accent: "#128552", displayFont: "sora" });
    });
  });

  it("null frontTheme clears overrides → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      process.env.SUPER_ADMIN_EMAILS = staff.email;
      const { PATCH } = await loadRoute(tx);
      const set = await PATCH(makeReq({ method: "PATCH", body: { frontTheme: { primary: "#123456" } } }));
      expect(set.status).toBe(200);
      const clear = await PATCH(makeReq({ method: "PATCH", body: { frontTheme: null } }));
      expect(clear.status).toBe(200);
      const row = await tx.orgSettings.findUnique({ where: { id: "singleton" } });
      expect(row?.frontTheme).toBeNull();
    });
  });
});
