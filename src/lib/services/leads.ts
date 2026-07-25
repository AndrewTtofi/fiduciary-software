import { prisma } from "@/lib/db";
import { email } from "@/lib/providers/email";
import { getServerBranding } from "@/lib/services/branding-server";

export type LeadSource = "calculator" | "intake" | "manual" | "contact";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* Labels for the meta fields the booking form collects. */
const META_LABELS: Record<string, string> = {
  country: "Lives and pays tax in",
  nationality: "Citizenship / passports",
  heardFrom: "Heard about us via",
  preferredSlotLabel: "Preferred slot (Cyprus time)",
};

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
}) {
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

  // High-value routing per the firm's lead spec: licensing leads are flagged.
  const highValue = input.serviceKey === "licensing";

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
             ${highValue ? "<p><b>Licensing lead. Flagged high value.</b></p>" : ""}
             <p>Confirm the slot with the visitor to complete the booking.</p>`,
    });
  }

  await email().send({
    to: input.email,
    subject: `Your consultation request with ${brandName}`,
    html: `<p>Hello ${esc(name)},</p>
           <p>We received your consultation request and your answers. A founding partner reads
           them before you speak, so you never repeat your story.</p>
           <p>We will confirm your slot by email${input.phone ? " or WhatsApp" : ""} within 24 hours.</p>
           <p>${esc(legalName || brandName)}</p>`,
  });
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
