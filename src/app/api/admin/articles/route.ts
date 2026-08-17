import { NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { articleSchema, publishBlockers } from "@/lib/schema/article";

export const runtime = "nodejs";

/** List all articles (drafts included). Staff-only. */
export async function GET() {
  await assertRole("staff");
  const articles = await prisma.article.findMany({
    orderBy: [{ published: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ articles });
}

/** Create an article. Staff-only. */
export async function POST(req: Request) {
  await assertRole("staff");
  const parsed = articleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const blocker = publishBlockers(parsed.data);
  if (blocker) return NextResponse.json({ error: blocker }, { status: 422 });
  const exists = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "That URL slug is already in use" }, { status: 409 });

  const { correctAsAt, ...rest } = parsed.data;
  const article = await prisma.article.create({
    data: {
      ...rest,
      image: rest.image || null,
      correctAsAt: correctAsAt ? new Date(correctAsAt) : null,
      publishedAt: rest.published ? new Date() : null,
    },
  });
  return NextResponse.json({ article });
}
