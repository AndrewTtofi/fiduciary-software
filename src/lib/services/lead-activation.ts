import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { email } from "@/lib/providers/email";
import { getServerBranding } from "@/lib/services/branding-server";
import { logActivity } from "@/lib/services/activity";
import { allocateReferenceNumber } from "@/lib/services/reference";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/schema/onboarding";

/* Post-call account activation.

   A website booking creates a Lead. After the first call, staff send that lead
   an activation link. Clicking it signs the prospect straight in and turns the
   SAME record into a prospect account — pre-filled from the booking, email
   locked, no password required. It must never spawn a second identity for an
   email we already hold, so the whole flow keys on the lead's email.

   Token rules (update-changes spec §3): 32 random bytes, only the SHA-256 hash
   is stored, expiring, single-use, bound to one lead, and revoked on resend. */

const TOKEN_BYTES = 32;

function makeToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}
function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function ttlMs() {
  return env().ACTIVATION_LINK_TTL_DAYS * 24 * 60 * 60 * 1000;
}

/* ── Booking answers → onboarding pre-fill ─────────────────────────────── */

/** The booking form records the public service catalogue (marketing keys such
 *  as "company-formation", and the titles joined into meta.services). The
 *  onboarding wizard keys on the platform service lines instead. Map what we
 *  can and drop the rest — a wrong pre-tick is worse than an empty one. */
const MARKETING_TO_PLATFORM: Record<string, ServiceKey> = {
  "company-formation": "company_formation",
  "accounting-vat": "accounting",
  "tax-residency": "tax_residency",
  immigration: "immigration",
  citizenship: "immigration",
  international: "licensing",
  "amazon-seller": "company_formation",
  "ip-box": "company_formation",
};
const TITLE_TO_PLATFORM: [RegExp, ServiceKey][] = [
  [/company formation/i, "company_formation"],
  [/amazon/i, "company_formation"],
  [/ip box/i, "company_formation"],
  [/accounting|vat/i, "accounting"],
  [/tax residency|non-dom/i, "tax_residency"],
  [/immigration|work permit|citizenship/i, "immigration"],
  [/licensing|international companies/i, "licensing"],
  [/business account|banking/i, "banking"],
];

export function leadServicesToPlatformKeys(lead: { serviceKey?: string | null; meta?: unknown }): ServiceKey[] {
  const out = new Set<ServiceKey>();
  const key = lead.serviceKey ?? "";
  if ((SERVICE_KEYS as readonly string[]).includes(key)) out.add(key as ServiceKey);
  else if (MARKETING_TO_PLATFORM[key]) out.add(MARKETING_TO_PLATFORM[key]);
  const meta = (lead.meta ?? {}) as Record<string, unknown>;
  const titles = typeof meta.services === "string" ? meta.services.split(",") : [];
  for (const t of titles) {
    for (const [re, k] of TITLE_TO_PLATFORM) if (re.test(t)) out.add(k);
  }
  return Array.from(out);
}

const TIMELINE_MAP: [RegExp, string][] = [
  [/as soon as possible|immediately/i, "immediately"],
  [/within 3 months/i, "1_to_3_months"],
  [/within 1 month/i, "within_1_month"],
  [/6.*12|researching|exploring/i, "exploring"],
];
const SOURCE_MAP: [RegExp, string][] = [
  [/google/i, "google"],
  [/linkedin|facebook|instagram|social/i, "social"],
  [/referral/i, "referral"],
  [/event/i, "event"],
];
function mapFirst(v: string | undefined, table: [RegExp, string][]) {
  if (!v) return undefined;
  return table.find(([re]) => re.test(v))?.[1];
}

/** Everything the booking already told us, in the wizard's draft shape, so the
 *  portal reads it back instead of asking again (spec §11). */
export function draftFromLead(lead: { name?: string | null; meta?: unknown }): Record<string, unknown> {
  const meta = (lead.meta ?? {}) as Record<string, string>;
  const nationality = (meta.nationality ?? "").split(",").map((s) => s.trim()).filter(Boolean)[0];
  const draft: Record<string, unknown> = {};
  if (lead.name?.trim()) draft.fullLegalName = lead.name.trim();
  if (nationality) draft.nationality = nationality;
  if (meta.country) {
    draft.residenceCountry = meta.country;
    draft.currentTaxResidency = meta.country;
  }
  const timeline = mapFirst(meta.timeline, TIMELINE_MAP);
  if (timeline) draft.timeline = timeline;
  const source = mapFirst(meta.heardFrom, SOURCE_MAP);
  if (source) draft.source = source;
  if (meta.relocate?.startsWith("Yes")) draft.permitType = "pr";
  return draft;
}

/* ── Issue / resend ────────────────────────────────────────────────────── */

export type IssueResult =
  | { ok: true; expires: Date }
  | { ok: false; reason: "NOT_FOUND" | "ALREADY_REGISTERED" };

/** Create a fresh single-use link for the lead, revoke any earlier ones and
 *  email it. `actorId` is the staff member (undefined for a self-service
 *  "request a new link" from an expired page). */
export async function issueLeadActivation(input: { leadId: string; actorId?: string }): Promise<IssueResult> {
  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) return { ok: false, reason: "NOT_FOUND" };

  // One email, one identity. A returning client who already has a password
  // signs in as usual; only accounts without a password (created by an earlier
  // link) may be re-activated.
  const existing = await prisma.user.findUnique({ where: { email: lead.email.toLowerCase() } });
  if (existing?.passwordHash) return { ok: false, reason: "ALREADY_REGISTERED" };

  const raw = makeToken();
  const expires = new Date(Date.now() + ttlMs());
  await prisma.$transaction([
    prisma.leadActivation.updateMany({
      where: { leadId: lead.id, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.leadActivation.create({
      data: { leadId: lead.id, tokenHash: hashToken(raw), expires, createdById: input.actorId ?? null },
    }),
    prisma.lead.update({
      where: { id: lead.id },
      data: {
        stage: lead.stage === "activated" || lead.stage === "converted" ? lead.stage : "onboarding_sent",
        activationSentAt: new Date(),
        lastActivityAt: new Date(),
      },
    }),
  ]);

  const link = `${env().APP_URL}/activate?token=${raw}`;
  const { brandName, legalName } = await getServerBranding();
  const first = (lead.name ?? "").trim().split(" ")[0] || "there";
  await email().send({
    to: lead.email,
    subject: `Your next steps with ${brandName}`,
    text: `Hello ${first},\n\nGreat speaking with you. Your onboarding is ready — open the link below to go straight to your checklist. It signs you in securely; no password needed.\n\n${link}\n\nThe link is valid for ${env().ACTIVATION_LINK_TTL_DAYS} days and can be used once.\n\n${legalName || brandName}`,
    html: `<p>Hello ${esc(first)},</p>
           <p>Great speaking with you. Your onboarding is ready — open the link below to go straight
           to your checklist. It signs you in securely; no password needed.</p>
           <p><a href="${link}">${link}</a></p>
           <p style="color:#5C6672">The link is valid for ${env().ACTIVATION_LINK_TTL_DAYS} days and can be used once.
           If you were not expecting this email, you can ignore it.</p>
           <p>${esc(legalName || brandName)}</p>`,
  });

  await logActivity({
    entityType: "lead",
    entityId: lead.id,
    action: "lead.activation_sent",
    actorId: input.actorId,
    meta: { expires: expires.toISOString(), selfService: !input.actorId },
  });

  return { ok: true, expires };
}

/* ── Peek (friendly pages) ─────────────────────────────────────────────── */

export type ActivationPeek =
  | { status: "valid"; name: string | null; email: string }
  | { status: "expired"; canResend: true }
  | { status: "used"; canResend: boolean }
  | { status: "registered" }
  | { status: "invalid" };

async function loadActivation(rawToken: string) {
  if (!rawToken || rawToken.length < 16 || rawToken.length > 200) return null;
  return prisma.leadActivation.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { lead: true },
  });
}

/** Read-only classification of a link, for the /activate page to choose what
 *  to show. Consumption happens separately, inside the auth provider. */
export async function peekLeadActivation(rawToken: string): Promise<ActivationPeek> {
  const act = await loadActivation(rawToken);
  if (!act) return { status: "invalid" };
  const user = await prisma.user.findUnique({ where: { email: act.lead.email.toLowerCase() } });
  if (user?.passwordHash) return { status: "registered" };
  if (act.usedAt || act.revokedAt) return { status: "used", canResend: true };
  if (act.expires < new Date()) return { status: "expired", canResend: true };
  return { status: "valid", name: act.lead.name, email: act.lead.email };
}

/** "Request a new link" from an expired/used page. The old token identifies
 *  the lead, so the visitor never types an email (no enumeration surface). */
export async function resendActivationFromToken(rawToken: string): Promise<IssueResult | { ok: false; reason: "INVALID" }> {
  const act = await loadActivation(rawToken);
  if (!act) return { ok: false, reason: "INVALID" };
  return issueLeadActivation({ leadId: act.leadId });
}

/* ── Consume (sign-in) ─────────────────────────────────────────────────── */

export type ConsumeResult =
  | { ok: true; user: { id: string; email: string; fullName: string; role: "prospect" | "client" | "staff" }; created: boolean }
  | { ok: false; reason: "INVALID" | "EXPIRED" | "USED" | "REGISTERED" };

/** Redeem a link: mark it used (atomically, so a double click cannot redeem
 *  twice), find-or-create the user for the lead's email, and make sure a
 *  pre-filled prospect exists. Returns the user for the auth provider. */
export async function consumeLeadActivation(rawToken: string): Promise<ConsumeResult> {
  const act = await loadActivation(rawToken);
  if (!act) return { ok: false, reason: "INVALID" };
  const lead = act.lead;
  const emailLc = lead.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: emailLc }, include: { prospect: true } });
  if (existing?.passwordHash) return { ok: false, reason: "REGISTERED" };
  if (existing?.deactivatedAt) return { ok: false, reason: "INVALID" };
  if (act.usedAt || act.revokedAt) return { ok: false, reason: "USED" };
  if (act.expires < new Date()) return { ok: false, reason: "EXPIRED" };

  // Reference numbers are allocated off the singleton client on purpose — the
  // helper retries on collision and must not be nested in the transaction.
  const referenceNumber = existing?.prospect ? null : await allocateReferenceNumber();
  const now = new Date();
  const pastCall = await prisma.booking.findFirst({
    where: { leadId: lead.id, startsAt: { lte: now }, status: { in: ["confirmed", "completed"] } },
    orderBy: { startsAt: "desc" },
    select: { startsAt: true },
  });
  const services = leadServicesToPlatformKeys(lead);
  const seededDraft = draftFromLead(lead);

  const outcome = await prisma.$transaction(async (tx) => {
    // Single-use guard: only the first redeem flips usedAt.
    const claimed = await tx.leadActivation.updateMany({
      where: { id: act.id, usedAt: null, revokedAt: null },
      data: { usedAt: now },
    });
    if (claimed.count === 0) return { used: true as const };

    const fullName = (lead.name ?? "").trim() || emailLc.split("@")[0];
    const user =
      existing ??
      (await tx.user.create({
        data: {
          email: emailLc,
          fullName: fullName.length >= 2 ? fullName : emailLc,
          phone: lead.phone || null,
          role: "prospect",
          // The link reached this inbox, so the address is verified. No
          // password yet: they set one from inside the portal if they wish.
          emailVerified: now,
        },
      }));
    if (existing && !existing.phone && lead.phone) {
      await tx.user.update({ where: { id: user.id }, data: { phone: lead.phone } });
    }

    let created = false;
    const prospect = existing?.prospect ?? null;
    if (!prospect) {
      await tx.prospect.create({
        data: {
          userId: user.id,
          referenceNumber: referenceNumber!,
          status: "pending",
          servicesSelected: services,
          draft: seededDraft as never,
          leadId: lead.id,
          consultationDoneAt: pastCall?.startsAt ?? now,
        },
      });
      created = true;
    } else {
      const existingServices = Array.isArray(prospect.servicesSelected) ? (prospect.servicesSelected as string[]) : [];
      const existingDraft = (prospect.draft as Record<string, unknown> | null) ?? {};
      await tx.prospect.update({
        where: { id: prospect.id },
        data: {
          leadId: prospect.leadId ?? lead.id,
          consultationDoneAt: prospect.consultationDoneAt ?? pastCall?.startsAt ?? now,
          servicesSelected: existingServices.length ? existingServices : services,
          // Fill gaps only — never overwrite what the person typed themselves.
          draft: { ...seededDraft, ...existingDraft } as never,
        },
      });
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: { stage: "activated", activatedAt: now, activatedUserId: user.id, lastActivityAt: now },
    });

    return { used: false as const, user, created };
  });

  if (outcome.used) return { ok: false, reason: "USED" };

  await logActivity({
    entityType: "lead",
    entityId: lead.id,
    action: "lead.activated",
    actorId: outcome.user.id,
    meta: { userId: outcome.user.id, createdAccount: !existing, createdProspect: outcome.created },
  });
  if (outcome.created) {
    const p = await prisma.prospect.findUnique({ where: { userId: outcome.user.id }, select: { id: true, referenceNumber: true } });
    if (p) {
      await logActivity({
        entityType: "prospect",
        entityId: p.id,
        action: "submission.created",
        actorId: outcome.user.id,
        meta: { reference: p.referenceNumber, fromLead: lead.id },
      });
    }
  }

  return {
    ok: true,
    created: outcome.created,
    user: { id: outcome.user.id, email: outcome.user.email, fullName: outcome.user.fullName, role: outcome.user.role },
  };
}
