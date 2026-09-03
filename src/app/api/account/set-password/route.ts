import { NextResponse } from "next/server";
import argon2 from "argon2";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { passwordPolicy } from "@/lib/schema/auth";

export const runtime = "nodejs";

const schema = z.object({ password: passwordPolicy });

/**
 * First password for an account that has none — i.e. one created by the
 * post-call activation link. Optional by design: they are already signed in,
 * this only lets them come back later with email + password. Accounts that
 * already have a password must use /api/account/password (current password
 * required), so a hijacked session cannot silently rotate credentials here.
 */
export async function POST(req: Request) {
  const user = await assertRole("prospect", "client", "staff");
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 422 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dbUser.passwordHash) return NextResponse.json({ error: "A password is already set." }, { status: 409 });

  const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await logActivity({ entityType: "user", entityId: user.id, action: "user.password_set", actorId: user.id });
  return NextResponse.json({ ok: true });
}
