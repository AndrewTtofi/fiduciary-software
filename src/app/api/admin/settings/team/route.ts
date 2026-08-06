import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { sendTeamInvite } from "@/lib/services/auth-flows";
import { getBranding, tierAtLeast } from "@/lib/services/branding";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  fullName: z.string().min(2).max(150),
  role: z.enum(["staff", "partner"]),
});

function makeTempPassword() {
  // 12 char base64url is plenty for a one-time bootstrap secret.
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(req: Request) {
  await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  // A partner account on a plan without partner access logs straight into a
  // "portal unavailable" wall, so refuse to create one rather than hand over
  // credentials that cannot be used.
  if (parsed.data.role === "partner") {
    const { planTier } = await getBranding();
    if (!tierAtLeast(planTier, "professional")) {
      return NextResponse.json(
        { error: "Partner access needs the Professional plan. Create this person as Staff, or ask the platform operator to upgrade." },
        { status: 409 },
      );
    }
  }

  const tempPassword = makeTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      passwordHash,
      emailVerified: new Date(), // staff/partner are admin-provisioned — already trusted
    },
  });

  // Emails a set-your-own-password link so the firm never has to relay a
  // credential. Best-effort — the one-time password below is the fallback when
  // mail is not configured.
  const invited = await sendTeamInvite(parsed.data).catch(() => ({ ok: false as const }));

  return NextResponse.json({ ok: true, email: parsed.data.email, tempPassword, invited: invited.ok });
}
