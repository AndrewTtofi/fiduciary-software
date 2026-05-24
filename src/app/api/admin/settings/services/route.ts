import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const createSchema = z.object({
  key: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/, "Use lowercase, digits, underscore"),
  label: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const exists = await prisma.service.findUnique({ where: { key: parsed.data.key } });
  if (exists) return NextResponse.json({ error: `Key "${parsed.data.key}" already exists` }, { status: 409 });

  const created = await prisma.service.create({
    data: {
      key: parsed.data.key,
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
