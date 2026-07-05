import argon2 from "argon2";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

/**
 * Staff-provisioned client account. Created as a prospect (the normal entry
 * point of the pipeline: onboarding → approval → conversion) with the email
 * pre-verified — the admin vouches for the address, so no verification email
 * round-trip is needed. Returns a one-time password to hand to the client.
 */
export async function provisionProspectAccount(input: {
  email: string;
  fullName: string;
  phone?: string | null;
  actorId: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, reason: "exists" as const, userId: existing.id };

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: {
      email,
      fullName: input.fullName,
      phone: input.phone || null,
      role: "prospect",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await logActivity({
    entityType: "user",
    entityId: user.id,
    action: "user.created",
    actorId: input.actorId,
    meta: { provisionedByAdmin: true },
  });

  return { ok: true as const, user, tempPassword };
}
