import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { articleSchema, publishBlockers } from "@/lib/schema/article";

export const runtime = "nodejs";

const patchSchema = articleSchema.partial();

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
  const { correctAsAt, ...rest } = parsed.data;
  // Publishing (now or already) must satisfy the author + date rule.
  const willPublish = rest.published ?? existing.published;
  const blocker = publishBlockers({
    published: willPublish,
    author: rest.author ?? existing.author,
    correctAsAt: correctAsAt === undefined ? (existing.correctAsAt ? "set" : null) : correctAsAt,
  });
  if (blocker) return NextResponse.json({ error: blocker }, { status: 422 });

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...rest,
      ...(rest.image !== undefined && { image: rest.image || null }),
      ...(correctAsAt !== undefined && { correctAsAt: correctAsAt ? new Date(correctAsAt) : null }),
      ...(rest.published && !existing.publishedAt && { publishedAt: new Date() }),
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
