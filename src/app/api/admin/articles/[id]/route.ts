import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const patchSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  title: z.string().min(3).max(200).optional(),
  keyword: z.string().min(2).max(80).optional(),
  excerpt: z.string().min(3).max(500).optional(),
  body: z.string().min(10).max(60_000).optional(),
  image: z.string().max(500).nullable().optional(),
  published: z.boolean().optional(),
});

/** Update an article; sets publishedAt on first publish. Staff-only. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    const clash = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
    if (clash) return NextResponse.json({ error: "That URL slug is already in use" }, { status: 409 });
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.image !== undefined && { image: parsed.data.image || null }),
      ...(parsed.data.published && !existing.publishedAt && { publishedAt: new Date() }),
    },
  });
  return NextResponse.json({ article });
}

/** Delete an article. Staff-only. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await assertRole("staff");
  const { id } = await params;
  await prisma.article.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
