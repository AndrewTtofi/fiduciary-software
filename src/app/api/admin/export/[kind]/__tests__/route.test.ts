import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createClient, createProspect, createStaff, createUser } from "@/test/seed";
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

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/admin/export/[kind]/route");
}

/* exceljs ships its own Buffer typing that predates Node's generic Buffer,
   so the cast keeps the type checker out of the way of a plain load. */
async function loadWorkbook(res: Response): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(await res.arrayBuffer()) as never);
  return wb;
}

async function headerRow(res: Response): Promise<string[]> {
  const wb = await loadWorkbook(res);
  const ws = wb.worksheets[0];
  const values = ws.getRow(1).values as (string | undefined)[];
  return values.slice(1).map((v) => String(v ?? ""));
}

afterEach(() => {
  sessionState.user = null;
  vi.resetModules();
});

describe("admin/export/[kind] GET", () => {
  it("unauthenticated → throws UNAUTHENTICATED", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const { GET } = await loadRoute(wrapTx(rawTx));
      await expect(GET(makeReq({}), makeParams({ kind: "leads" }))).rejects.toThrow("UNAUTHENTICATED");
    });
  });

  it("prospect role → throws FORBIDDEN", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const u = await createUser(tx, { role: "prospect" });
      sessionState.user = { id: u.id, email: u.email, fullName: u.fullName, role: "prospect" };
      const { GET } = await loadRoute(tx);
      await expect(GET(makeReq({}), makeParams({ kind: "leads" }))).rejects.toThrow("FORBIDDEN");
    });
  });

  it("unknown kind → 404", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const { GET } = await loadRoute(tx);
      const res = await GET(makeReq({}), makeParams({ kind: "documents" }));
      expect(res.status).toBe(404);
    });
  });

  it("submissions → xlsx with the prospect row and its detail columns", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const p = await createProspect(tx, { status: "pending" });
      await tx.prospectDetail.create({ data: { prospectId: p.id, fieldName: "residenceCountry", fieldValue: "Cyprus" } });

      const { GET } = await loadRoute(tx);
      const res = await GET(makeReq({}), makeParams({ kind: "submissions" }));
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml");
      expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="submissions-\d{4}-\d{2}-\d{2}\.xlsx"/);
      expect(res.headers.get("cache-control")).toBe("private, no-store");

      const wb = await loadWorkbook(res);
      const ws = wb.worksheets[0];
      const header = (ws.getRow(1).values as string[]).slice(1);
      expect(header.slice(0, 3)).toEqual(["Reference", "Applicant", "Email"]);
      expect(header).toContain("Residence Country");
      const refs = ws.getColumn(1).values.slice(2).map(String);
      expect(refs).toContain(p.referenceNumber);
      const row = ws.getRow(refs.indexOf(p.referenceNumber) + 2);
      expect(row.getCell(header.indexOf("Lives in") + 1).value).toBe("Cyprus");
      expect(row.getCell(header.indexOf("Status") + 1).value).toBe("Pending");
    });
  });

  it("leads → xlsx with meta columns and the booked slot", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const lead = await tx.lead.create({
        data: {
          email: "lead@example.com", name: "Lead One", source: "contact",
          meta: { country: "Greece", preferredSlot: "2026-09-04T07:00:00.000Z", preferredSlotLabel: "Fri 4 Sep, 10:00" },
        },
      });
      await tx.booking.create({
        data: { leadId: lead.id, expertId: staff.id, startsAt: new Date("2026-09-04T07:00:00.000Z"), timezone: "Europe/Nicosia" },
      });

      const { GET } = await loadRoute(tx);
      const res = await GET(makeReq({}), makeParams({ kind: "leads" }));
      expect(res.status).toBe(200);
      const header = await headerRow(res);
      expect(header.slice(0, 2)).toEqual(["Name", "Email"]);
      expect(header).toContain("Country");
      expect(header).toContain("Preferred Slot Label");
      expect(header).not.toContain("Preferred Slot");
      expect(header).toContain("Booked slot");
    });
  });

  it("clients → xlsx with the client row", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const staff = await createStaff(tx);
      sessionState.user = { id: staff.id, email: staff.email, fullName: staff.fullName, role: "staff" };
      const client = await createClient(tx, { primaryStaffId: staff.id });
      await tx.client.update({ where: { id: client.id }, data: { companyName: "Export Co" } });

      const { GET } = await loadRoute(tx);
      const res = await GET(makeReq({}), makeParams({ kind: "clients" }));
      expect(res.status).toBe(200);
      const wb = await loadWorkbook(res);
      const ws = wb.worksheets[0];
      const header = (ws.getRow(1).values as string[]).slice(1);
      expect(header.slice(0, 4)).toEqual(["Client", "Email", "Phone", "Company"]);
      const companies = ws.getColumn(4).values.slice(2).map(String);
      expect(companies).toContain("Export Co");
    });
  });
});
