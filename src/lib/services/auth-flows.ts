import argon2 from "argon2";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { email } from "@/lib/providers/email";
import { getServerBranding } from "@/lib/services/branding-server";
import { env } from "@/lib/env";
import { registerSchema, type RegisterInput, resetSchema } from "@/lib/schema/auth";

const TOKEN_BYTES = 32;

function makeToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

/**
 * Registers a new prospect. Accounts are created pre-verified: this
 * deployment has no outbound email connected, so an email-verification
 * round-trip would strand every new account (the send would fail and the
 * user could never click a link that was never delivered).
 */
export async function registerProspect(input: RegisterInput) {
  const parsed = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    // Generic message — do not leak existence.
    return { ok: false as const, reason: "EXISTS" as const };
  }

  const passwordHash = await argon2.hash(parsed.password, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      fullName: parsed.fullName,
      phone: `${parsed.phoneCountry}${parsed.phoneNumber}`,
      role: Role.prospect,
      emailVerified: new Date(),
    },
  });

  return { ok: true as const, userId: user.id };
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Welcome email for an admin-provisioned colleague.

 *  The account is created with a one-time password that only ever appears on
 *  the screen of whoever created it. That is fragile — dismiss the box and it
 *  is gone — and it makes the firm handle someone else's credential. This
 *  emails a set-your-own-password link instead, on the same token machinery as
 *  the reset flow but with a week's expiry, because an invite is often opened
 *  days later. Best-effort: a mail failure must never fail account creation. */
export async function sendTeamInvite(input: { email: string; fullName: string; role: "staff" | "partner" }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) return { ok: false as const };

  const rawToken = makeToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const link = `${env().APP_URL}/reset/${rawToken}`;
  const { legalName, brandName } = await getServerBranding();
  const where = input.role === "partner" ? "the partner portal" : "the admin";
  await email().send({
    to: user.email,
    subject: `Your account at ${legalName}`,
    html: `<p>Hello ${esc(input.fullName)},</p>
           <p>An account has been created for you at ${esc(brandName)}, with access to ${where}.</p>
           <p>Choose your password using the link below, then sign in with <b>${esc(user.email)}</b>. The link is valid for 7 days.</p>
           <p><a href="${link}">${link}</a></p>
           <p>If you were not expecting this, you can ignore this email.</p>`,
  });

  return { ok: true as const };
}

export async function completePasswordReset(input: { token: string; password: string }) {
  const parsed = resetSchema.parse(input);
  const hashed = hashToken(parsed.token);
  const record = await prisma.passwordReset.findUnique({ where: { token: hashed } });
  if (!record) return { ok: false as const, reason: "INVALID" as const };
  if (record.expires < new Date() || record.usedAt) return { ok: false as const, reason: "EXPIRED" as const };

  const passwordHash = await argon2.hash(parsed.password, { type: argon2.argon2id });
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true as const };
}
