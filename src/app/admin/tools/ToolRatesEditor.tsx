"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CalendarEntry, ToolSettings } from "@/lib/data/tax-rates";

/* Editor for the rates table + filing calendar behind the public tools.
   Percentages are shown as percentages (8.8) and stored as decimals (0.088);
   the conversion happens at the edges so the JSON stays what the calculators
   expect. Every "CONFIRM" item from the spec carries a visible note. */

const toPct = (r: number) => String(Math.round(r * 100000) / 1000);
const fromPct = (v: string) => Math.max(0, Math.min(100, Number(v) || 0)) / 100;

const APPLIES = ["individuals", "companies", "employers"] as const;

export function ToolRatesEditor({ initial }: { initial: ToolSettings }) {
  const [s, setS] = useState<ToolSettings>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const num = (v: string) => Math.max(0, Number(v) || 0);
  const setBand = (i: number, k: "upTo" | "rate", v: string) =>
    setS((p) => ({
      ...p,
      incomeTaxBands: p.incomeTaxBands.map((b, j) => (j === i ? { ...b, [k]: k === "rate" ? fromPct(v) : v === "" ? null : num(v) } : b)),
    }));
  const setCal = (i: number, patch: Partial<CalendarEntry>) =>
    setS((p) => ({ ...p, calendar: p.calendar.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));

  function save() {
    setMsg(null);
    start(async () => {
      const res = await fetch("/api/admin/tool-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? "Saved — the tools now use these figures." : (body.error ?? "Failed to save."));
      if (res.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-6 max-w-[900px] has-save-bar">
        <Card title="Year and date">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tax year the figures describe"><input className="input" type="number" value={s.taxYear} onChange={(e) => setS((p) => ({ ...p, taxYear: Number(e.target.value) || p.taxYear }))} /></Field>
            <Field label="Correct as at (shown on every tool)"><input className="input" type="date" value={s.correctAsAt} onChange={(e) => setS((p) => ({ ...p, correctAsAt: e.target.value }))} /></Field>
          </div>
        </Card>

        <Card title="Personal income tax bands" onAdd={() => setS((p) => ({ ...p, incomeTaxBands: [...p.incomeTaxBands, { upTo: null, rate: 0 }] }))} addLabel="Add band">
          <p className="help">Progressive: each band applies to income above the previous band&rsquo;s upper limit. Leave &ldquo;up to&rdquo; blank on the top band.</p>
          {s.incomeTaxBands.map((b, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" style={{ alignItems: "end" }}>
              <Field label={`Band ${i + 1} — up to (€)`}><input className="input" type="number" value={b.upTo ?? ""} placeholder="no limit" onChange={(e) => setBand(i, "upTo", e.target.value)} /></Field>
              <Field label="Rate (%)"><input className="input" type="number" step="0.1" value={toPct(b.rate)} onChange={(e) => setBand(i, "rate", e.target.value)} /></Field>
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", marginBottom: 2 }} onClick={() => setS((p) => ({ ...p, incomeTaxBands: p.incomeTaxBands.filter((_, j) => j !== i) }))}>Remove</button>
            </div>
          ))}
        </Card>

        <Card title="Social insurance">
          <div className="grid gap-3 sm:grid-cols-4">
            <Pct label="Employee (%)" v={s.socialInsurance.employee} on={(v) => setS((p) => ({ ...p, socialInsurance: { ...p.socialInsurance, employee: v } }))} />
            <Pct label="Employer (%)" v={s.socialInsurance.employer} on={(v) => setS((p) => ({ ...p, socialInsurance: { ...p.socialInsurance, employer: v } }))} />
            <Pct label="Self-employed (%)" v={s.socialInsurance.selfEmployed} on={(v) => setS((p) => ({ ...p, socialInsurance: { ...p.socialInsurance, selfEmployed: v } }))} />
            <Field label="Insurable earnings ceiling (€/yr) — CONFIRM annually"><input className="input" type="number" value={s.socialInsurance.ceiling} onChange={(e) => setS((p) => ({ ...p, socialInsurance: { ...p.socialInsurance, ceiling: num(e.target.value) } }))} /></Field>
          </div>
        </Card>

        <Card title="GESY (General Healthcare System)">
          <div className="grid gap-3 sm:grid-cols-5">
            <Pct label="Employee (%)" v={s.gesy.employee} on={(v) => setS((p) => ({ ...p, gesy: { ...p.gesy, employee: v } }))} />
            <Pct label="Employer (%)" v={s.gesy.employer} on={(v) => setS((p) => ({ ...p, gesy: { ...p.gesy, employer: v } }))} />
            <Pct label="Self-employed (%)" v={s.gesy.selfEmployed} on={(v) => setS((p) => ({ ...p, gesy: { ...p.gesy, selfEmployed: v } }))} />
            <Pct label="Dividends, rents, interest (%)" v={s.gesy.passive} on={(v) => setS((p) => ({ ...p, gesy: { ...p.gesy, passive: v } }))} />
            <Field label="Income cap (€/yr)"><input className="input" type="number" value={s.gesy.cap} onChange={(e) => setS((p) => ({ ...p, gesy: { ...p.gesy, cap: num(e.target.value) } }))} /></Field>
          </div>
        </Card>

        <Card title="Other employer contributions">
          <div className="grid gap-3 sm:grid-cols-3">
            <Pct label="Social Cohesion Fund (%)" v={s.employerFunds.socialCohesion} on={(v) => setS((p) => ({ ...p, employerFunds: { ...p.employerFunds, socialCohesion: v } }))} />
            <Pct label="Redundancy Fund (%)" v={s.employerFunds.redundancy} on={(v) => setS((p) => ({ ...p, employerFunds: { ...p.employerFunds, redundancy: v } }))} />
            <Pct label="Human Resource Development Authority (%)" v={s.employerFunds.hrda} on={(v) => setS((p) => ({ ...p, employerFunds: { ...p.employerFunds, hrda: v } }))} />
          </div>
        </Card>

        <Card title="Corporate, VAT, Non-Dom, IP Box, residency">
          <div className="grid gap-3 sm:grid-cols-3">
            <Pct label="Corporate income tax (%)" v={s.corporateTax} on={(v) => setS((p) => ({ ...p, corporateTax: v }))} />
            <Field label="VAT rates (%, comma separated)">
              <input className="input" value={s.vatRates.map((r) => toPct(r)).join(", ")} onChange={(e) => setS((p) => ({ ...p, vatRates: e.target.value.split(",").map((x) => fromPct(x.trim())).filter((x) => !Number.isNaN(x)) }))} />
            </Field>
            <Field label="Non-Dom status length (years)"><input className="input" type="number" value={s.nonDomYears} onChange={(e) => setS((p) => ({ ...p, nonDomYears: Math.max(1, Math.round(num(e.target.value))) }))} /></Field>
            <Pct label="IP Box exemption on qualifying profit (%)" v={s.ipBoxExemption} on={(v) => setS((p) => ({ ...p, ipBoxExemption: v }))} />
            <Field label="Permanent residency property threshold (€)"><input className="input" type="number" value={s.permanentResidencyProperty} onChange={(e) => setS((p) => ({ ...p, permanentResidencyProperty: num(e.target.value) }))} /></Field>
            <Field label="Digital Nomad Visa: minimum monthly income (€) — CONFIRM; blank = not stated">
              <input className="input" type="number" value={s.digitalNomad.minMonthlyIncome ?? ""} onChange={(e) => setS((p) => ({ ...p, digitalNomad: { ...p.digitalNomad, minMonthlyIncome: e.target.value === "" ? null : num(e.target.value) } }))} />
            </Field>
            <Field label="Digital Nomad Visa: cap on places — CONFIRM; blank = not stated">
              <input className="input" type="number" value={s.digitalNomad.capOnPlaces ?? ""} onChange={(e) => setS((p) => ({ ...p, digitalNomad: { ...p.digitalNomad, capOnPlaces: e.target.value === "" ? null : Math.round(num(e.target.value)) } }))} />
            </Field>
          </div>
        </Card>

        <Card
          title="Filing calendar"
          onAdd={() => setS((p) => ({ ...p, calendar: [...p.calendar, { id: `entry-${p.calendar.length + 1}`, title: "", applies: ["companies"], frequency: "annual", rule: "fixed", date: `${p.taxYear}-12-31`, detail: "", confirm: true }] }))}
          addLabel="Add deadline"
        >
          <p className="help">
            Recurring entries derive their next date automatically (end of the following month, a day of the following month, or the second month after each quarter). Fixed dates must be rolled forward each year — entries marked CONFIRM still need checking against the Tax Department schedule.
          </p>
          {s.calendar.map((e, i) => (
            <div key={e.id + i} className="card" style={{ padding: "var(--space-4)" }}>
              <div className="row-between mb-2">
                <span className="muted" style={{ fontSize: "0.75rem", fontWeight: 500 }}>#{i + 1}{e.confirm ? " · CONFIRM date" : ""}</span>
                <button type="button" onClick={() => setS((p) => ({ ...p, calendar: p.calendar.filter((_, j) => j !== i) }))} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>Remove</button>
              </div>
              <div className="stack gap-3">
                <Field label="Title"><input className="input" value={e.title} onChange={(ev) => setCal(i, { title: ev.target.value })} /></Field>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Frequency">
                    <select className="input" value={e.frequency} onChange={(ev) => setCal(i, { frequency: ev.target.value as CalendarEntry["frequency"] })}>
                      <option value="monthly">monthly</option><option value="quarterly">quarterly</option><option value="annual">annual</option>
                    </select>
                  </Field>
                  <Field label="Due-date rule">
                    <select className="input" value={e.rule} onChange={(ev) => setCal(i, { rule: ev.target.value as CalendarEntry["rule"] })}>
                      <option value="fixed">fixed date</option>
                      <option value="end-of-following-month">end of following month</option>
                      <option value="day-of-following-month">day of following month</option>
                      <option value="quarter-second-month">second month after quarter</option>
                    </select>
                  </Field>
                  {e.rule === "fixed" ? (
                    <Field label="Date"><input className="input" type="date" value={e.date ?? ""} onChange={(ev) => setCal(i, { date: ev.target.value })} /></Field>
                  ) : e.rule !== "end-of-following-month" ? (
                    <Field label="Day of month"><input className="input" type="number" min={1} max={31} value={e.day ?? ""} onChange={(ev) => setCal(i, { day: Math.max(1, Math.min(31, Math.round(num(ev.target.value)) || 1)) })} /></Field>
                  ) : <span />}
                  <Field label="Confirmed?">
                    <label className="row gap-2" style={{ fontSize: "0.85rem", paddingTop: 8 }}>
                      <input type="checkbox" checked={!e.confirm} onChange={(ev) => setCal(i, { confirm: !ev.target.checked })} /> date checked
                    </label>
                  </Field>
                </div>
                <div className="chips">
                  {APPLIES.map((a) => (
                    <button key={a} type="button" className={`chip${e.applies.includes(a) ? " active" : ""}`} onClick={() => setCal(i, { applies: e.applies.includes(a) ? e.applies.filter((x) => x !== a) : [...e.applies, a] })}>
                      {a}
                    </button>
                  ))}
                </div>
                <Field label="What it is and who it applies to"><textarea className="input" rows={2} value={e.detail} onChange={(ev) => setCal(i, { detail: ev.target.value })} /></Field>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div className="save-bar">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary">{pending ? "Saving…" : "Save changes"}</button>
        <a href="/tools" target="_blank" rel="noreferrer" className="btn btn-secondary">View tools ↗</a>
        {msg && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{msg}</span>}
      </div>
    </>
  );
}

function Pct({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return (
    <Field label={label}>
      <input className="input" type="number" step="0.01" value={toPct(v)} onChange={(e) => on(fromPct(e.target.value))} />
    </Field>
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
