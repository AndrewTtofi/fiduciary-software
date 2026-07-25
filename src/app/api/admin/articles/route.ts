import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { STARTER_ARTICLES } from "@/lib/services/articles";

export const runtime = "nodejs";

const articleSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase words separated by hyphens"),
  title: z.string().min(3).max(200),
  keyword: z.string().min(2).max(80),
  excerpt: z.string().min(3).max(500),
  body: z.string().min(10).max(60_000),
  image: z.string().max(500).nullable().optional(),
  published: z.boolean(),
});

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
  const raw = await req.json().catch(() => ({}));

  // One-click import of the built-in starter guides so they become editable.
  if (raw?.action === "import-starters") {
    for (const a of STARTER_ARTICLES) {
      await prisma.article.upsert({
        where: { slug: a.slug },
        update: {},
        create: {
          slug: a.slug,
          title: a.title,
          keyword: a.keyword,
          excerpt: a.excerpt,
          body: a.body,
          image: a.image,
          published: true,
          publishedAt: new Date(),
        },
      });
    }
    return NextResponse.json({ ok: true, imported: STARTER_ARTICLES.length });
  }

  const parsed = articleSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const exists = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "That URL slug is already in use" }, { status: 409 });

  const article = await prisma.article.create({
    data: {
      ...parsed.data,
      image: parsed.data.image || null,
      publishedAt: parsed.data.published ? new Date() : null,
    },
  });
  return NextResponse.json({ article });
}
