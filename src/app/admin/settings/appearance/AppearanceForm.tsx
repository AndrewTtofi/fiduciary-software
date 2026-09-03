"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FRONT_TEMPLATES,
  FRONT_TEMPLATE_KEYS,
  FRONT_FONTS,
  FRONT_FONT_KEYS,
  frontThemeStyle,
  isHexColor,
  type FrontTemplateKey,
  type FrontFontKey,
  type FrontThemeOverrides,
} from "@/lib/front-templates";

/* src/lib/front-templates.ts is deliberately client-safe (no Prisma), so the
   picker renders its previews from the exact catalog the server applies. */

type Initial = { frontTemplate: FrontTemplateKey; overrides: FrontThemeOverrides; brandName: string };

export function AppearanceForm({ initial }: { initial: Initial }) {
  const [template, setTemplate] = useState<FrontTemplateKey>(initial.frontTemplate);
  const [overrides, setOverrides] = useState<FrontThemeOverrides>(initial.overrides);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const brand = initial.brandName || "Your firm";
  const hasOverrides = Object.keys(overrides).length > 0;
  // Effective tokens for the large preview — same function the site uses.
  const vars = useMemo(() => frontThemeStyle(template, overrides) as React.CSSProperties, [template, overrides]);

  function setColor(key: "primary" | "accent" | "bg", value: string | null) {
    setOverrides((o) => {
      const next = { ...o };
      if (value && isHexColor(value)) next[key] = value; else delete next[key];
      return next;
    });
  }
  function setFont(key: "displayFont" | "bodyFont", value: string) {
    setOverrides((o) => {
      const next = { ...o };
      if (value && value !== FRONT_TEMPLATES[template].fonts[key === "displayFont" ? "display" : "body"]) {
        next[key] = value as FrontFontKey;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function pickTemplate(key: FrontTemplateKey) {
    setTemplate(key);
    // Overrides are per-deployment tweaks on a chosen base — switching the
    // base resets them so each template first shows as designed.
    setOverrides({});
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await fetch("/api/admin/settings/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontTemplate: template, frontTheme: hasOverrides ? overrides : null }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Saved — the public site now wears this template." : (body.error ?? "Failed to save."));
      if (res.ok) router.refresh();
    });
  }

  const palette = FRONT_TEMPLATES[template].palette;
  const effective = {
    primary: overrides.primary ?? palette.navy,
    accent: overrides.accent ?? palette.gold,
    bg: overrides.bg ?? palette.bg,
    displayFont: overrides.displayFont ?? FRONT_TEMPLATES[template].fonts.display,
    bodyFont: overrides.bodyFont ?? FRONT_TEMPLATES[template].fonts.body,
  };

  return (
    <>
      <div className="card mb-4">
        <div className="row-between mb-2">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Site template</h3>
          <span className="badge badge-new"><span className="bdot" />Super admin</span>
        </div>
        <p className="muted mb-4" style={{ fontSize: "var(--fs-xs)" }}>
          Each template is a complete, differently-built site — its own header, page layout, components,
          typography and palette. Content, logo, tools, booking and the client portal stay exactly as
          configured; only the public face changes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          {FRONT_TEMPLATE_KEYS.map((key) => {
            const t = FRONT_TEMPLATES[key];
            const active = template === key;
            const pv = frontThemeStyle(key, active ? overrides : {}) as Record<string, string>;
            return (
              <div
                key={key}
                onClick={() => pickTemplate(key)}
                className="card"
                style={{
                  cursor: "pointer",
                  padding: "var(--space-4)",
                  borderColor: active ? "var(--brand)" : undefined,
                  boxShadow: active ? "var(--shadow-sm)" : undefined,
                }}
              >
                {/* Mini wireframe — each template's actual hero structure, drawn from its tokens */}
                <div style={{
                  background: key === "summit" ? pv["--mk-navy-deep"] : pv["--mk-bg"],
                  border: `1px solid ${pv["--mk-border"]}`, borderRadius: 10, padding: 14, marginBottom: 10,
                  textAlign: key === "meridian" || key === "atelier" ? "center" : "left",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, justifyContent: key === "meridian" || key === "atelier" ? "center" : "flex-start" }}>
                    <span style={{ width: 14, height: 14, borderRadius: key === "atelier" ? 0 : 4, background: pv["--mk-gold"], display: "inline-block" }} />
                    <span style={{ fontFamily: pv["--mk-font-body"], fontSize: 10, fontWeight: 700, color: key === "summit" ? "#fff" : pv["--mk-navy"] }}>{brand}</span>
                  </div>
                  {key === "atelier" && <div style={{ width: 26, height: 1, background: pv["--mk-gold"], margin: "0 auto 8px" }} />}
                  <div style={{
                    fontFamily: pv["--mk-font-display"], fontSize: 17, lineHeight: 1.15,
                    color: key === "summit" ? "#fff" : pv["--mk-navy"],
                    fontWeight: key === "summit" ? 700 : key === "atelier" ? 500 : 600,
                    letterSpacing: key === "clarity" ? "-0.02em" : undefined,
                  }}>
                    Relocate with certainty
                  </div>
                  <div style={{ fontFamily: pv["--mk-font-body"], fontSize: 10.5, color: key === "summit" ? "rgba(255,255,255,.65)" : pv["--mk-grey"], margin: "6px 0 10px" }}>
                    The route mapped before you commit.
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: key === "meridian" || key === "atelier" ? "center" : "flex-start" }}>
                    <span style={{
                      display: "inline-block", background: pv["--mk-gold"], color: pv["--mk-on-accent"],
                      fontFamily: pv["--mk-font-body"], fontSize: 10, fontWeight: 600, padding: "5px 12px",
                      borderRadius: key === "heritage" ? 999 : key === "summit" ? 10 : key === "atelier" ? 2 : 8,
                      textTransform: key === "atelier" ? "uppercase" : undefined,
                      letterSpacing: key === "atelier" ? ".08em" : undefined,
                    }}>
                      Book a consultation
                    </span>
                    {/* structural hints: heritage/summit carry the hero calculator card */}
                    {(key === "heritage" || key === "summit") && (
                      <span style={{ flex: 1, alignSelf: "stretch", background: "#fff", border: `1px solid ${pv["--mk-border"]}`, borderRadius: 6, minHeight: 24 }} />
                    )}
                  </div>
                  {/* structural hints below the CTA row */}
                  {key === "meridian" && (
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {[0, 1, 2].map((i) => <span key={i} style={{ flex: 1, height: 14, background: "#fff", border: `1px solid ${pv["--mk-border"]}`, borderRadius: 4 }} />)}
                    </div>
                  )}
                  {key === "atelier" && (
                    <div style={{ marginTop: 8, borderTop: `1px solid ${pv["--mk-line"]}` }}>
                      {[0, 1].map((i) => <div key={i} style={{ height: 9, borderBottom: `1px solid ${pv["--mk-line"]}` }} />)}
                    </div>
                  )}
                  {key === "clarity" && (
                    <div style={{ marginTop: 8 }}>
                      {[0, 1, 2].map((i) => <div key={i} style={{ height: 8, borderTop: `1px solid ${pv["--mk-line"]}` }} />)}
                    </div>
                  )}
                </div>
                <div className="row-between">
                  <strong style={{ fontSize: "var(--fs-sm)" }}>{t.label}</strong>
                  {active && <span className="badge badge-approved"><span className="bdot" />Active</span>}
                </div>
                <p className="muted mt-1" style={{ fontSize: "var(--fs-2xs)" }}>{t.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="twocol">
        <div className="card mb-4">
          <h3 className="card-title">Customise · {FRONT_TEMPLATES[template].label}</h3>
          <p className="muted mb-4" style={{ fontSize: "var(--fs-xs)" }}>
            Optional per-deployment tweaks on top of the template. Cleared tweaks fall back to the
            template&apos;s own design.
          </p>

          <div className="field">
            <label>Headline font</label>
            <select className="input" value={effective.displayFont} onChange={(e) => setFont("displayFont", e.target.value)}>
              {FRONT_FONT_KEYS.map((k) => (
                <option key={k} value={k}>{FRONT_FONTS[k].label}{k === FRONT_TEMPLATES[template].fonts.display ? " (template default)" : ""}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Body font</label>
            <select className="input" value={effective.bodyFont} onChange={(e) => setFont("bodyFont", e.target.value)}>
              {FRONT_FONT_KEYS.filter((k) => FRONT_FONTS[k].kind === "sans").map((k) => (
                <option key={k} value={k}>{FRONT_FONTS[k].label}{k === FRONT_TEMPLATES[template].fonts.body ? " (template default)" : ""}</option>
              ))}
            </select>
          </div>

          {([
            ["primary", "Primary colour", "Headlines, dark bands and navigation text."],
            ["accent", "Accent colour", "Buttons, links and highlights."],
            ["bg", "Page background", "The site's base surface."],
          ] as const).map(([key, label, help]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <div className="row gap-3" style={{ alignItems: "center" }}>
                <input
                  type="color"
                  value={effective[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  style={{ width: 48, height: 40, border: "1px solid var(--border-strong-color)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                />
                {overrides[key] !== undefined
                  ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setColor(key, null)}>Reset to template</button>
                  : <span className="muted" style={{ fontSize: "var(--fs-2xs)" }}>Template default</span>}
              </div>
              <div className="help">{help}</div>
            </div>
          ))}
        </div>

        <div className="card mb-4" style={vars}>
          <h3 className="card-title">Live preview</h3>
          {/* A condensed front page rendered from the same tokens the site gets */}
          <div style={{ background: "var(--mk-bg)", border: "1px solid var(--mk-border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--mk-line)", background: "#fff" }}>
              <span style={{ width: 18, height: 18, borderRadius: template === "atelier" ? 0 : 5, background: "var(--mk-gold)" }} />
              <strong style={{ fontFamily: "var(--mk-font-body)", fontSize: 12, color: "var(--mk-navy)" }}>{brand}</strong>
              <span style={{ marginLeft: "auto", fontFamily: "var(--mk-font-body)", fontSize: 11, color: "var(--mk-grey)" }}>Services · Insights · Contact</span>
            </div>
            <div style={{ padding: "26px 20px 24px" }}>
              <div style={{ fontFamily: "var(--mk-font-mono, monospace)", fontSize: 9.5, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--mk-gold)", marginBottom: 10 }}>
                Corporate services
              </div>
              <div style={{ fontFamily: "var(--mk-font-display)", fontSize: 27, lineHeight: 1.12, color: "var(--mk-navy)", fontWeight: template === "summit" ? 700 : 600, maxWidth: 340 }}>
                Relocate without the guesswork
              </div>
              <p style={{ fontFamily: "var(--mk-font-body)", fontSize: 12.5, color: "var(--mk-grey)", margin: "10px 0 18px", maxWidth: 360 }}>
                Tax residency, immigration and company formation — the route mapped before you commit to anything.
              </p>
              <span style={{
                display: "inline-block", background: "var(--mk-gold)", color: "var(--mk-on-accent)",
                fontFamily: "var(--mk-font-body)", fontSize: 12, fontWeight: 600, padding: "10px 20px",
                borderRadius: template === "heritage" || template === "summit" ? 999 : template === "atelier" ? 2 : 8,
                textTransform: template === "atelier" ? "uppercase" : undefined,
                letterSpacing: template === "atelier" ? ".1em" : undefined,
              }}>
                Book a consultation
              </span>
            </div>
            <div style={{ background: "var(--mk-navy-deep)", padding: "14px 20px" }}>
              <span style={{ fontFamily: "var(--mk-font-display)", fontSize: 13, color: "#fff" }}>
                How it works — <span style={{ color: "var(--mk-gold-bright)" }}>three steps</span>
              </span>
            </div>
          </div>
          <p className="help mt-3">The full site (and the login pages) restyle after saving.</p>
        </div>
      </div>

      <div className="row gap-3 mt-6" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-5)" }}>
        <button type="button" disabled={pending} className="btn btn-primary" onClick={save}>{pending ? "Saving…" : "Save site template"}</button>
        <a className="btn btn-secondary" href="/" target="_blank" rel="noreferrer">View public site</a>
        {msg && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{msg}</span>}
      </div>
    </>
  );
}
