import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { provisionProspectAccount } from "@/lib/services/users";

export const runtime = "nodejs";

/**
 * Convert a CRM lead into a prospect account: provisions a pre-verified user
 * from the lead's details (one-time password returned once) and marks the
 * lead's stage as converted. If an account with the lead's email already
 * exists, the lead is just marked converted.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await assertRole("staff");
  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Contact-form leads may be anonymous — fall back to the email local part.
  const fullName = lead.name?.trim() || lead.email.split("@")[0];

  const result = await provisionProspectAccount({
    email: lead.email,
    fullName: fullName.length >= 2 ? fullName : lead.email,
    phone: lead.phone,
    actorId: actor.id,
  });

  await prisma.lead.update({
    where: { id },
    data: { stage: "converted", lastActivityAt: new Date() },
  });

  if (!result.ok) return NextResponse.json({ ok: true, existing: true, email: lead.email });
  return NextResponse.json({ ok: true, email: result.user.email, tempPassword: result.tempPassword });
}
