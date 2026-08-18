import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, isSuperAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  deactivated: z.boolean().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: "You cannot modify your own account here." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role !== "staff") {
    return NextResponse.json({ error: "Only staff accounts can be modified here." }, { status: 400 });
  }
  // Firm admins manage their own colleagues, but must not be able to demote or
  // lock out the platform operator — deactivating that account would block the
  // only login that can reach plan tier and org settings.
  if (isSuperAdmin(target) && !isSuperAdmin(me)) {
    return NextResponse.json({ error: "That account is managed by the platform operator." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.deactivated !== undefined && {
        deactivatedAt: parsed.data.deactivated ? new Date() : null,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
