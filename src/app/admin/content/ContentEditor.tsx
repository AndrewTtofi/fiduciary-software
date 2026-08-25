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
  { key: "consult", label: "Who takes your call" },
  { key: "contact", label: "Contact & footer" },
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
  const setIntro = (k: keyof SiteContent["servicesIntro"], v: string) => setC((p) => ({ ...p, servicesIntro: { ...p.servicesIntro, [k]: v } }));
  const setHow = (k: "heading" | "sub", v: string) => setC((p) => ({ ...p, how: { ...p.how, [k]: v } }));
  const setCta = (k: keyof SiteContent["cta"], v: string) => setC((p) => ({ ...p, cta: { ...p.cta, [k]: v } }));
  const setInsights = (k: keyof SiteContent["insights"], v: string) => setC((p) => ({ ...p, insights: { ...p.insights, [k]: v } }));
  const setContact = (k: keyof SiteContent["contact"], v: string) => setC((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));
  const setConsult = (k: keyof Omit<SiteContent["consultation"], "points">, v: string) => setC((p) => ({ ...p, consultation: { ...p.consultation, [k]: v } }));
  const setAbout = (k: "story" | "how" | "whatWeDoIntro", v: string) => setC((p) => ({ ...p, about: { ...p.about, [k]: v } }));

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

  // Nested lists.
  function stepSet(i: number, field: "t" | "d", v: string) {
    setC((p) => ({ ...p, how: { ...p.how, steps: p.how.steps.map((s, j) => (j === i ? { ...s, [field]: v } : s)) } }));
  }
  function stepAdd() { setC((p) => ({ ...p, how: { ...p.how, steps: [...p.how.steps, { t: "", d: "" }] } })); }
  function stepRemove(i: number) { setC((p) => ({ ...p, how: { ...p.how, steps: p.how.steps.filter((_, j) => j !== i) } })); }
  function whySet(i: number, field: "t" | "d", v: string) {
    setC((p) => ({ ...p, about: { ...p.about, why: p.about.why.map((f, j) => (j === i ? { ...f, [field]: v } : f)) } }));
  }
  function whyAdd() { setC((p) => ({ ...p, about: { ...p.about, why: [...p.about.why, { t: "", d: "" }] } })); }
  function whyRemove(i: number) { setC((p) => ({ ...p, about: { ...p.about, why: p.about.why.filter((_, j) => j !== i) } })); }
  function personSet(i: number, field: "name" | "title" | "bio", v: string) {
    setC((p) => ({ ...p, about: { ...p.about, people: p.about.people.map((x, j) => (j === i ? { ...x, [field]: v } : x)) } }));
  }
  function personAdd() { setC((p) => ({ ...p, about: { ...p.about, people: [...p.about.people, { name: "", title: "", bio: "" }] } })); }
  function personRemove(i: number) { setC((p) => ({ ...p, about: { ...p.about, people: p.about.people.filter((_, j) => j !== i) } })); }
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
      <Card title="Hero" where={[{ href: "/", label: "Home" }]}>
        <Field label="Eyebrow (small line above the headline)"><input className="input" value={c.hero.eyebrow} onChange={(e) => setHero("eyebrow", e.target.value)} /></Field>
        <Field label="Headline (H1 — carries the search weight)"><textarea className="input" rows={2} value={c.hero.display} onChange={(e) => setHero("display", e.target.value)} /></Field>
        <Field label="Sub-heading"><textarea className="input" rows={3} value={c.hero.lead} onChange={(e) => setHero("lead", e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gold button (full wording — the header uses the short form)"><input className="input" value={c.hero.primaryCta} onChange={(e) => setHero("primaryCta", e.target.value)} /></Field>
          <Field label="Outline button (opens WhatsApp)"><input className="input" value={c.hero.secondaryCta} onChange={(e) => setHero("secondaryCta", e.target.value)} /></Field>
        </div>
        <p className="help">Headline: a new line splits the two lines; text between *asterisks* renders gold italic.</p>
      </Card>
      <Card title="Hero statistics (three, equal size)" onAdd={() => listAdd("stats", { v: "", l: "" })} addLabel="Add stat" where={[{ href: "/", label: "Home" }]}>
        {c.stats.map((s, i) => (
          <ListItem key={i} onRemove={() => listRemove("stats", i)} index={i + 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Figure"><input className="input" value={s.v} onChange={(e) => listSet("stats", i, "v", e.target.value)} /></Field>
              <Field label="Label"><input className="input" value={s.l} onChange={(e) => listSet("stats", i, "l", e.target.value)} /></Field>
            </div>
          </ListItem>
        ))}
        <p className="help">Keep these verifiable facts about Cyprus, not claims about the firm. The registration line beneath them comes from the legal name (Settings → Branding) and the registration number (Contact tab).</p>
      </Card>
      </>)}

      {tab === "home" && (<>
      <Card title="Services section heading" where={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }]}>
        <Field label="Heading"><input className="input" value={c.servicesIntro.heading} onChange={(e) => setIntro("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.servicesIntro.body} onChange={(e) => setIntro("body", e.target.value)} /></Field>
        <p className="help">The eight service cards and pages are managed in code with the firm&rsquo;s agreed wording.</p>
      </Card>
      <Card title="How it works (dark band)" onAdd={stepAdd} addLabel="Add step" where={[{ href: "/", label: "Home" }]}>
        <Field label="Heading"><input className="input" value={c.how.heading} onChange={(e) => setHow("heading", e.target.value)} /></Field>
        <Field label="Sub-heading"><input className="input" value={c.how.sub} onChange={(e) => setHow("sub", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.how.steps.map((s, i) => (
          <ListItem key={i} onRemove={() => stepRemove(i)} index={i + 1}>
            <Field label="Title"><input className="input" value={s.t} onChange={(e) => stepSet(i, "t", e.target.value)} /></Field>
            <Field label="Text"><textarea className="input" rows={2} value={s.d} onChange={(e) => stepSet(i, "d", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>
      <Card title="Closing call-to-action band" where={[{ href: "/", label: "Home" }, { href: "/services", label: "Services" }, { href: "/about", label: "About" }, { href: "/faq", label: "FAQ" }]}>
        <Field label="Heading"><input className="input" value={c.cta.heading} onChange={(e) => setCta("heading", e.target.value)} /></Field>
        <Field label="Body"><textarea className="input" rows={2} value={c.cta.body} onChange={(e) => setCta("body", e.target.value)} /></Field>
        <Field label="Button"><input className="input" value={c.cta.button} onChange={(e) => setCta("button", e.target.value)} /></Field>
        <p className="help">The WhatsApp button and the phone numbers in the band come from the Contact tab.</p>
      </Card>
      </>)}

      {tab === "about" && (<>
      <Card title="How it started" where={[{ href: "/about", label: "About" }]}>
        <Field label="Story (blank line between paragraphs; {brand} is replaced by the firm name)"><textarea className="input" rows={6} value={c.about.story} onChange={(e) => setAbout("story", e.target.value)} /></Field>
      </Card>
      <Card title="How we work" where={[{ href: "/about", label: "About" }]}>
        <Field label="Text (blank line between paragraphs)"><textarea className="input" rows={6} value={c.about.how} onChange={(e) => setAbout("how", e.target.value)} /></Field>
        <Field label="Intro line above the eight services"><input className="input" value={c.about.whatWeDoIntro} onChange={(e) => setAbout("whatWeDoIntro", e.target.value)} /></Field>
      </Card>
      <Card title="Why clients stay" onAdd={whyAdd} addLabel="Add panel" where={[{ href: "/about", label: "About" }]}>
        {c.about.why.map((f, i) => (
          <ListItem key={i} onRemove={() => whyRemove(i)} index={i + 1}>
            <Field label="Title"><input className="input" value={f.t} onChange={(e) => whySet(i, "t", e.target.value)} /></Field>
            <Field label="Description"><textarea className="input" rows={2} value={f.d} onChange={(e) => whySet(i, "d", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>
      <Card title="The people (no photographs)" onAdd={personAdd} addLabel="Add person" where={[{ href: "/about", label: "About" }]}>
        {c.about.people.map((p, i) => (
          <ListItem key={i} onRemove={() => personRemove(i)} index={i + 1}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><input className="input" value={p.name} onChange={(e) => personSet(i, "name", e.target.value)} /></Field>
              <Field label="Title"><input className="input" value={p.title} onChange={(e) => personSet(i, "title", e.target.value)} /></Field>
            </div>
            <Field label="Biography (three or four lines)"><textarea className="input" rows={3} value={p.bio} onChange={(e) => personSet(i, "bio", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>
      </>)}

      {tab === "insights" && (<>
      <Card title="Insights section heading" where={[{ href: "/", label: "Home" }, { href: "/insights", label: "Insights" }]}>
        <Field label="Kicker"><input className="input" value={c.insights.kicker} onChange={(e) => setInsights("kicker", e.target.value)} /></Field>
        <Field label="Heading"><textarea className="input" rows={2} value={c.insights.heading} onChange={(e) => setInsights("heading", e.target.value)} /></Field>
        <Field label="Sub-heading"><textarea className="input" rows={2} value={c.insights.body} onChange={(e) => setInsights("body", e.target.value)} /></Field>
        <p className="help">The articles themselves are managed under <strong>Insights articles</strong> in the sidebar.</p>
      </Card>
      <Card title="FAQ" onAdd={() => listAdd("faq", { q: "", a: "" })} addLabel="Add question" where={[{ href: "/faq", label: "FAQ" }]}>
        {c.faq.map((f, i) => (
          <ListItem key={i} onRemove={() => listRemove("faq", i)} index={i + 1}>
            <Field label="Question"><input className="input" value={f.q} onChange={(e) => listSet("faq", i, "q", e.target.value)} /></Field>
            <Field label="Answer"><textarea className="input" rows={3} value={f.a} onChange={(e) => listSet("faq", i, "a", e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>
      </>)}

      {tab === "consult" && (<>
      <Card title="Who takes your call" onAdd={pointAdd} addLabel="Add point" where={[{ href: "/#consultation", label: "Home" }]}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Heading"><input className="input" value={c.consultation.heading} onChange={(e) => setConsult("heading", e.target.value)} /></Field>
          <Field label="Name"><input className="input" value={c.consultation.personName} onChange={(e) => setConsult("personName", e.target.value)} /></Field>
          <Field label="Title"><input className="input" value={c.consultation.personTitle} onChange={(e) => setConsult("personTitle", e.target.value)} /></Field>
        </div>
        <Field label="Text, in the first person (blank line between paragraphs)"><textarea className="input" rows={8} value={c.consultation.body} onChange={(e) => setConsult("body", e.target.value)} /></Field>
        <Field label="Photo URL (portrait, 4:5)"><input className="input" value={c.consultation.photoUrl} onChange={(e) => setConsult("photoUrl", e.target.value)} placeholder="/marketing/portrait.jpg" /></Field>
        <Field label="Note shown while no photo is set"><input className="input" value={c.consultation.photoNote} onChange={(e) => setConsult("photoNote", e.target.value)} /></Field>
        <hr className="hairline" style={{ margin: "8px 0" }} />
        {c.consultation.points.map((pt, i) => (
          <ListItem key={i} onRemove={() => pointRemove(i)} index={i + 1}>
            <Field label="Point"><input className="input" value={pt} onChange={(e) => pointSet(i, e.target.value)} /></Field>
          </ListItem>
        ))}
      </Card>
      </>)}

      {tab === "contact" && (<>
      <Card title="Contact details" where={[{ href: "/contact", label: "Contact" }, { href: "/", label: "Home + footer everywhere" }]}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Office address (the office, not the registered address)"><input className="input" value={c.contact.address} onChange={(e) => setContact("address", e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={c.contact.email} onChange={(e) => setContact("email", e.target.value)} /></Field>
          <Field label="Landline"><input className="input" value={c.contact.phone} onChange={(e) => setContact("phone", e.target.value)} /></Field>
          <Field label="WhatsApp"><input className="input" value={c.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} /></Field>
          <Field label="Company registration number (e.g. HE 123456)"><input className="input" value={c.contact.regNo} onChange={(e) => setContact("regNo", e.target.value)} /></Field>
          <Field label="VAT number"><input className="input" value={c.contact.vatNo} onChange={(e) => setContact("vatNo", e.target.value)} /></Field>
          <Field label="Office hours (Contact page)"><input className="input" value={c.contact.hours} onChange={(e) => setContact("hours", e.target.value)} placeholder="Monday to Friday, 9:00 to 17:00" /></Field>
          <Field label="A line on parking (Contact page)"><input className="input" value={c.contact.parking} onChange={(e) => setContact("parking", e.target.value)} placeholder="Where visitors can park" /></Field>
          <Field label="LinkedIn page URL"><input className="input" value={c.contact.linkedin} onChange={(e) => setContact("linkedin", e.target.value)} placeholder="https://www.linkedin.com/company/…" /></Field>
          <Field label="Facebook page URL"><input className="input" value={c.contact.facebook} onChange={(e) => setContact("facebook", e.target.value)} placeholder="https://www.facebook.com/…" /></Field>
        </div>
        <Field label="Footer description"><textarea className="input" rows={2} value={c.contact.footerAbout} onChange={(e) => setContact("footerAbout", e.target.value)} /></Field>
        <p className="help">The legal entity name in the statutory line comes from Settings → Branding (legal name). Social icons appear in the footer once a URL is set.</p>
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
