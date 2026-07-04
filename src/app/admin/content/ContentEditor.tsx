"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/services/content";

export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  // Generic immutable updaters.
  const setHero = (k: keyof SiteContent["hero"], v: string) => setC((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const setAbout = (k: keyof SiteContent["about"], v: string) => setC((p) => ({ ...p, about: { ...p.about, [k]: v } }));
  const setWhy = (k: "kicker" | "heading", v: string) => setC((p) => ({ ...p, why: { ...p.why, [k]: v } }));
  const setIntro = (k: keyof SiteContent["servicesIntro"], v: string) => setC((p) => ({ ...p, servicesIntro: { ...p.servicesIntro, [k]: v } }));
  const setTIntro = (k: keyof SiteContent["testimonialsIntro"], v: string) => setC((p) => ({ ...p, testimonialsIntro: { ...p.testimonialsIntro, [k]: v } }));
  const setCta = (k: keyof SiteContent["cta"], v: string) => setC((p) => ({ ...p, cta: { ...p.cta, [k]: v } }));
  const setInsights = (k: "kicker" | "heading" | "rhHeading" | "rhBody", v: string) => setC((p) => ({ ...p, insights: { ...p.insights, [k]: v } }));
  const setContact = (k: keyof SiteContent["contact"], v: string) => setC((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));

  function listSet<K extends "steps" | "stats" | "testimonials" | "faq">(key: K, i: number, field: string, v: string) {
    setC((p) => {
      const next = [...(p[key] as Record<string, string>[])];
      next[i] = { ...next[i], [field]: v };
      return { ...p, [key]: next };
    });
  }
  function listAdd<K extends "steps" | "stats" | "testimonials" | "faq">(key: K, blank: Record<string, string>) {
    setC((p) => ({ ...p, [key]: [...(p[key] as Record<string, string>[]), blank] }));
  }
  function listRemove<K extends "steps" | "stats" | "testimonials" | "faq">(key: K, i: number) {
    setC((p) => ({ ...p, [key]: (p[key] as unknown[]).filter((_, j) => j !== i) }));
  }

  // Nested lists (why.features, insights.posts).
  function featSet(i: number, field: "t" | "d", v: string) {
    setC((p) => {
      const features = p.why.features.map((f, j) => (j === i ? { ...f, [field]: v } : f));
      return { ...p, why: { ...p.why, features } };
    });
  }
  function featAdd() { setC((p) => ({ ...p, why: { ...p.why, features: [...p.why.features, { t: "", d: "" }] } })); }
  function featRemove(i: number) { setC((p) => ({ ...p, why: { ...p.why, features: p.why.features.filter((_, j) => j !== i) } })); }
  function postSet(i: number, field: "tag" | "title" | "img", v: string) {
    setC((p) => {
      const posts = p.insights.posts.map((x, j) => (j === i ? { ...x, [field]: v } : x));
      return { ...p, insights: { ...p.insights, posts } };
    });
  }
  function postAdd() { setC((p) => ({ ...p, insights: { ...p.insights, posts: [...p.insights.posts, { tag: "", title: "", img: "" }] } })); }
  function postRemove(i: number) { setC((p) => ({ ...p, insights: { ...p.insights, posts: p.insights.posts.filter((_, j) => j !== i) } })); }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Saved — the public pages now reflect your changes." : (body.error ?? "Failed to save."));
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-[860px]">
      {/* Hero */}
      <Card title="Hero">
        <Field label="Eyebrow"><input className="input" value={c.hero.eyebrow} onChange={(e) => setHero("eyebrow", e.target.value)} /></Field>
        <Field label="Headline"><input className="input" value={c.hero.headline} onChange={(e) => setHero("headline", e.target.value)} /></Field>
        <Field label="Lead paragraph"><textarea className="input" rows={3} value={c.hero.lead} onChange={(e) => setHero("lead", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary button"><input className="input" value={c.hero.primaryCta} onChange={(e) => setHero("primaryCta", e.target.value)} /></Field>
          <Field label="Secondary button"><input className="input" value={c.hero.secondaryCta} onChange={(e) => setHero("secondaryCta", e.target.value)} /></Field>
        </div>
        <p className="help">Headlines: new lines split the kinetic heading; text between *asterisks* renders gold italic. Body copy: **double asterisks** render bold.</p>
      </Card>

      {/* About / who we are */}
      <Card title="About / who we are">
        <Field label="Kicker"><input className="input" value={c.about.kicker} onChange={(e) => setAbout("kicker", e.target.value)} /></Field>
        <Field label="Heading"><input className="input" value={c.about.heading} onChange={(e) => setAbout("heading", e.target.value)} /></Field>
        <Field label="Body (home + about page)"><textarea className="input" rows={3} value={c.about.body1} onChange={(e) => setAbout("body1", e.target.value)} /></Field>
        <Field label="Second paragraph (about page)"><textarea className="input" rows={2} value={c.about.body2} onChange={(e) => setAbout("body2", e.target.value)} /></Field>
        <Field label="Button"><input className="input" value={c.about.cta} onChange={(e) => setAbout("cta", e.target.value)} /></Field>
      </Card>

      {/* Why choose us */}
      <Card title="Why choose us" onAdd={featAdd} addLabel="Add feature">
        <Field label="Kicker"><input className="input" value={c.why.kicker} onChange={(e) => setWhy("kicker", e.target.value)} /></Field>
        <Field label="Heading"><textarea className="input" rows={2} value={c.why.heading} onChange={(e) => setWhy("heading", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.why.features.map((f, i) => (
          <ListItem key={i} onRemove={() => featRemove(i)} index={i + 1}>
            <Field label="Title"><input className="input" value={f.t} onChange={(e) => featSet(i, "t", e.target.value)} /></Field>
            <Field label="Description"><textarea className="input" rows={2} value={f.d} onChange={(e) => featSet(i, "d", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      {/* Steps */}
      <Card title="How it works (steps)" onAdd={() => listAdd("steps", { t: "", d: "" })} addLabel="Add step">
        {c.steps.map((s, i) => (
          <ListItem key={i} onRemove={() => listRemove("steps", i)} index={i + 1}>
            <Field label="Title"><input className="input" value={s.t} onChange={(e) => listSet("steps", i, "t", e.target.value)} /></Field>
            <Field label="Description"><textarea className="input" rows={2} value={s.d} onChange={(e) => listSet("steps", i, "d", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      {/* Services intro */}
      <Card title="Services section heading">
        <Field label="Eyebrow"><input className="input" value={c.servicesIntro.eyebrow} onChange={(e) => setIntro("eyebrow", e.target.value)} /></Field>
        <Field label="Heading"><input className="input" value={c.servicesIntro.heading} onChange={(e) => setIntro("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.servicesIntro.body} onChange={(e) => setIntro("body", e.target.value)} /></Field>
        <p className="help">The service cards themselves are managed under <strong>Settings → Services</strong>.</p>
      </Card>

      {/* Stats */}
      <Card title="Proof stats" onAdd={() => listAdd("stats", { v: "", l: "" })} addLabel="Add stat">
        {c.stats.map((s, i) => (
          <ListItem key={i} onRemove={() => listRemove("stats", i)} index={i + 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Value"><input className="input" value={s.v} onChange={(e) => listSet("stats", i, "v", e.target.value)} /></Field>
              <Field label="Label"><input className="input" value={s.l} onChange={(e) => listSet("stats", i, "l", e.target.value)} /></Field>
            </div>
          </ListItem>
        ))}
      </Card>

      {/* Testimonials */}
      <Card title="Testimonials" onAdd={() => listAdd("testimonials", { q: "", n: "", r: "" })} addLabel="Add testimonial">
        <Field label="Section eyebrow"><input className="input" value={c.testimonialsIntro.eyebrow} onChange={(e) => setTIntro("eyebrow", e.target.value)} /></Field>
        <Field label="Section heading"><input className="input" value={c.testimonialsIntro.heading} onChange={(e) => setTIntro("heading", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.testimonials.map((t, i) => (
          <ListItem key={i} onRemove={() => listRemove("testimonials", i)} index={i + 1}>
            <Field label="Quote"><textarea className="input" rows={2} value={t.q} onChange={(e) => listSet("testimonials", i, "q", e.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input className="input" value={t.n} onChange={(e) => listSet("testimonials", i, "n", e.target.value)} /></Field>
              <Field label="Role / location"><input className="input" value={t.r} onChange={(e) => listSet("testimonials", i, "r", e.target.value)} /></Field>
            </div>
          </ListItem>
        ))}
      </Card>

      {/* CTA */}
      <Card title="Call-to-action band">
        <Field label="Heading"><input className="input" value={c.cta.heading} onChange={(e) => setCta("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.cta.body} onChange={(e) => setCta("body", e.target.value)} /></Field>
        <Field label="Button"><input className="input" value={c.cta.button} onChange={(e) => setCta("button", e.target.value)} /></Field>
        <p className="help">Phone numbers shown in the band come from the Contact details below.</p>
      </Card>

      {/* Insights */}
      <Card title="Insights" onAdd={postAdd} addLabel="Add post">
        <Field label="Kicker"><input className="input" value={c.insights.kicker} onChange={(e) => setInsights("kicker", e.target.value)} /></Field>
        <Field label="Heading"><textarea className="input" rows={2} value={c.insights.heading} onChange={(e) => setInsights("heading", e.target.value)} /></Field>
        <Field label="Right-hand heading"><input className="input" value={c.insights.rhHeading} onChange={(e) => setInsights("rhHeading", e.target.value)} /></Field>
        <Field label="Right-hand body"><textarea className="input" rows={2} value={c.insights.rhBody} onChange={(e) => setInsights("rhBody", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.insights.posts.map((p, i) => (
          <ListItem key={i} onRemove={() => postRemove(i)} index={i + 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tag"><input className="input" value={p.tag} onChange={(e) => postSet(i, "tag", e.target.value)} /></Field>
              <Field label="Image URL"><input className="input" value={p.img} onChange={(e) => postSet(i, "img", e.target.value)} /></Field>
            </div>
            <Field label="Title"><input className="input" value={p.title} onChange={(e) => postSet(i, "title", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      {/* Contact details */}
      <Card title="Contact details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Office address"><input className="input" value={c.contact.address} onChange={(e) => setContact("address", e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={c.contact.email} onChange={(e) => setContact("email", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={c.contact.phone} onChange={(e) => setContact("phone", e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="input" value={c.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} /></Field>
        </div>
        <p className="help">Shown on the contact page, the footer and the phone band across the public site.</p>
      </Card>

      {/* FAQ */}
      <Card title="FAQ" onAdd={() => listAdd("faq", { q: "", a: "" })} addLabel="Add question">
        {c.faq.map((f, i) => (
          <ListItem key={i} onRemove={() => listRemove("faq", i)} index={i + 1}>
            <Field label="Question"><input className="input" value={f.q} onChange={(e) => listSet("faq", i, "q", e.target.value)} /></Field>
            <Field label="Answer"><textarea className="input" rows={3} value={f.a} onChange={(e) => listSet("faq", i, "a", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-2 px-2 py-3 row gap-3" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
        <a href="/" target="_blank" rel="noreferrer" className="btn btn-secondary">View site ↗</a>
        {msg && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{msg}</span>}
      </div>
    </div>
  );
}

function Card({ title, children, onAdd, addLabel }: { title: string; children: React.ReactNode; onAdd?: () => void; addLabel?: string }) {
  return (
    <section className="card">
      <div className="row-between mb-4">
        <h3 className="card-title" style={{ marginBottom: 0 }}>{title}</h3>
        {onAdd && <button type="button" onClick={onAdd} className="btn btn-ghost btn-sm">+ {addLabel}</button>}
      </div>
      <div className="stack gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field" style={{ marginBottom: 0 }}>
      <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text)", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function ListItem({ children, onRemove, index }: { children: React.ReactNode; onRemove: () => void; index: number }) {
  return (
    <div className="card" style={{ padding: "var(--space-4)" }}>
      <div className="row-between mb-2">
        <span className="muted" style={{ fontSize: "0.75rem", fontWeight: 500 }}>#{index}</span>
        <button type="button" onClick={onRemove} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>Remove</button>
      </div>
      <div className="stack gap-3">{children}</div>
    </div>
  );
}
