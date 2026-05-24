import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  label: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
}).strict();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.service.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined && { label: parsed.data.label }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.sortOrder !== undefined && { sortOrder: parsed.data.sortOrder }),
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inUse = await prisma.clientService.count({ where: { serviceType: service.key } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${inUse} client${inUse === 1 ? "" : "s"} still assigned to this service. Disable it instead.` },
      { status: 409 },
    );
  }
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
