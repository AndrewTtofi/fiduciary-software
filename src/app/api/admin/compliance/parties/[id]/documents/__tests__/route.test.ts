import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createStaff, createComplianceFile, createParty } from "@/test/seed";
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
  return import("@/app/api/admin/compliance/parties/[id]/documents/route");
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

function makeFileForm(opts: { purpose?: string; filename?: string; mime?: string } = {}): FormData {
  const form = new FormData();
  const content = new Uint8Array([37, 80, 68, 70]); // %PDF magic bytes
  const file = new File([content], opts.filename ?? "test.pdf", { type: opts.mime ?? "application/pdf" });
  form.set("file", file);
  form.set("purpose", opts.purpose ?? "other");
  return form;
}

describe("admin/compliance/parties/[id]/documents POST", () => {
  it("unauth: throws", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = null;
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", form: makeFileForm() }), makeParams({ id: "any-id" }))
      ).rejects.toThrow();
    });
  });

  it("wrong role (client): throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      sessionState.user = { id: "x", email: "x@test.local", fullName: "X", role: "client" };
      const { POST } = await loadRoute(tx);
      await expect(
        POST(makeReq({ method: "POST", form: makeFileForm() }), makeParams({ id: "any-id" }))
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  it("party not found → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", form: makeFileForm() }),
        makeParams({ id: "00000000-0000-0000-0000-000000000000" })
      );
      expect(res.status).toBe(404);
    });
  });

  it("missing file → 422", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const form = new FormData();
      form.set("purpose", "passport");
      const res = await POST(
        makeReq({ method: "POST", form }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(422);
    });
  });

  it("happy path: uploads passport doc, Document has prospectId and partyId set → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", form: makeFileForm({ purpose: "passport" }) }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.documentId).toBeTruthy();
      // Verify Document has partyId set and the correct prospectId
      const doc = await tx.document.findUnique({ where: { id: json.documentId } });
      expect(doc).not.toBeNull();
      expect(doc?.partyId).toBe(party.id);
      expect(doc?.prospectId).toBe(cf.prospectId);
    });
  });

  it("happy path: uploads proof_of_address doc → 200", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      const cf = await createComplianceFile(tx);
      const party = await createParty(tx, { complianceFileId: cf.id });
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { POST } = await loadRoute(tx);
      const res = await POST(
        makeReq({ method: "POST", form: makeFileForm({ purpose: "proof_of_address" }) }),
        makeParams({ id: party.id })
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      const doc = await tx.document.findUnique({ where: { id: json.documentId } });
      expect(doc?.type).toBe("proof_of_address");
      expect(doc?.partyId).toBe(party.id);
    });
  });
});
