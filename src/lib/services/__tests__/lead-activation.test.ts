import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getTestPrisma, stopTestPrisma } from "@/test/db";
import { inRollbackTx, wrapTx } from "@/test/tx";
import { createUser } from "@/test/seed";

let prisma: PrismaClient;
beforeAll(async () => { prisma = await getTestPrisma(); });
afterAll(async () => { await stopTestPrisma(); });

/* The post-call activation link: one email → one identity, single-use token
   hashed at rest, revoked on resend, expiring. These pin every rule from the
   build spec (§3 token rules, §4 flow, §7 edge cases). */
const sent = vi.hoisted(() => ({ links: [] as string[] }));

vi.mock("@/lib/db", () => ({ prisma: undefined as unknown as PrismaClient }));
vi.mock("@/lib/providers/email", () => ({
  email: () => ({
    send: async (m: { html: string }) => {
      const match = m.html.match(/token=([A-Za-z0-9_-]+)/);
      sent.links.push(match?.[1] ?? "");
      return { ok: true };
    },
  }),
}));
vi.mock("@/lib/env", () => ({
  env: () => ({ APP_URL: "http://localhost:3000", ACTIVATION_LINK_TTL_DAYS: 7 }),
}));

async function loadService(db: PrismaClient) {
  const dbMod = await import("@/lib/db");
  (dbMod as { prisma: PrismaClient }).prisma = db;
  return import("@/lib/services/lead-activation");
}

afterEach(() => {
  sent.links = [];
  vi.resetModules();
});

async function seedLead(tx: PrismaClient, email = `lead-${Date.now()}@example.com`) {
  return tx.lead.create({
    data: {
      email,
      name: "Jonathan Meyer",
      phone: "+357 99 123456",
      serviceKey: "company-formation",
      source: "contact",
      meta: { country: "Switzerland", nationality: "Ireland", services: "Company Formation, Accounting and VAT", timeline: "As soon as possible" },
    },
  });
}

describe("lead activation", () => {
  it("issues a hashed, expiring token, emails the raw one, and stamps the lead", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const svc = await loadService(tx);
      const lead = await seedLead(tx);
      const staff = await createUser(tx, { role: "staff" });

      const out = await svc.issueLeadActivation({ leadId: lead.id, actorId: staff.id });
      expect(out.ok).toBe(true);
      expect(sent.links).toHaveLength(1);
      const raw = sent.links[0];
      expect(raw.length).toBeGreaterThan(30);

      const rows = await tx.leadActivation.findMany({ where: { leadId: lead.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0].tokenHash).not.toBe(raw);           // hashed at rest
      expect(rows[0].expires.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000);
      const after = await tx.lead.findUnique({ where: { id: lead.id } });
      expect(after!.stage).toBe("onboarding_sent");
      expect(after!.activationSentAt).not.toBeNull();
      expect(await svc.peekLeadActivation(raw)).toMatchObject({ status: "valid", email: lead.email });
    });
  });

  it("resending revokes the previous link", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const svc = await loadService(tx);
      const lead = await seedLead(tx);
      await svc.issueLeadActivation({ leadId: lead.id });
      await svc.issueLeadActivation({ leadId: lead.id });
      const [first, second] = sent.links;
      expect(await svc.peekLeadActivation(first)).toMatchObject({ status: "used" });
      expect(await svc.peekLeadActivation(second)).toMatchObject({ status: "valid" });
      expect(await svc.consumeLeadActivation(first)).toEqual({ ok: false, reason: "USED" });
    });
  });

  it("consuming creates the account + pre-filled prospect from the SAME record, once", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const svc = await loadService(tx);
      const lead = await seedLead(tx, "Jon.Meyer@Example.com");
      await tx.booking.create({
        data: {
          leadId: lead.id,
          expertId: (await createUser(tx, { role: "staff" })).id,
          startsAt: new Date(Date.now() - 3600 * 1000),
          timezone: "Europe/Nicosia",
        },
      });
      await svc.issueLeadActivation({ leadId: lead.id });
      const raw = sent.links[0];

      const out = await svc.consumeLeadActivation(raw);
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      expect(out.created).toBe(true);
      expect(out.user.email).toBe("jon.meyer@example.com");

      const user = await tx.user.findUnique({ where: { email: "jon.meyer@example.com" }, include: { prospect: true } });
      expect(user!.passwordHash).toBeNull();               // no password wall
      expect(user!.emailVerified).not.toBeNull();
      expect(user!.role).toBe("prospect");
      expect(user!.phone).toBe("+357 99 123456");
      expect(user!.prospect!.leadId).toBe(lead.id);
      expect(user!.prospect!.consultationDoneAt).not.toBeNull();
      expect(user!.prospect!.servicesSelected).toEqual(["company_formation", "accounting"]);
      expect(user!.prospect!.draft).toMatchObject({ fullLegalName: "Jonathan Meyer", nationality: "Ireland", residenceCountry: "Switzerland", timeline: "immediately" });

      const after = await tx.lead.findUnique({ where: { id: lead.id } });
      expect(after!.stage).toBe("activated");
      expect(after!.activatedUserId).toBe(user!.id);

      // Second click is dead.
      expect(await svc.consumeLeadActivation(raw)).toEqual({ ok: false, reason: "USED" });
      expect(await tx.user.count({ where: { email: "jon.meyer@example.com" } })).toBe(1);
    });
  });

  it("an email that already has a password-protected account is never duplicated", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const svc = await loadService(tx);
      const lead = await seedLead(tx, "returning@example.com");
      await createUser(tx, { email: "returning@example.com", role: "client" }); // passwordHash: "x"
      const out = await svc.issueLeadActivation({ leadId: lead.id });
      expect(out).toEqual({ ok: false, reason: "ALREADY_REGISTERED" });
      expect(sent.links).toHaveLength(0);
    });
  });

  it("expired links are refused, and can be re-requested from the old token", async () => {
    await inRollbackTx(prisma, async (rawTx) => {
      const tx = wrapTx(rawTx);
      const svc = await loadService(tx);
      const lead = await seedLead(tx);
      await svc.issueLeadActivation({ leadId: lead.id });
      const raw = sent.links[0];
      await tx.leadActivation.updateMany({ where: { leadId: lead.id }, data: { expires: new Date(Date.now() - 1000) } });
      expect(await svc.peekLeadActivation(raw)).toMatchObject({ status: "expired" });
      expect(await svc.consumeLeadActivation(raw)).toEqual({ ok: false, reason: "EXPIRED" });

      const re = await svc.resendActivationFromToken(raw);
      expect(re.ok).toBe(true);
      expect(sent.links).toHaveLength(2);
      expect(await svc.peekLeadActivation(sent.links[1])).toMatchObject({ status: "valid" });
      expect(await svc.resendActivationFromToken("not-a-real-token-at-all")).toEqual({ ok: false, reason: "INVALID" });
    });
  });
});
