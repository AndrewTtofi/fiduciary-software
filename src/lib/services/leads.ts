import { prisma } from "@/lib/db";
import { email } from "@/lib/providers/email";
import { getServerBranding } from "@/lib/services/branding-server";
import { EU_FREE_MOVEMENT } from "@/lib/data/countries";

export type LeadSource = "calculator" | "intake" | "manual" | "contact";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Labels for the meta fields the booking form collects. */
const META_LABELS: Record<string, string> = {
  country: "Lives and pays tax in",
  nationality: "Citizenship / passports",
  relocate: "Relocating to Cyprus",
  property: "Property interest",
  timeline: "Timeline",
  services: "Services needed",
  heardFrom: "Heard about us via",
  preferredSlotLabel: "Preferred slot (Cyprus time)",
};

/** Where the visitor got to in the booking funnel. Stored on `meta.funnelStage`
 *  so staff can tell a plan request that stalled on the calendar from a
 *  booked call without a schema change. */
export type FunnelStage = "plan_requested" | "slot_pending" | "booked";

export async function setLeadFunnelStage(leadId: string, funnelStage: FunnelStage) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { meta: true } });
  if (!lead) return;
  await prisma.lead.update({
    where: { id: leadId },
    data: { meta: { ...((lead.meta as Record<string, string> | null) ?? {}), funnelStage } },
  });
}

/** Automatic lead routing per the firm's spec. Flags are internal only — they
 *  go on the lead record and the staff notification, never to the visitor.
 *  - Non-EU/EEA citizenship + relocating → the immigration route is required.
 *  - Property "for permanent residency" or "maybe" → PR-by-investment lead.
 *  - Licensing in the requested services → high-value lead.
 *  The last two notify the founders directly (subject-line escalation). */
export function computeLeadFlags(input: {
  serviceKey?: string | null;
  meta?: Record<string, string> | null;
}): { flags: string[]; highValue: boolean } {
  const m = input.meta ?? {};
  const flags: string[] = [];

  const citizenships = (m.nationality ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const nonEu = citizenships.some((c) => !EU_FREE_MOVEMENT.has(c));
  const relocating = (m.relocate ?? "").startsWith("Yes");
  if (nonEu && relocating) flags.push("Immigration route required");

  const property = m.property ?? "";
  const prInterest = property.startsWith("Yes, for permanent residency") || property.startsWith("Maybe");
  if (prInterest) flags.push("PR by investment opportunity");

  // "licensing" is the platform key; "international" is the public service
  // page (International Companies and Licensing) the booking form sends.
  const licensing =
    input.serviceKey === "licensing" || input.serviceKey === "international" || /licensing/i.test(m.services ?? "");
  if (licensing) flags.push("High value licensing lead");

  return { flags, highValue: prInterest || licensing };
}

/** Consultation-request emails: a full-answer notification to the firm and a
 *  confirmation to the visitor. Best-effort — a mail failure must never fail
 *  the lead capture, so callers fire-and-forget with a catch. */
export async function sendConsultationEmails(input: {
  email: string;
  name?: string | null;
  phone?: string | null;
  serviceKey?: string | null;
  note?: string | null;
  meta?: Record<string, string> | null;
}, opts: { booked?: boolean } = {}) {
  const { brandName, legalName, contactEmail } = await getServerBranding();
  const name = input.name?.trim() || "there";

  const rows: [string, string][] = [
    ["Name", input.name ?? ""],
    ["Email", input.email],
    ["WhatsApp", input.phone ?? ""],
    ["Service needed", input.serviceKey ?? ""],
  ];
  for (const [key, label] of Object.entries(META_LABELS)) {
    const v = input.meta?.[key];
    if (v) rows.push([label, v]);
  }
  if (input.note) rows.push(["Their situation", input.note]);

  const { flags, highValue } = computeLeadFlags(input);

  if (contactEmail) {
    await email().send({
      to: contactEmail,
      subject: `${highValue ? "[High value] " : ""}New consultation request from ${input.name ?? input.email}`,
      html: `<p>A visitor booked a consultation on the website. Every answer is below and on the lead record in the admin.</p>
             <table cellpadding="6" style="border-collapse:collapse">
               ${rows
                 .filter(([, v]) => v)
                 .map(([k, v]) => `<tr><td style="color:#5C6672">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`)
                 .join("")}
             </table>
             ${
               flags.length
                 ? `<p><b>Internal routing (not shown to the visitor):</b></p>
                    <ul>${flags.map((f) => `<li><b>${esc(f)}</b></li>`).join("")}</ul>`
                 : ""
             }
             ${
               opts.booked
                 ? "<p>The slot is <b>booked</b> — reserved internally and mirrored to the calendar.</p>"
                 : "<p>Confirm the slot with the visitor to complete the booking.</p>"
             }`,
    });
  }

  // Hard-booked visitors already received their confirmation with the
  // calendar invite — only slot-less requests get the "we'll confirm" email.
  if (!opts.booked) {
    await email().send({
      to: input.email,
      subject: `Your consultation request with ${brandName}`,
      html: `<p>Hello ${esc(name)},</p>
             <p>We received your consultation request and your answers. They are read
             before you speak, so you never repeat your story.</p>
             <p>We will confirm your slot by email${input.phone ? " or WhatsApp" : ""} within 24 hours.</p>
             <p>${esc(legalName || brandName)}</p>`,
    });
  }
}

/** Create a lead, or refresh an existing one with the same email + source so we
 *  don't pile up duplicates from repeated calculator reveals / save-and-exits. */
export async function upsertLead(input: {
  email: string;
  name?: string | null;
  phone?: string | null;
  serviceKey?: string | null;
  source: LeadSource;
  note?: string | null;
  meta?: Record<string, string> | null;
}) {
  const email = input.email.trim().toLowerCase();
  // Stamp the automatic routing flags onto the record so staff read them in
  // the CRM without re-deriving the logic.
  const { flags } = computeLeadFlags(input);
  if (flags.length) {
    input = { ...input, meta: { ...(input.meta ?? {}), flags: flags.join(" · ") } };
  }
  const existing = await prisma.lead.findFirst({
    where: { email, source: input.source },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return prisma.lead.update({
      where: { id: existing.id },
      data: {
        lastActivityAt: new Date(),
        name: input.name ?? existing.name,
        phone: input.phone ?? existing.phone,
        serviceKey: input.serviceKey ?? existing.serviceKey,
        note: input.note ?? existing.note,
        meta: input.meta ?? existing.meta ?? undefined,
      },
    });
  }
  return prisma.lead.create({
    data: {
      email,
      name: input.name ?? null,
      phone: input.phone ?? null,
      serviceKey: input.serviceKey ?? null,
      source: input.source,
      note: input.note ?? null,
      meta: input.meta ?? undefined,
    },
  });
}

export async function listLeads() {
  return prisma.lead.findMany({ orderBy: { lastActivityAt: "desc" } });
}
