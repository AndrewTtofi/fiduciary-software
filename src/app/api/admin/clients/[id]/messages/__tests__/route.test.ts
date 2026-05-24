import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createClient, createStaff } from "@/test/seed";
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

const emailSendMock = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));

vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: emailSendMock }),
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
  return import("@/app/api/admin/clients/[id]/messages/route");
}

afterEach(() => {
  sessionState.user = null;
  emailSendMock.mockClear();
  vi.resetModules();
});

describe("admin/clients/[id]/messages GET", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { GET } = await loadRoute(tx);
      await expect(
        GET(makeReq({ method: "GET" }), makeParams({ id: "any" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const user = await tx.user.findUnique({ where: { id: client.userId } });
      sessionState.user = { id: user!.id, email: user!.email, fullName: user!.fullName, role: "client" };
      const { GET } = await loadRoute(tx);
      await expect(
        GET(makeReq({ method: "GET" }), makeParams({ id: client.id }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("happy path: returns thread → 200 with messages array", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { GET } = await loadRoute(tx);
      const res = await GET(makeReq({ method: "GET" }), makeParams({ id: client.id }));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.messages)).toBe(true);
    });
  });
});

describe("admin/clients/[id]/messages POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", body: { body: "Hello" } }), makeParams({ id: "any" }))
      ).rejects.toThrow();
    });
  });

  it("bad input (empty body) → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { body: "" } }),
        makeParams({ id: "any" })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: staff posts message → 200, Message.clientId set", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", body: { body: "Hello from staff" } }),
        makeParams({ id: client.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.id).toBeTruthy();
      const msg = await tx.message.findUnique({ where: { id: json.id } });
      expect(msg?.clientId).toBe(client.id);
      expect(msg?.senderId).toBe(staff.id);
    });
  });

  it("email side-effect: email provider send is called once on message send", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const client = await createClient(tx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      await POST(
        makeReq({ method: "POST", body: { body: "Notification email test" } }),
        makeParams({ id: client.id })
      );
      expect(emailSendMock).toHaveBeenCalledTimes(1);
    });
  });
});
