import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  heardFrom: z.string().min(1).max(120),
});

/** "How did you hear about us?" is asked AFTER the booking is confirmed (it
 *  is the least important question and used to sit in front of the calendar).
 *  This stamps the answer onto the most recent contact lead for the email —
 *  no booking, no emails, so it cannot double-submit the consultation. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit({ bucket: "lead-referral", key: ip, limit: 20, windowSec: 3600 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const email = parsed.data.email.trim().toLowerCase();
  const lead = await prisma.lead.findFirst({ where: { email, source: "contact" }, orderBy: { createdAt: "desc" } });
  // Unknown email → nothing to attach it to; still 200 so the form never
  // shows an error for the least important answer.
  if (lead) {
    const meta = (lead.meta as Record<string, string> | null) ?? {};
    await prisma.lead.update({ where: { id: lead.id }, data: { meta: { ...meta, heardFrom: parsed.data.heardFrom } } });
  }
  return NextResponse.json({ ok: true });
}
