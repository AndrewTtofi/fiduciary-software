import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { KNOWN_FLAGS } from "@/lib/services/settings";

export const runtime = "nodejs";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  await assertRole("staff");
  const { key } = await params;
  if (!KNOWN_FLAGS.some((f) => f.key === key)) {
    return NextResponse.json({ error: "Unknown flag" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled: parsed.data.enabled },
    create: { key, enabled: parsed.data.enabled },
  });
  return NextResponse.json({ ok: true });
}
