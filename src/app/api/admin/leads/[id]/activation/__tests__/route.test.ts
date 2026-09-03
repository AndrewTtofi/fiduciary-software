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
const sent = vi.hoisted(() => ({ n: 0 }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: async (...allowed: string[]) => {
    if (!sessionState.user) throw new Error("UNAUTHENTICATED");
    if (!allowed.includes(sessionState.user.role)) throw new Error("FORBIDDEN");
    return sessionState.user;
  },
}));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: async () => { sent.n += 1; return { ok: true }; } }),
}));
vi.mock("@/lib/env", () => ({
  env: () => ({ APP_URL: "http://localhost:3000", ACTIVATION_LINK_TTL_DAYS: 7 }),
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/leads/[id]/activation/route");
}
const withParams = (id: string) => ({ params: Promise.resolve({ id }) });

afterEach(() => { sessionState.user = null; sent.n = 0; vi.resetModules(); });

describe("POST /api/admin/leads/[id]/activation", () => {
  it("rejects prospects (staff only)", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const u = await createUser(tx, { role: "prospect" });
      sessionState.user = { id: u.id, email: u.email, fullName: u.fullName, role: "prospect" };
      const { POST } = await loadRoute(tx);
      await expect(POST(makeReq({ method: "POST" }), withParams("x"))).rejects.toThrow("FORBIDDEN");
    });
  });

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

  it("emails the link and records who sent it", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const lead = await tx.lead.create({ data: { email: `l-${Date.now()}@example.com`, name: "Ada", source: "contact" } });
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST" }), withParams(lead.id));
      expect(res.status).toBe(200);
      expect(sent.n).toBe(1);
      const act = await tx.leadActivation.findFirst({ where: { leadId: lead.id } });
      expect(act!.createdById).toBe(staff.id);
      const log = await tx.activityLog.findFirst({ where: { entityType: "lead", entityId: lead.id, action: "lead.activation_sent" } });
      expect(log).not.toBeNull();
    });
  });

  it("an email with an existing password account → 409, nothing sent", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const existing = await createUser(tx, { role: "client" });
      const lead = await tx.lead.create({ data: { email: existing.email, name: "Ada", source: "contact" } });
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST" }), withParams(lead.id));
      expect(res.status).toBe(409);
      expect(sent.n).toBe(0);
    });
  });
});
