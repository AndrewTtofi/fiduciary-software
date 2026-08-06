"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageField } from "@/components/admin/ImageField";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  keyword: string;
  excerpt: string;
  body: string;
  image: string | null;
  published: boolean;
};

type Draft = Omit<ArticleRow, "id"> & { id?: string };

const BLANK: Draft = { slug: "", title: "", keyword: "", excerpt: "", body: "", image: "", published: false };

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);

/** Self-serve article CRUD for staff: list, create, edit, publish, delete,
 *  plus a one-click import of the built-in starter guides (which the public
 *  site shows read-only while this list is empty). */
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
      const body = (await res.json()) as { articles: ArticleRow[] };
      setArticles(body.articles);
    }
    router.refresh();
  }

  async function importStarters() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import-starters" }),
    });
    setMsg(res.ok ? "Starter guides imported. They are now editable below." : "Import failed.");
    await refresh();
    setBusy(false);
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setMsg(null);
    const payload = {
      slug: draft.slug || slugify(draft.title),
      title: draft.title,
      keyword: draft.keyword,
      excerpt: draft.excerpt,
      body: draft.body,
      image: draft.image || null,
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
    await fetch(`/api/admin/articles/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    await refresh();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      {articles.length === 0 && !draft && (
        <section className="card">
          <h3 className="card-title">No articles yet</h3>
          <p className="text-muted mt-2" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            The public site is currently showing the three built-in starter guides (Non-Dom
            status, the 60-day rule, and company registration) read-only. Import them to edit
            them here, or write your first article from scratch.
          </p>
          <div className="row gap-3 mt-4">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={importStarters}>
              Import the starter guides
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setDraft({ ...BLANK })}>
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
                    /insights/{a.slug} · {a.keyword}
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
              <span className="flabel">Title (put the search phrase in it)</span>
              <input
                className="input"
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setDraft((d) => (d ? { ...d, title, slug: d.id || d.slug ? d.slug : slugify(title) } : d));
                }}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">URL slug (/insights/…)</span>
                <input className="input" value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="flabel">Search phrase (shown as the card tag)</span>
                <input className="input" value={draft.keyword} onChange={(e) => set("keyword", e.target.value)} />
              </label>
            </div>
            <label className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Excerpt (card teaser and first sentence of the page)</span>
              <textarea className="input" rows={2} value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </label>
            <ImageField value={draft.image} onChange={(url) => set("image", url ?? "")} />
            <div className="field" style={{ marginBottom: 0 }}>
              <span className="flabel">Body</span>
              <RichTextEditor value={draft.body} onChange={(md) => set("body", md)} />
              <div className="help">
                Write as you would in a document. Select text and use the buttons to make a heading,
                bold it, add a bullet list, a link or a photo.
              </div>
            </div>
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
