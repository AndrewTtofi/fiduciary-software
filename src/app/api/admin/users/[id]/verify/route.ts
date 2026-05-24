import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await assertRole("staff");
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, emailVerified: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  await prisma.user.update({ where: { id }, data: { emailVerified: new Date() } });
  await logActivity({ entityType: "user", entityId: id, action: "user.email_verified", actorId: actor.id });

  return NextResponse.json({ ok: true });
}
