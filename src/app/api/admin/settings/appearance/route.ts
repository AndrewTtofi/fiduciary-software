import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { assertRole, isSuperAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { FRONT_TEMPLATE_KEYS, FRONT_FONT_KEYS } from "@/lib/front-templates";

export const runtime = "nodejs";

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour");
const fontKey = z.enum(FRONT_FONT_KEYS);

const schema = z.object({
  frontTemplate: z.enum(FRONT_TEMPLATE_KEYS).optional(),
  // Per-template overrides; null clears them (back to the template defaults).
  frontTheme: z
    .object({
      primary: hex.optional(),
      accent: hex.optional(),
      bg: hex.optional(),
      displayFont: fontKey.optional(),
      bodyFont: fontKey.optional(),
    })
    .strict()
    .nullable()
    .optional(),
});

export async function PATCH(req: Request) {
  const user = await assertRole("staff");
  // The front-face template is operator-controlled, like the plan tier:
  // tenant staff manage content and identity, not which UI ships.
  if (!isSuperAdmin(user)) {
    return NextResponse.json({ error: "Only a super admin can change the site template." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const p = parsed.data;

  // Sparse write — only persist keys actually sent (matches settings/org).
  const data: Record<string, unknown> = {};
  if (p.frontTemplate !== undefined) data.frontTemplate = p.frontTemplate;
  if (p.frontTheme !== undefined) {
    const overrides = p.frontTheme && Object.keys(p.frontTheme).length > 0 ? p.frontTheme : null;
    data.frontTheme = overrides ?? Prisma.DbNull;
  }

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json({ ok: true });
}
