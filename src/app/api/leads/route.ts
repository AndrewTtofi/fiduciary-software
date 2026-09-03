import { NextResponse } from "next/server";
import { z } from "zod";
import { sendConsultationEmails, setLeadFunnelStage, upsertLead } from "@/lib/services/leads";
import { createPublicBooking } from "@/lib/services/booking";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(150).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  serviceKey: z.string().max(60).optional().nullable(),
  source: z.enum(["calculator", "intake", "manual", "contact"]).default("calculator"),
  // The booking form allows a 500-char situation brief — keep the cap in sync.
  note: z.string().max(500).optional().nullable(),
  // extra contact-form fields (country, nationality, situation answers, slot, referral)
  meta: z.record(z.string(), z.string().max(400)).optional().nullable(),
  // The booking form saves the lead as soon as name + email are given (step 3
  // of 4), before the slot is picked — an abandon on the calendar is still a
  // lead. A partial save never books and never emails; the final submit
  // upserts the same record (email + source) and completes the booking.
  partial: z.boolean().optional(),
});

/** Public lead capture — tax-calculator reveals, the contact/booking form and
 *  other front-funnel forms. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit({ bucket: "lead", key: ip, limit: 20, windowSec: 3600 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { partial, ...data } = parsed.data;
  if (partial) {
    await upsertLead({ ...data, meta: { ...(data.meta ?? {}), funnelStage: "plan_requested" } });
    return NextResponse.json({ ok: true, partial: true });
  }

  const slotIso = data.meta?.preferredSlot;
  // "slot_pending" until the booking below actually lands — a 409 must not
  // leave the record claiming a slot it never got.
  const lead = await upsertLead(
    data.source === "contact" ? { ...data, meta: { ...(data.meta ?? {}), funnelStage: "slot_pending" } } : data,
  );

  // Booking-form submissions with a slot pick hard-book it: the slot is
  // reserved internally and mirrored into the staff calendar. A conflict
  // returns 409 so the form can refresh availability — the lead (with every
  // answer) is already stored either way.
  let booked = false;
  if (data.source === "contact" && slotIso) {
    const result = await createPublicBooking({
      leadId: lead.id,
      name: data.name?.trim() || data.email,
      email: data.email.trim(),
      slotIso,
      timezone: data.meta?.timezone || "Asia/Nicosia",
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });
    booked = true;
    await setLeadFunnelStage(lead.id, "booked");
  }

  // Notify the firm (and, for slot-less requests, confirm to the visitor —
  // hard-booked visitors already got their confirmation with the invite).
  // Best-effort: the lead is already stored, so a mail outage never 500s the form.
  if (data.source === "contact") {
    sendConsultationEmails(data, { booked }).catch((err) => {
      console.error("[leads] consultation emails failed:", err);
    });
  }
  return NextResponse.json({ ok: true, booked });
}
