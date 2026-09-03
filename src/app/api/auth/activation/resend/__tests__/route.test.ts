import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { makeReq } from "@/test/route";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

const sent = vi.hoisted(() => ({ links: [] as string[] }));
const limiter = vi.hoisted(() => ({ ok: true }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: async () => ({ ok: limiter.ok, remaining: 1, resetIn: 0 }) }));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({
    send: async (m: { html: string }) => { sent.links.push(m.html.match(/token=([A-Za-z0-9_-]+)/)?.[1] ?? ""); return { ok: true }; },
  }),
}));
vi.mock("@/lib/env", () => ({ env: () => ({ APP_URL: "http://localhost:3000", ACTIVATION_LINK_TTL_DAYS: 7 }) }));

async function load(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  const svc = await import("@/lib/services/lead-activation");
  const route = await import("@/app/api/auth/activation/resend/route");
  return { svc, route };
}

afterEach(() => { sent.links = []; limiter.ok = true; vi.resetModules(); });

describe("POST /api/auth/activation/resend", () => {
  it("always answers ok, and only emails when the token maps to a lead", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const { svc, route } = await load(tx);
      const lead = await tx.lead.create({ data: { email: `r-${Date.now()}@example.com`, name: "Ada", source: "contact" } });
      await svc.issueLeadActivation({ leadId: lead.id });
      const old = sent.links[0];

      const bogus = await route.POST(makeReq({ method: "POST", body: { token: "definitely-not-a-token-1234" } }));
      expect(bogus.status).toBe(200);
      expect(sent.links).toHaveLength(1);

      const real = await route.POST(makeReq({ method: "POST", body: { token: old } }));
      expect(real.status).toBe(200);
      expect(sent.links).toHaveLength(2);
      expect(await svc.peekLeadActivation(old)).toMatchObject({ status: "used" });
    });
  });

  it("is rate limited and validates the body", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const { route } = await load(tx);
      expect((await route.POST(makeReq({ method: "POST", body: { token: "short" } }))).status).toBe(422);
      limiter.ok = false;
      expect((await route.POST(makeReq({ method: "POST", body: { token: "definitely-not-a-token-1234" } }))).status).toBe(429);
    });
  });
});
