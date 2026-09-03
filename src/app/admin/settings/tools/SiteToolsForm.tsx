"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOOLS, TOOL_TABS } from "@/lib/data/tools";

/* TOOLS/TOOL_TABS (src/lib/data/tools.ts) is a pure data module — safe to
   import client-side, and the picker can never drift from the catalog. */

export function SiteToolsForm({ initial }: { initial: Record<string, boolean> }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const onCount = Object.values(enabled).filter(Boolean).length;

  function toggle(key: string) {
    setEnabled((m) => ({ ...m, [key]: !m[key] }));
  }
  function setAll(v: boolean) {
    setEnabled(Object.fromEntries(TOOLS.map((t) => [t.key, v])));
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await fetch("/api/admin/settings/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolsEnabled: enabled }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Saved — the public site now offers exactly these tools." : (body.error ?? "Failed to save."));
      if (res.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="card mb-4">
        <div className="row-between mb-2">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Site tools</h3>
          <span className="badge badge-new"><span className="bdot" />Super admin</span>
        </div>
        <p className="muted mb-4" style={{ fontSize: "var(--fs-xs)" }}>
          Which free public tools this deployment offers. Switched-off tools disappear everywhere —
          navigation, footer, homepage, the tools hub, the sitemap — and their URLs return 404.
          The tools&apos; rates and figures are edited by staff in Admin → Tools.
        </p>
        <div className="row gap-2 mb-4">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAll(true)}>Enable all</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(false)}>Disable all</button>
          <span className="muted" style={{ fontSize: "var(--fs-xs)", alignSelf: "center" }}>{onCount} of {TOOLS.length} enabled</span>
        </div>

        {TOOL_TABS.map((tab) => {
          const list = TOOLS.filter((t) => t.tab === tab.key);
          if (list.length === 0) return null;
          return (
            <div key={tab.key} className="mb-4">
              <div className="muted" style={{ fontSize: "var(--fs-2xs)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                {tab.label}
              </div>
              <div className="stack gap-2">
                {list.map((t) => {
                  const on = enabled[t.key];
                  return (
                    <label
                      key={t.key}
                      className="card"
                      style={{ padding: "var(--space-3) var(--space-4)", cursor: "pointer", opacity: on ? 1 : 0.55, display: "flex", gap: 12, alignItems: "flex-start" }}
                    >
                      <input type="checkbox" checked={on} onChange={() => toggle(t.key)} style={{ marginTop: 4 }} />
                      <span>
                        <strong style={{ fontSize: "var(--fs-sm)" }}>{t.name}</strong>
                        <span className="muted" style={{ display: "block", fontSize: "var(--fs-xs)", marginTop: 2 }}>{t.teaser}</span>
                        <span className="muted" style={{ display: "block", fontSize: "var(--fs-2xs)", marginTop: 2, fontFamily: "var(--font-mono)" }}>/tools/{t.slug}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="row gap-3 mt-6" style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--space-5)" }}>
        <button type="button" disabled={pending} className="btn btn-primary" onClick={save}>{pending ? "Saving…" : "Save site tools"}</button>
        <a className="btn btn-secondary" href="/tools" target="_blank" rel="noreferrer">View tools page</a>
        {msg && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{msg}</span>}
      </div>
    </>
  );
}
