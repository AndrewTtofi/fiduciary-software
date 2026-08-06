"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/services/content";

type TabKey = "hero" | "home" | "about" | "insights" | "consult" | "contact";

/* Grouped by the public page each section renders on, so "where is this?" is
   answered by the tab you are standing in. */
const TABS: { key: TabKey; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "home", label: "Homepage" },
  { key: "about", label: "About page" },
  { key: "insights", label: "Insights & FAQ" },
  { key: "consult", label: "Consultation" },
  { key: "contact", label: "Contact" },
];

export function ContentEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  // Every tab edits one shared draft, so switching never loses work and Save
  // still writes the whole document in one request.
  const [tab, setTab] = useState<TabKey>("hero");
  const router = useRouter();

  // Generic immutable updaters.
  const setHero = (k: keyof SiteContent["hero"], v: string) => setC((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const setAbout = (k: keyof SiteContent["about"], v: string) => setC((p) => ({ ...p, about: { ...p.about, [k]: v } }));
  const setWhy = (k: "kicker", v: string) => setC((p) => ({ ...p, why: { ...p.why, [k]: v } }));
  const setIntro = (k: keyof SiteContent["servicesIntro"], v: string) => setC((p) => ({ ...p, servicesIntro: { ...p.servicesIntro, [k]: v } }));
  const setCta = (k: keyof SiteContent["cta"], v: string) => setC((p) => ({ ...p, cta: { ...p.cta, [k]: v } }));
  const setInsights = (k: "kicker" | "heading" | "rhHeading" | "rhBody", v: string) => setC((p) => ({ ...p, insights: { ...p.insights, [k]: v } }));
  const setContact = (k: keyof SiteContent["contact"], v: string) => setC((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));
  const setConsult = (k: keyof Omit<SiteContent["consultation"], "points">, v: string) => setC((p) => ({ ...p, consultation: { ...p.consultation, [k]: v } }));

  function listSet<K extends "stats" | "faq">(key: K, i: number, field: string, v: string) {
    setC((p) => {
      const next = [...(p[key] as Record<string, string>[])];
      next[i] = { ...next[i], [field]: v };
      return { ...p, [key]: next };
    });
  }
  function listAdd<K extends "stats" | "faq">(key: K, blank: Record<string, string>) {
    setC((p) => ({ ...p, [key]: [...(p[key] as Record<string, string>[]), blank] }));
  }
  function listRemove<K extends "stats" | "faq">(key: K, i: number) {
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
  function pointSet(i: number, v: string) {
    setC((p) => ({ ...p, consultation: { ...p.consultation, points: p.consultation.points.map((x, j) => (j === i ? v : x)) } }));
  }
  function pointAdd() { setC((p) => ({ ...p, consultation: { ...p.consultation, points: [...p.consultation.points, ""] } })); }
  function pointRemove(i: number) { setC((p) => ({ ...p, consultation: { ...p.consultation, points: p.consultation.points.filter((_, j) => j !== i) } })); }

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
    <>
    <div className="flex flex-col gap-6 max-w-[860px] has-save-bar">
      <div className="chips mb-2" role="tablist" aria-label="Content sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`chip${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero" && (<>
      {/* Hero */}
      <Card title="Hero" where={[{ href: "/", label: "Home" }]}>
        <Field label="Eyebrow"><input className="input" value={c.hero.eyebrow} onChange={(e) => setHero("eyebrow", e.target.value)} /></Field>
        <Field label="Headline"><input className="input" value={c.hero.headline} onChange={(e) => setHero("headline", e.target.value)} /></Field>
        <Field label="Lead paragraph"><textarea className="input" rows={3} value={c.hero.lead} onChange={(e) => setHero("lead", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary button"><input className="input" value={c.hero.primaryCta} onChange={(e) => setHero("primaryCta", e.target.value)} /></Field>
          <Field label="Secondary button"><input className="input" value={c.hero.secondaryCta} onChange={(e) => setHero("secondaryCta", e.target.value)} /></Field>
        </div>
        <p className="help">Headlines: new lines split the kinetic heading; text between *asterisks* renders gold italic. Body copy: **double asterisks** render bold.</p>
      </Card>

      </>)}
      {tab === "about" && (<>
      {/* About / who we are */}
      <Card title="About / who we are" where={[{ href: "/about", label: "About" }]} note="This is the “Our story” text on the About page.">
        <Field label="Body (home + about page)"><textarea className="input" rows={3} value={c.about.body1} onChange={(e) => setAbout("body1", e.target.value)} /></Field>
        <Field label="Second paragraph (about page)"><textarea className="input" rows={2} value={c.about.body2} onChange={(e) => setAbout("body2", e.target.value)} /></Field>
      </Card>

      {/* Why choose us */}
      <Card title="Why choose us" onAdd={featAdd} addLabel="Add feature" where={[{ href: "/about", label: "About" }]}>
        <Field label="Kicker"><input className="input" value={c.why.kicker} onChange={(e) => setWhy("kicker", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.why.features.map((f, i) => (
          <ListItem key={i} onRemove={() => featRemove(i)} index={i + 1}>
            <Field label="Title"><input className="input" value={f.t} onChange={(e) => featSet(i, "t", e.target.value)} /></Field>
            <Field label="Description"><textarea className="input" rows={2} value={f.d} onChange={(e) => featSet(i, "d", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      </>)}
      {tab === "home" && (<>
      {/* Services intro */}
      <Card title="Services section heading" where={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }]}>
        <Field label="Eyebrow"><input className="input" value={c.servicesIntro.eyebrow} onChange={(e) => setIntro("eyebrow", e.target.value)} /></Field>
        <Field label="Heading"><input className="input" value={c.servicesIntro.heading} onChange={(e) => setIntro("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.servicesIntro.body} onChange={(e) => setIntro("body", e.target.value)} /></Field>
        <p className="help">The service cards themselves are managed under <strong>Settings → Services</strong>.</p>
      </Card>

      {/* Stats */}
      <Card title="Proof stats" onAdd={() => listAdd("stats", { v: "", l: "" })} addLabel="Add stat" where={[{ href: "/", label: "Home" }]}>
        {c.stats.map((s, i) => (
          <ListItem key={i} onRemove={() => listRemove("stats", i)} index={i + 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Value"><input className="input" value={s.v} onChange={(e) => listSet("stats", i, "v", e.target.value)} /></Field>
              <Field label="Label"><input className="input" value={s.l} onChange={(e) => listSet("stats", i, "l", e.target.value)} /></Field>
            </div>
          </ListItem>
        ))}
      </Card>

      </>)}
      {tab === "home" && (<>
      {/* CTA */}
      <Card title="Call-to-action band" where={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }, { href: "/about", label: "About" }, { href: "/pricing", label: "Pricing" }, { href: "/faq", label: "FAQ" }]}>
        <Field label="Heading"><input className="input" value={c.cta.heading} onChange={(e) => setCta("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.cta.body} onChange={(e) => setCta("body", e.target.value)} /></Field>
        <Field label="Button"><input className="input" value={c.cta.button} onChange={(e) => setCta("button", e.target.value)} /></Field>
        <p className="help">Phone numbers shown in the band come from the Contact details below.</p>
      </Card>

      </>)}
      {tab === "insights" && (<>
      {/* Insights */}
      <Card title="Insights section heading" where={[{ href: "/", label: "Home" }, { href: "/insights", label: "Insights" }]}>
        <Field label="Kicker"><input className="input" value={c.insights.kicker} onChange={(e) => setInsights("kicker", e.target.value)} /></Field>
        <Field label="Heading"><textarea className="input" rows={2} value={c.insights.heading} onChange={(e) => setInsights("heading", e.target.value)} /></Field>
        <Field label="Right-hand heading"><input className="input" value={c.insights.rhHeading} onChange={(e) => setInsights("rhHeading", e.target.value)} /></Field>
        <Field label="Right-hand body"><textarea className="input" rows={2} value={c.insights.rhBody} onChange={(e) => setInsights("rhBody", e.target.value)} /></Field>
        <p className="help">The article cards themselves are managed under <strong>Insights articles</strong> in the sidebar.</p>
      </Card>

      </>)}
      {tab === "consult" && (<>
      {/* Who takes your call */}
      <Card title="Who takes your call" onAdd={pointAdd} addLabel="Add point" where={[{ href: "/your-consultation", label: "Book a consultation" }, { href: "/", label: "Home strip" }]}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kicker"><input className="input" value={c.consultation.kicker} onChange={(e) => setConsult("kicker", e.target.value)} /></Field>
          <Field label="Heading"><input className="input" value={c.consultation.heading} onChange={(e) => setConsult("heading", e.target.value)} /></Field>
          <Field label="Person name"><input className="input" value={c.consultation.personName} onChange={(e) => setConsult("personName", e.target.value)} /></Field>
          <Field label="Person title"><input className="input" value={c.consultation.personTitle} onChange={(e) => setConsult("personTitle", e.target.value)} /></Field>
        </div>
        <Field label="Body"><textarea className="input" rows={3} value={c.consultation.body} onChange={(e) => setConsult("body", e.target.value)} /></Field>
        <Field label="Photo URL (portrait of the person, 4:5)"><input className="input" value={c.consultation.photoUrl} onChange={(e) => setConsult("photoUrl", e.target.value)} placeholder="/marketing/georgia.jpg" /></Field>
        <Field label="Photo note (shown while no photo is set)"><input className="input" value={c.consultation.photoNote} onChange={(e) => setConsult("photoNote", e.target.value)} /></Field>
        <Field label="Positioning strip heading"><textarea className="input" rows={2} value={c.consultation.stripHeading} onChange={(e) => setConsult("stripHeading", e.target.value)} /></Field>
        <Field label="Positioning strip body"><input className="input" value={c.consultation.stripBody} onChange={(e) => setConsult("stripBody", e.target.value)} /></Field>
        <Field label="Line under the booking form"><input className="input" value={c.consultation.underForm} onChange={(e) => setConsult("underForm", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.consultation.points.map((pt, i) => (
          <ListItem key={i} onRemove={() => pointRemove(i)} index={i + 1}>
            <Field label="Point"><input className="input" value={pt} onChange={(e) => pointSet(i, e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      </>)}
      {tab === "contact" && (<>
      {/* Contact details */}
      <Card title="Contact details" where={[{ href: "/contact", label: "Contact" }, { href: "/your-consultation", label: "Book a consultation" }, { href: "/", label: "Home + footer everywhere" }]}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Office address"><input className="input" value={c.contact.address} onChange={(e) => setContact("address", e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={c.contact.email} onChange={(e) => setContact("email", e.target.value)} /></Field>
          <Field label="Phone"><input className="input" value={c.contact.phone} onChange={(e) => setContact("phone", e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="input" value={c.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} /></Field>
        </div>
        <p className="help">Shown on the contact page, the footer and the phone band across the public site.</p>
      </Card>

      </>)}
      {tab === "insights" && (<>
      {/* FAQ */}
      <Card title="FAQ" onAdd={() => listAdd("faq", { q: "", a: "" })} addLabel="Add question" where={[{ href: "/faq", label: "FAQ" }]}>
        {c.faq.map((f, i) => (
          <ListItem key={i} onRemove={() => listRemove("faq", i)} index={i + 1}>
            <Field label="Question"><input className="input" value={f.q} onChange={(e) => listSet("faq", i, "q", e.target.value)} /></Field>
            <Field label="Answer"><textarea className="input" rows={3} value={f.a} onChange={(e) => listSet("faq", i, "a", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>

      </>)}
    </div>

      {/* Pinned to the bottom of the page, full width, so the buttons are
          reachable from anywhere in a long tab without scrolling to find them. */}
      <div className="save-bar">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
        <a href="/" target="_blank" rel="noreferrer" className="btn btn-secondary">View site ↗</a>
        {msg
          ? <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{msg}</span>
          : <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>Saves every tab, not just this one.</span>}
      </div>
    </>
  );
}

function Card({
  title, children, onAdd, addLabel, where, note,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  /** Public pages this section renders on — so you can go and look at it. */
  where?: { href: string; label: string }[];
  /** One line on exactly which parts of this card reach the site. */
  note?: string;
}) {
  return (
    <section className="card">
      <div className="row-between mb-4">
        <h3 className="card-title" style={{ marginBottom: 0 }}>{title}</h3>
        {onAdd && <button type="button" onClick={onAdd} className="btn btn-ghost btn-sm">+ {addLabel}</button>}
      </div>
      {where && where.length > 0 && (
        <p className="where mb-4">
          <span className="where-lbl">Appears on</span>
          {where.map((w) => (
            <a key={w.href} href={w.href} target="_blank" rel="noreferrer" className="where-link">
              {w.label} ↗
            </a>
          ))}
        </p>
      )}
      {note && <p className="help mb-4" style={{ marginTop: -8 }}>{note}</p>}
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
