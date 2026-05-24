import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import crypto from "node:crypto";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

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

  return NextResponse.json({ ok: true, email: parsed.data.email, tempPassword });
}
