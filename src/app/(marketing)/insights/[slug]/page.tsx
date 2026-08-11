import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/services/articles";
import { getSiteContent } from "@/lib/services/content";
import { getServerBranding } from "@/lib/services/branding-server";
import { Markdown } from "@/components/marketing/Markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticleBySlug((await params).slug);
  return article
    ? { title: article.title, description: article.excerpt }
    : { title: "Insights" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const [article, { contact }, { legalName, jurisdiction }] = await Promise.all([
    getArticleBySlug((await params).slug),
    getSiteContent(),
    getServerBranding(),
  ]);
  if (!article) notFound();

  return (
    <main>
      <section className="sec" style={{ paddingTop: 48 }}>
        <div className="mk-container article">
          <Link href="/insights" className="back">← All insights</Link>
          <span className="kicker" style={{ display: "block" }}>{article.keyword}</span>
          <h1 style={{ maxWidth: "26ch", fontSize: "clamp(1.8rem,3.6vw,2.6rem)" }}>{article.title}</h1>
          <div className="article-body">
            <p className="lead">{article.excerpt}</p>
            <Markdown text={article.body} />
          </div>
          <div className="cta-box">
            <h3>Speak with us before you move</h3>
            <p>
              Your citizenship, current tax residency and company setup all change the right
              sequence. We will map your exact route on a call.
            </p>
            <Link href="/contact" className="pill" style={{ marginTop: 20 }}>
              Book Your Free 30-Minute Consultation
            </Link>
          </div>
          <p className="disc">
            {legalName ? `${legalName}${contact.address ? `, ${contact.address}` : ""}. ` : ""}
            General information based on the rules in force in 2026, not tax advice. Your
            structure is confirmed on a call in {jurisdiction || "Cyprus"}.
          </p>
        </div>
      </section>
    </main>
  );
}
