import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({ label: z.string().min(2).max(200) });

/** Add an item to a client's staff-only checklist. Available on every plan —
 *  on Starter this checklist is the whole compliance story. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const client = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const last = await prisma.checklistItem.findFirst({
    where: { clientId: id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const created = await prisma.checklistItem.create({
    data: { clientId: id, label: body.data.label.trim(), sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
