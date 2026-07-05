import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  fullName: z.string().min(2).max(150),
  phone: z.string().max(40).optional(),
});

function makeTempPassword() {
  // 12 char base64url is plenty for a one-time bootstrap secret.
  return crypto.randomBytes(9).toString("base64url");
}

/**
 * Staff-provisioned client account. Created as a prospect (the normal entry
 * point of the pipeline: onboarding → approval → conversion) with the email
 * pre-verified — the admin vouches for the address, so no verification email
 * round-trip is needed.
 */
export async function POST(req: Request) {
  const actor = await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });

  const tempPassword = makeTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      role: "prospect",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await logActivity({
    entityType: "user",
    entityId: user.id,
    action: "user.created",
    actorId: actor.id,
    meta: { provisionedByAdmin: true },
  });

  return NextResponse.json({ ok: true, email: parsed.data.email, tempPassword });
}
