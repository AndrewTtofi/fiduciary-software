"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageField } from "@/components/admin/ImageField";
import { ARTICLE_CATEGORIES } from "@/lib/data/article-categories";
import { SERVICES } from "@/components/marketing/ServiceIcons";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  keyword: string;
  category: string;
  excerpt: string;
  body: string;
  image: string | null;
  author: string;
  authorRole: string;
  authorBio: string;
  /** YYYY-MM-DD or "". */
  correctAsAt: string;
  metaTitle: string;
  metaDesc: string;
  serviceKey: string;
  published: boolean;
};

type Draft = Omit<ArticleRow, "id"> & { id?: string };

const BLANK: Draft = {
  slug: "", title: "", keyword: "", category: ARTICLE_CATEGORIES[0], excerpt: "", body: "", image: "",
  author: "", authorRole: "", authorBio: "", correctAsAt: "", metaTitle: "", metaDesc: "", serviceKey: "",
  published: false,
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

/** Self-serve article CRUD for staff: list, create, edit, publish, delete.
 *  Articles are added continuously — each is live the moment it is saved as
 *  published. The author name and "correct as at" date are required to
 *  publish (Insights spec). */
export function ArticlesManager({ initial }: { initial: ArticleRow[] }) {
  const [articles, setArticles] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const set = (k: keyof Draft, v: string | boolean) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function refresh() {
    const res = await fetch("/api/admin/articles");
    if (res.ok) {
      const body = (await res.json()) as { articles: (Omit<ArticleRow, "correctAsAt"> & { correctAsAt: string | null })[] };
      setArticles(body.articles.map((a) => ({ ...a, correctAsAt: a.correctAsAt ? a.correctAsAt.slice(0, 10) : "" })));
    }
    router.refresh();
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setMsg(null);
    const payload = {
      slug: draft.slug || slugify(draft.title),
      title: draft.title,
      keyword: draft.keyword,
      category: draft.category,
      excerpt: draft.excerpt,
      body: draft.body,
      image: draft.image || null,
      author: draft.author,
      authorRole: draft.authorRole,
      authorBio: draft.authorBio,
      correctAsAt: draft.correctAsAt || null,
      metaTitle: draft.metaTitle,
      metaDesc: draft.metaDesc,
      serviceKey: draft.serviceKey,
      published: draft.published,
    };
    const res = draft.id
      ? await fetch(`/api/admin/articles/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) {
      setMsg("Saved. The public pages reflect it immediately.");
      setDraft(null);
      await refresh();
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(body.error ?? "Failed to save. Check the fields and try again.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this article? The public URL will stop working.")) return;
    setBusy(true);
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    setMsg("Article deleted.");
    setDraft(null);
    await refresh();
    setBusy(false);
  }

  async function togglePublish(a: ArticleRow) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(body.error ?? "Could not change the publish state.");
    }
    await refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      {articles.length === 0 && !draft && (
        <section className="card">
          <h3 className="card-title">No articles yet</h3>
          <p className="text-muted mt-2" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            The public Insights page shows a short &ldquo;guides are being prepared&rdquo; note until the
            first article is published. Write the first one here — it goes live the moment you
            save it as published.
          </p>
          <div className="row gap-3 mt-4">
            <button type="button" className="btn btn-primary" onClick={() => setDraft({ ...BLANK })}>
              New article
            </button>
          </div>
        </section>
      )}

      {articles.length > 0 && !draft && (
        <section className="card">
          <div className="row-between mb-4">
            <h3 className="card-title" style={{ marginBottom: 0 }}>All articles</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setDraft({ ...BLANK })}>
              + New article
            </button>
          </div>
          <div className="stack gap-2">
            {articles.map((a) => (
              <div key={a.id} className="row-between" style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{a.title}</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                    /insights/{a.slug} · {a.category}{a.author ? ` · ${a.author}` : " · no author"}
                  </div>
                </div>
                <div className="row gap-2" style={{ flex: "none" }}>
                  <span className={`badge ${a.published ? "badge-approved" : "badge-draft"}`}>
                    {a.published ? "Published" : "Draft"}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => togglePublish(a)}>
                    {a.published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDraft({ ...a, image: a.image ?? "" })}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {draft && (
        <section className="card">
          <div className="row-between mb-4">
            <h3 className="card-title" style={{ marginBottom: 0 }}>{draft.id ? "Edit article" : "New article"}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>Back to list</button>
          </div>
          <div className="stack gap-3">
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Title (the question it answers — this is the page H1)</span>
              <input
                className="input"
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setDraft((d) => (d ? { ...d, title, slug: d.id || d.slug ? d.slug : slugify(title) } : d));
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">URL slug (/insights/…)</span>
                <input className="input" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Search phrase (SEO — not shown to readers)</span>
                <input className="input" value={draft.keyword} onChange={(e) => set("keyword", e.target.value)} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Category</span>
                <select className="input" value={draft.category} onChange={(e) => set("category", e.target.value)}>
                  {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">One-line summary (card teaser and first line of the page)</span>
              <textarea className="input" rows={2} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </label>
            <ImageField value={draft.image} onChange={(url) => set("image", url ?? "")} />
            <div className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Body</span>
              <RichTextEditor value={draft.body} onChange={(md) => set("body", md)} />
              <div className="help">
                Write as you would in a document. Use headings (H2/H3) so the article can be scanned;
                a contents list appears automatically on long articles. Tables: one row per line
                with cells separated by <code>|</code>. Explain what a process involves and where it
                goes wrong — not a step-by-step walkthrough, and no links to government portals.
              </div>
            </div>

            <hr className="hairline" />
            <div className="eyebrow">Author (required to publish)</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Author name</span>
                <input className="input" value={draft.author} onChange={(e) => set("author", e.target.value)} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Role</span>
                <input className="input" value={draft.authorRole} onChange={(e) => set("authorRole", e.target.value)} placeholder="CEO and Co-Founder" />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Correct as at (required to publish)</span>
                <input className="input" type="date" value={draft.correctAsAt} onChange={(e) => set("correctAsAt", e.target.value)} />
              </label>
            </div>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Author biography (two or three lines, shown at the foot of the article)</span>
              <textarea className="input" rows={2} value={draft.authorBio} onChange={(e) => set("authorBio", e.target.value)} />
            </label>

            <hr className="hairline" />
            <div className="eyebrow">Search and links</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Meta title (blank = article title)</span>
                <input className="input" value={draft.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Related service page (closing call to action)</span>
                <select className="input" value={draft.serviceKey} onChange={(e) => set("serviceKey", e.target.value)}>
                  <option value="">Not linked to a service</option>
                  {SERVICES.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
                </select>
              </label>
            </div>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Meta description (blank = summary)</span>
              <textarea className="input" rows={2} value={draft.metaDesc} onChange={(e) => set("metaDesc", e.target.value)} />
            </label>

            <label className="row gap-2" style={{ cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}>
              <input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} />
              Published (visible on the public site)
            </label>
            <div className="row gap-3">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
                {busy ? "Saving…" : "Save article"}
              </button>
              {draft.id && (
                <>
                  <a href={`/insights/${draft.slug}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                    View page ↗
                  </a>
                  <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)" }} disabled={busy} onClick={() => remove(draft.id!)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {msg && <p className="text-muted" style={{ fontSize: "0.875rem" }}>{msg}</p>}
    </div>
  );
}
