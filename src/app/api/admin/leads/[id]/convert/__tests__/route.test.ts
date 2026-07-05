import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createUser } from "@/test/seed";
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
}));
// Mock argon2 to avoid hashing cost in tests
vi.mock("argon2", () => ({
  default: {
    hash: async (password: string) => `hashed:${password}`,
    argon2id: 2,
  },
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/leads/[id]/convert/route");
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/leads/[id]/convert POST", () => {
  it("unknown lead → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST" }), withParams("00000000-0000-0000-0000-000000000000"));
      expect(res.status).toBe(404);
    });
  });

  it("creates a pre-verified prospect account from the lead and marks it converted", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const lead = await tx.lead.create({
        data: { email: "lead.convert@test.local", name: "Lead Convert", phone: "+357 99555666", source: "contact" },
      });
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST" }), withParams(lead.id));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(typeof json.tempPassword).toBe("string");
      const user = await tx.user.findUnique({ where: { email: "lead.convert@test.local" } });
      expect(user?.role).toBe("prospect");
      expect(user?.emailVerified).not.toBeNull();
      expect(user?.fullName).toBe("Lead Convert");
      expect(user?.phone).toBe("+357 99555666");
      const updated = await tx.lead.findUnique({ where: { id: lead.id } });
      expect(updated?.stage).toBe("converted");
    });
  });

  it("existing account with the lead email → still marks converted, no password", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const existing = await createUser(tx, { email: "already.here@test.local" });
      const lead = await tx.lead.create({
        data: { email: existing.email, name: "Already Here", source: "contact" },
      });
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST" }), withParams(lead.id));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.existing).toBe(true);
      expect(json.tempPassword).toBeUndefined();
      const updated = await tx.lead.findUnique({ where: { id: lead.id } });
      expect(updated?.stage).toBe("converted");
    });
  });
});
