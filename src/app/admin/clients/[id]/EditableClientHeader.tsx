"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  companyName: string | null;
  country: string | null;
  address: string | null;
  registrationNumber: string | null;
  vatNumber: string | null;
  taxResidency: string | null;
  engagementLetterDate: string | null; // ISO
  phone: string | null;
};

export function EditableClientHeader({
  clientId, initials, name, reference, since, email, initial,
}: {
  clientId: string;
  initials: string;
  name: string;
  reference: string;
  since: string; // ISO
  email: string;
  initial: Profile;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<Profile>(initial);
  const router = useRouter();

  function save() {
    start(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: draft.companyName,
          country: draft.country,
          address: draft.address,
          registrationNumber: draft.registrationNumber,
          vatNumber: draft.vatNumber,
          taxResidency: draft.taxResidency,
          engagementLetterDate: draft.engagementLetterDate,
          phone: draft.phone,
        }),
      });
      if (res.ok) { setEditing(false); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Save failed"); }
    });
  }

  return (
    <section className="bg-admin-surface border border-admin-border rounded-card p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 items-start">
          <div className="w-14 h-14 rounded-full grid place-items-center text-meta font-bold bg-accent text-dark">{initials}</div>
          <div>
            <h1 className="font-display text-2xl">{name}</h1>
            <p className="text-meta text-admin-muted">
              {draft.companyName ?? "—"} · Ref {reference} · Client since {new Date(since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="text-meta text-admin-muted mt-1">
              <a href={`mailto:${email}`} className="underline">{email}</a> · {draft.phone ?? "—"}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} className="btn px-3 py-1.5 text-meta">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Field label="Company name"><input value={draft.companyName ?? ""} onChange={(e) => setDraft({ ...draft, companyName: e.target.value || null })} className="input" /></Field>
          <Field label="Phone"><input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })} className="input" /></Field>
          <Field label="Country (ISO, e.g. CY)"><input maxLength={2} value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value.toUpperCase() || null })} className="input" /></Field>
          <Field label="Tax residency (ISO)"><input maxLength={2} value={draft.taxResidency ?? ""} onChange={(e) => setDraft({ ...draft, taxResidency: e.target.value.toUpperCase() || null })} className="input" /></Field>
          <Field label="Registered address" className="md:col-span-2"><textarea value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value || null })} rows={2} className="input" /></Field>
          <Field label="Cyprus HE number"><input value={draft.registrationNumber ?? ""} onChange={(e) => setDraft({ ...draft, registrationNumber: e.target.value || null })} className="input" /></Field>
          <Field label="VAT number"><input value={draft.vatNumber ?? ""} onChange={(e) => setDraft({ ...draft, vatNumber: e.target.value || null })} className="input" /></Field>
          <Field label="Engagement letter date"><input type="date" value={draft.engagementLetterDate?.slice(0, 10) ?? ""} onChange={(e) => setDraft({ ...draft, engagementLetterDate: e.target.value || null })} className="input" /></Field>
          <div className="md:col-span-2 flex gap-2 justify-end mt-2">
            <button type="button" onClick={() => { setDraft(initial); setEditing(false); }} className="btn px-4 py-2">Cancel</button>
            <button type="button" onClick={save} disabled={pending} className="btn btn-primary px-4 py-2 disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="mt-6 grid gap-2 md:grid-cols-3 text-meta">
          <Pair label="Country" value={draft.country} />
          <Pair label="Tax residency" value={draft.taxResidency} />
          <Pair label="HE number" value={draft.registrationNumber} />
          <Pair label="VAT number" value={draft.vatNumber} />
          <Pair label="Engagement letter" value={draft.engagementLetterDate ? new Date(draft.engagementLetterDate).toLocaleDateString("en-GB") : null} />
          <Pair label="Address" value={draft.address} className="md:col-span-3" />
        </div>
      )}
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Pair({ label, value, className = "" }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-widest text-admin-muted">{label}</div>
      <div className="font-mono">{value ?? "—"}</div>
    </div>
  );
}
