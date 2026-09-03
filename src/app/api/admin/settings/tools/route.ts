import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { assertRole, isSuperAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { TOOLS } from "@/lib/data/tools";

export const runtime = "nodejs";

const schema = z.object({
  // { [toolKey]: boolean } over the code catalog; null resets to "all on".
  toolsEnabled: z.record(z.string(), z.boolean()).nullable().optional(),
});

export async function PATCH(req: Request) {
  const user = await assertRole("staff");
  // Which tools a deployment offers is operator-controlled, like the plan
  // tier and the site template: tenant staff edit rates, not the lineup.
  if (!isSuperAdmin(user)) {
    return NextResponse.json({ error: "Only a super admin can change the tool lineup." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const p = parsed.data;

  const data: Record<string, unknown> = {};
  if (p.toolsEnabled !== undefined) {
    // Keep only known catalog keys, and only the ones actually switched off —
    // absent means enabled, so an all-on map stores as empty/null.
    const known = new Set(TOOLS.map((t) => t.key));
    const off = Object.fromEntries(
      Object.entries(p.toolsEnabled ?? {}).filter(([k, v]) => known.has(k) && v === false),
    );
    data.toolsEnabled = Object.keys(off).length > 0 ? off : Prisma.DbNull;
  }

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ ok: true });
}
