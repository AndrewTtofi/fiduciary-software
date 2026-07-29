import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  done: z.boolean().optional(),
  label: z.string().min(2).max(200).optional(),
});

/** Tick / untick or rename a staff-checklist item. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const item = await prisma.checklistItem.findUnique({ where: { id }, select: { id: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.checklistItem.update({
    where: { id },
    data: {
      ...(body.data.label !== undefined && { label: body.data.label.trim() }),
      ...(body.data.done !== undefined && { done: body.data.done, doneAt: body.data.done ? new Date() : null }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const item = await prisma.checklistItem.findUnique({ where: { id }, select: { id: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.checklistItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
