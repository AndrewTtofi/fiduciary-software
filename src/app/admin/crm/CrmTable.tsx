"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, type DataRow } from "@/components/admin/DataTable";

export type CrmRecord = {
  key: string;
  name: string;
  email: string;
  service: string;
  type: "Lead" | "Applicant" | "Client";
  stage: string; // Lead | registered | pending | needs_info | approved | rejected | Client
  detail: string;
  /** Where they live and pay tax — free text as captured on the form. */
  country: string | null;
  /** Citizenships held, comma-separated as captured. */
  passports: string | null;
  /* The flag artwork is ~110KB and is rendered on the server, so these arrive
     already rendered rather than being drawn inside this client component. */
  countryCell: ReactNode;
  passportsCell: ReactNode;
  /** Derived routing rules (computeLeadFlags), shown as pills in the drawer. */
  routes: { label: string; tone: string }[];
  /** Full record fields shown in the detail drawer, grouped in sections. */
  sections: { title: string; fields: { label: string; value: string }[] }[];
  /** Available actions */
  leadId?: string;         // lead → "Send onboarding link" / "Create account"
  activationSentAt?: string | null; // lead → when the post-call link last went out
  existingAccount?: boolean;        // lead email already has an account
  prospectId?: string;     // approved applicant → "Make client"
  canMakeClient?: boolean;
  /** Why "Make client" is unavailable right now (shown instead of a dead button). */
  makeClientBlocker?: string;
  submissionHref?: string; // applicants/clients → open submission
  complianceHref?: string; // shown when conversion is blocked on compliance
  clientHref?: string;     // clients → open client profile
};

export function CrmTable({ records, initialOpenKey = null }: { records: CrmRecord[]; initialOpenKey?: string | null }) {
  const [openKey, setOpenKey] = useState<string | null>(initialOpenKey);
  const open = records.find((r) => r.key === openKey) ?? null;

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenKey(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  const rows: DataRow[] = records.map((r) => ({
    key: r.key,
    sort: [r.name, r.service, r.country, r.type, STAGE_ORDER[r.stage] ?? 99, r.detail],
    cells: [
      <div className="cell-entity" key="n">
        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initialsOf(r.name)}</div>
        <div><div style={{ fontWeight: 500 }}>{r.name}</div><div className="sub">{r.email}</div></div>
      </div>,
      r.service,
      <span key="j">{r.countryCell}</span>,
      <span className="tag" key="t">{r.type}</span>,
      <span className={`badge ${stageClass(r.stage)}`} key="s">{stageLabel(r.stage)}</span>,
      <span className="muted" key="d">{r.detail}</span>,
    ],
  }));

  return (
    <>
      <DataTable
        title="Pipeline"
        count={`${records.length} records`}
        columns={[
          { label: "Name", sortable: true },
          { label: "Service", sortable: true },
          { label: "Lives in", sortable: true },
          { label: "Type", sortable: true },
          { label: "Stage", sortable: true },
          { label: "Detail" },
        ]}
        rows={rows}
        onRowClick={setOpenKey}
      />

      {open && <RecordDrawer record={open} onClose={() => setOpenKey(null)} />}
    </>
  );
}

/* Sort the pipeline by how far along it is, not alphabetically — "Client"
   after "approved" is the order staff think in. */
const STAGE_ORDER: Record<string, number> = {
  Lead: 0, onboarding_sent: 1, registered: 2, pending: 3, needs_info: 4, approved: 5, Client: 6, rejected: 7,
};

function RecordDrawer({ record, onClose }: { record: CrmRecord; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ password?: string; existing?: boolean } | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  /** Post-call: email the lead a single-use link that signs them in and turns
   *  this record into their account — no blank sign-up, no password. */
  function sendLink() {
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/leads/${record.leadId}/activation`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error === "already_registered"
          ? "This email already has an active account — they can sign in as usual."
          : j.error ?? "Could not send the link");
        return;
      }
      setLinkSent(true);
      router.refresh();
    });
  }

  function createAccount() {
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/leads/${record.leadId}/convert`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { error?: string; tempPassword?: string; existing?: boolean };
      if (!res.ok) { setError(j.error ?? "Failed to create the account"); return; }
      // Hold the refresh until the one-time password has been dismissed —
      // refreshing immediately would unmount the drawer and lose it.
      setIssued({ password: j.tempPassword, existing: j.existing });
    });
  }

  function makeClient() {
    start(async () => {
      setError(null);
      const res = await fetch("/api/admin/clients/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: record.prospectId }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; clientId?: string };
      if (!res.ok) {
        setError(
          j.error === "compliance_not_cleared" ? "Compliance review is not cleared yet."
          : j.error === "compliance_blocked" ? "Compliance file is blocked."
          : j.error === "no_compliance_file" ? "No compliance file yet — open compliance to start it."
          : j.error ?? "Conversion failed",
        );
        return;
      }
      if (j.clientId) router.push(`/admin/clients/${j.clientId}`);
    });
  }

  function dismissIssued() {
    setIssued(null);
    onClose();
    router.refresh();
  }

  return (
    <>
      <div className="drawer-scrim" onClick={issued ? undefined : onClose} />
      <aside className="drawer" role="dialog" aria-label={record.name}>
        <div className="drawer-head">
          <div className="cell-entity" style={{ gap: "0.85rem" }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{initialsOf(record.name)}</div>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 650, letterSpacing: "-0.01em" }}>{record.name}</h3>
              <div className="row mt-2" style={{ gap: ".5rem", alignItems: "center" }}>
                {stageLabel(record.stage) !== record.type && <span className="tag">{record.type}</span>}
                <span className={`badge ${stageClass(record.stage)}`}>{stageLabel(record.stage)}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close">✕</button>
        </div>

        <div className="drawer-body">
          {/* What the case needs, before the adviser reads a single field. */}
          {!issued && record.routes.length > 0 && (
            <div className="routes mb-4">
              {record.routes.map((r) => (
                <span key={r.label} className={`route ${r.tone}`}>{r.label}</span>
              ))}
            </div>
          )}
          {!issued && (record.country || record.passports) && (
            <section className="kv-section">
              <div className="kv-title">Jurisdiction</div>
              <dl className="kv">
                <dt>Lives and pays tax in</dt>
                <dd>{record.countryCell}</dd>
                <dt>Passports held</dt>
                <dd>{record.passportsCell}</dd>
              </dl>
            </section>
          )}
          {linkSent && (
            <div className="card mb-4">
              <div className="eyebrow mb-2">Onboarding link sent</div>
              <p style={{ fontSize: "var(--fs-sm)" }}>
                Emailed to <strong>{record.email}</strong>. One click signs them in and opens their checklist — no password needed.
                Sending again invalidates this link.
              </p>
            </div>
          )}
          {issued ? (
            <div className="card">
              {issued.password ? (
                <>
                  <div className="eyebrow mb-3">Account created</div>
                  <p style={{ fontSize: "var(--fs-sm)" }}>
                    One-time password for <strong>{record.email}</strong>:
                  </p>
                  <code className="mono" style={{ display: "block", margin: "12px 0", padding: "10px 14px", background: "var(--surface-2, #F5F4F0)", borderRadius: "8px", fontSize: "1rem", userSelect: "all" }}>
                    {issued.password}
                  </code>
                  <p className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                    Shown only once — share it securely. They sign in with it, complete onboarding,
                    and continue through review to client.
                  </p>
                </>
              ) : (
                <>
                  <div className="eyebrow mb-3">Already registered</div>
                  <p style={{ fontSize: "var(--fs-sm)" }}>
                    An account with <strong>{record.email}</strong> already exists — the lead has been
                    linked to it and will progress through the pipeline.
                  </p>
                </>
              )}
            </div>
          ) : (
            record.sections.map((s) => (
              <section key={s.title} className="kv-section">
                <div className="kv-title">{s.title}</div>
                <dl className="kv">
                  {s.fields.map((f) => (
                    <FieldRow key={f.label} label={f.label} value={f.value} />
                  ))}
                </dl>
              </section>
            ))
          )}
          {error && (
            <div className="badge badge-danger mt-4" style={{ whiteSpace: "normal" }}>
              {error}
              {record.complianceHref && error.toLowerCase().includes("compliance") && (
                <> <Link href={record.complianceHref} style={{ textDecoration: "underline" }}>Open compliance →</Link></>
              )}
            </div>
          )}
        </div>

        <div className="drawer-foot">
          {issued ? (
            <button type="button" onClick={dismissIssued} className="btn btn-primary">Done</button>
          ) : (
            <>
              {record.leadId && (
                <div className="row" style={{ gap: ".5rem", alignItems: "center", marginRight: "auto", flexWrap: "wrap" }}>
                  <button type="button" onClick={sendLink} disabled={pending || !!record.existingAccount} className="btn btn-primary"
                          title={record.existingAccount ? "This email already has an account" : "Email a one-click activation link (after the call)"}>
                    {pending ? "Sending…" : record.activationSentAt || linkSent ? "Resend onboarding link" : "Send onboarding link →"}
                  </button>
                  {!record.existingAccount && (
                    <button type="button" onClick={createAccount} disabled={pending} className="btn btn-ghost btn-sm" title="Manual fallback: create the account now and hand over a one-time password">
                      Create account manually
                    </button>
                  )}
                </div>
              )}
              {record.prospectId && !record.clientHref && (
                <div className="row" style={{ gap: ".5rem", alignItems: "center", marginRight: "auto", flexWrap: "wrap" }}>
                  <button type="button" onClick={makeClient} disabled={pending || !record.canMakeClient} className="btn btn-primary"
                          title={record.makeClientBlocker}>
                    {pending ? "Converting…" : "Make client →"}
                  </button>
                  {!record.canMakeClient && record.makeClientBlocker && (
                    <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                      {record.makeClientBlocker}
                      {record.complianceHref && record.makeClientBlocker.toLowerCase().includes("compliance") && (
                        <> <Link href={record.complianceHref} style={{ textDecoration: "underline" }}>Open compliance →</Link></>
                      )}
                    </span>
                  )}
                </div>
              )}
              {record.stage === "registered" && (
                <span className="muted" style={{ marginRight: "auto", fontSize: "var(--fs-xs)" }}>
                  Waiting for them to complete onboarding.
                </span>
              )}
              {record.clientHref && <Link href={record.clientHref} className="btn btn-primary">Client profile →</Link>}
              {record.submissionHref && <Link href={record.submissionHref} className="btn btn-ghost">Submission →</Link>}
              <button type="button" onClick={onClose} className="btn btn-ghost">Close</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function initialsOf(name: string) {
  return name === "(anonymous lead)" ? "?" : name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function stageLabel(s: string) {
  return s === "Lead" ? "Lead"
    : s === "Client" ? "Client"
    : s === "registered" ? "Registered"
    : s === "onboarding_sent" ? "Link sent"
    : s.replace("_", " ");
}
function stageClass(s: string) {
  return s === "Client" ? "badge-approved"
    : s === "approved" ? "badge-approved"
    : s === "needs_info" ? "badge-info"
    : s === "registered" ? "badge-info"
    : s === "onboarding_sent" ? "badge-info"
    : s === "rejected" ? "badge-danger"
    : s === "pending" ? "badge-pending"
    : "badge-neutral";
}
