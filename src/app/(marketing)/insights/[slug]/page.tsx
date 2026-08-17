import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles, relatedArticles, wordCount } from "@/lib/services/articles";
import { getSiteContent } from "@/lib/services/content";
import { getServerBranding } from "@/lib/services/branding-server";
import { getService } from "@/components/marketing/ServiceIcons";
import { Markdown, extractHeadings } from "@/components/marketing/Markdown";
import { InsightCard } from "@/components/marketing/InsightCard";
import { WhatsAppButton, formatDate } from "@/components/marketing/mk";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Contents list appears on articles over roughly this many words. */
const CONTENTS_THRESHOLD = 1200;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticleBySlug((await params).slug);
  if (!article) return { title: "Insights" };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDesc || article.excerpt,
    alternates: { canonical: `${env().APP_URL}/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.metaTitle || article.title,
      description: article.metaDesc || article.excerpt,
      ...(article.image && { images: [article.image] }),
      ...(article.publishedAt && { publishedTime: article.publishedAt.toISOString() }),
      ...(article.author && { authors: [article.author] }),
    },
  };
}

/** Article page — the template from the Insights spec, top to bottom:
 *  category, title (H1), author, publication + "correct as at" dates,
 *  featured image, body (with a contents list on long articles), author
 *  block, two related articles, then the related service link with the
 *  booking and WhatsApp buttons. Article schema markup for search. */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [article, all, { contact }, { legalName, brandName, jurisdiction }] = await Promise.all([
    getArticleBySlug(slug),
    getPublishedArticles(),
    getSiteContent(),
    getServerBranding(),
  ]);
  if (!article) notFound();

  const related = relatedArticles(all, article, 2);
  const service = article.serviceKey ? getService(article.serviceKey) : undefined;
  const headings = wordCount(article.body) > CONTENTS_THRESHOLD ? extractHeadings(article.body).filter((h) => h.level === 2) : [];
  const url = `${env().APP_URL}/insights/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    ...(article.image && { image: [article.image] }),
    ...(article.publishedAt && { datePublished: article.publishedAt.toISOString() }),
    ...(article.correctAsAt && { dateModified: article.correctAsAt.toISOString() }),
    author: article.author ? [{ "@type": "Person", name: article.author, ...(article.authorRole && { jobTitle: article.authorRole }) }] : undefined,
    publisher: { "@type": "Organization", name: legalName || brandName },
    mainEntityOfPage: url,
    articleSection: article.category,
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="sec" style={{ paddingTop: 48 }}>
        <div className="mk-container article">
          <Link href="/insights" className="back">← All insights</Link>
          <span className="icard-cat" style={{ display: "inline-block", marginBottom: 12 }}>{article.category}</span>
          <h1 style={{ maxWidth: "26ch", fontSize: "clamp(1.8rem,3.6vw,2.6rem)" }}>{article.title}</h1>
          <div className="article-meta">
            {article.author && <span className="by">By <b>{article.author}</b>{article.authorRole ? `, ${article.authorRole}` : ""}</span>}
            {article.publishedAt && <span>Published {formatDate(article.publishedAt)}</span>}
            {article.correctAsAt && <span>Correct as at {formatDate(article.correctAsAt)}</span>}
          </div>
          {article.image && (
            <figure className="article-hero">
              {/* eslint-disable-next-line @next/next/no-img-element -- author-supplied URL, no next/image loader for it */}
              <img src={article.image} alt="" />
            </figure>
          )}
          {headings.length > 1 && (
            <nav className="article-toc" aria-label="Contents">
              <b>Contents</b>
              <ol>
                {headings.map((h) => (
                  <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                ))}
              </ol>
            </nav>
          )}
          <div className="article-body">
            <p className="lead">{article.excerpt}</p>
            <Markdown text={article.body} />
          </div>

          {article.author && (
            <div className="author-block">
              <span className="kicker" style={{ marginBottom: 6 }}>About the author</span>
              <b>{article.author}</b>
              {article.authorRole && <span className="role">{article.authorRole}</span>}
              {article.authorBio && <p>{article.authorBio}</p>}
            </div>
          )}

          {related.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>Related guides</h2>
              <div className="ins4-grid two" style={{ marginTop: 0 }}>
                {related.map((a, i) => (
                  <InsightCard key={a.slug} article={a} index={i} />
                ))}
              </div>
            </div>
          )}

          <div className="cta-box">
            <h3>{service ? `Talk to us about ${service.band}` : "Speak with us before you move"}</h3>
            <p>
              Your citizenship, current tax residency and company setup all change the right
              sequence. We will map your exact route on a call.
            </p>
            <div className="final-btns" style={{ marginTop: 20 }}>
              <Link href="/book" className="pill">Book a Free Consultation</Link>
              <WhatsAppButton number={contact.whatsapp} className="pill ghost on-dark" />
            </div>
            {service && (
              <p style={{ marginTop: 16 }}>
                <Link href={`/services/${service.key}`} className="link-gold">See our {service.title} service →</Link>
              </p>
            )}
          </div>
          <p className="disc">
            {legalName ? `${legalName}${contact.address ? `, ${contact.address}` : ""}. ` : ""}
            General information based on the rules in force at the &ldquo;correct as at&rdquo; date, not
            advice. Government sources are cited where a figure comes from them. Your position is
            confirmed on a call in {jurisdiction || "Cyprus"}.
          </p>
        </div>
      </section>
    </main>
  );
}
