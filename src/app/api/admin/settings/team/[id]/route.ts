import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["staff", "partner"]).optional(),
  deactivated: z.boolean().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await assertRole("staff");
  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: "You cannot modify your own account here." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role !== "staff" && target.role !== "partner") {
    return NextResponse.json({ error: "Only staff and partner accounts can be modified here." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.deactivated !== undefined && {
        deactivatedAt: parsed.data.deactivated ? new Date() : null,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
