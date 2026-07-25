import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { ArticlesManager, type ArticleRow } from "./ArticlesManager";

export const metadata = { title: "Insights articles" };
export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  await requireRole("staff");
  const rows = await prisma.article.findMany({
    orderBy: [{ published: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
  const articles: ArticleRow[] = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    keyword: a.keyword,
    excerpt: a.excerpt,
    body: a.body,
    image: a.image,
    published: a.published,
  }));
  return (
    <AdminShell active="insights">
      <div className="mb-8">
        <div className="eyebrow mb-2">Marketing site</div>
        <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Insights articles</h2>
        <p className="mt-2 max-w-[62ch] text-muted" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
          Write, edit and publish the articles on the public Insights pages yourself. Each
          article targets one search phrase: put the phrase in the title, the URL slug and the
          first sentence. Published articles appear at /insights/&lt;slug&gt; immediately.
        </p>
      </div>
      <ArticlesManager initial={articles} />
    </AdminShell>
  );
}
