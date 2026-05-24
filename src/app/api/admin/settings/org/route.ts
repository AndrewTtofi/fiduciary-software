import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  displayName: z.string().min(1).max(150),
  contactEmail: z.string().email().or(z.literal("")).nullable(),
  address: z.string().max(1000).nullable(),
});

export async function PATCH(req: Request) {
  await assertRole("staff");
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const data = {
    displayName: parsed.data.displayName,
    contactEmail: parsed.data.contactEmail || null,
    address: parsed.data.address || null,
  };
  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ ok: true });
}
