import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { makeReq } from "@/test/route";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

/* The booking form saves the lead the moment name + email are given (step 3
   of 4) and completes it on the final submit. These tests pin the contract
   the form relies on: a partial save stores answers but books nothing and
   emails nobody; the final save upserts the SAME record. */
const sent = vi.hoisted(() => ({ emails: 0, bookings: 0 }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: async () => ({ ok: true, remaining: 1, resetIn: 0 }),
}));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({ send: async () => { sent.emails += 1; return { ok: true }; } }),
}));
vi.mock("@/lib/services/booking", () => ({
  createPublicBooking: async () => { sent.bookings += 1; return { ok: true, bookingId: "b" }; },
}));
vi.mock("@/lib/env", () => ({
  env: () => ({ APP_URL: "http://localhost:3000" }),
}));

async function loadRoute(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/app/api/leads/route");
}

afterEach(() => {
  sent.emails = 0;
  sent.bookings = 0;
  vi.resetModules();
});

const base = {
  email: "Plan.Seeker@example.com",
  name: "Dana",
  source: "contact",
  meta: { country: "Germany", nationality: "Germany", relocate: "Yes, myself or my family", timeline: "Within 3 months", services: "Company Formation", gdprConsent: "yes" },
};

describe("POST /api/leads (booking funnel)", () => {
  it("partial save stores the lead with funnelStage=plan_requested and neither books nor emails", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const { POST } = await loadRoute(tx);
      const res = await POST(makeReq({ method: "POST", body: { ...base, partial: true } }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, partial: true });

      const lead = await tx.lead.findFirst({ where: { email: "plan.seeker@example.com", source: "contact" } });
      expect(lead).not.toBeNull();
      expect((lead!.meta as Record<string, string>).funnelStage).toBe("plan_requested");
      expect((lead!.meta as Record<string, string>).country).toBe("Germany");
      expect(sent.bookings).toBe(0);
      expect(sent.emails).toBe(0);
    });
  });

  it("final submit completes the same lead (no duplicate), books the slot and marks it booked", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const { POST } = await loadRoute(tx);
      await POST(makeReq({ method: "POST", body: { ...base, partial: true } }));
      const res = await POST(makeReq({
        method: "POST",
        body: {
          ...base,
          phone: "+357 99 123456",
          meta: { ...base.meta, preferredSlot: "2030-01-10T08:00:00.000Z", preferredSlotLabel: "Thu 10 Jan, 10:00", timezone: "Europe/Berlin" },
        },
      }));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, booked: true });

      const leads = await tx.lead.findMany({ where: { email: "plan.seeker@example.com", source: "contact" } });
      expect(leads).toHaveLength(1);
      expect(leads[0].phone).toBe("+357 99 123456");
      expect((leads[0].meta as Record<string, string>).funnelStage).toBe("booked");
      expect(sent.bookings).toBe(1);
    });
  });
});
