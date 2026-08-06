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
  engagementLetterDate: string | null;
  phone: string | null;
};

export function EditableClientHeader({
  clientId,
  initials,
  name,
  reference,
  since,
  email,
  initial,
}: {
  clientId: string;
  initials: string;
  name: string;
  reference: string;
  since: string;
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
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Save failed");
      }
    });
  }

  const sinceFormatted = new Date(since).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-8 items-start">
        <div className="avatar" style={{ width: 80, height: 80, fontSize: "1.125rem" }}>
          {initials}
        </div>

        <div className="min-w-0">
          <div className="eyebrow mb-3">Engagement</div>
          <h2 style={{ fontSize: "1.563rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{name}</h2>
          {draft.companyName && (
            <div className="muted mt-1" style={{ fontSize: "0.9375rem" }}>{draft.companyName}</div>
          )}

          <dl className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-4">
            <Fact label="Reference" value={reference} mono />
            <Fact label="Client since" value={sinceFormatted} />
            <Fact label="Email" value={email} href={`mailto:${email}`} />
            <Fact label="Telephone" value={draft.phone ?? "—"} mono />
          </dl>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="btn btn-outline"
          >
            {editing ? "Cancel" : "Edit profile"}
          </button>
        </div>
      </div>

      <hr className="hairline-gold my-8" />

      {editing ? (
        <div className="card grid gap-5 md:grid-cols-2">
          <FieldEdit label="Company name">
            <input value={draft.companyName ?? ""} onChange={(e) => setDraft({ ...draft, companyName: e.target.value || null })} className="input" />
          </FieldEdit>
          <FieldEdit label="Telephone">
            <input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })} className="input figure" />
          </FieldEdit>
          <FieldEdit label="Country">
            <input maxLength={2} value={draft.country ?? ""} onChange={(e) => setDraft({ ...draft, country: e.target.value.toUpperCase() || null })} className="input figure" placeholder="ISO-2 (e.g. CY)" />
          </FieldEdit>
          <FieldEdit label="Tax residency">
            <input maxLength={2} value={draft.taxResidency ?? ""} onChange={(e) => setDraft({ ...draft, taxResidency: e.target.value.toUpperCase() || null })} className="input figure" placeholder="ISO-2 (e.g. CY)" />
          </FieldEdit>
          <FieldEdit label="Registered address" className="md:col-span-2">
            <textarea value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value || null })} rows={2} className="input" />
          </FieldEdit>
          <FieldEdit label="Cyprus HE number">
            <input value={draft.registrationNumber ?? ""} onChange={(e) => setDraft({ ...draft, registrationNumber: e.target.value || null })} className="input figure" />
          </FieldEdit>
          <FieldEdit label="VAT number">
            <input value={draft.vatNumber ?? ""} onChange={(e) => setDraft({ ...draft, vatNumber: e.target.value || null })} className="input figure" />
          </FieldEdit>
          <FieldEdit label="Engagement letter date" className="md:col-span-2">
            <input type="date" value={draft.engagementLetterDate?.slice(0, 10) ?? ""} onChange={(e) => setDraft({ ...draft, engagementLetterDate: e.target.value || null })} className="input figure" />
          </FieldEdit>
          <div className="md:col-span-2 flex gap-3 justify-end mt-2">
            <button type="button" onClick={() => { setDraft(initial); setEditing(false); }} className="btn btn-outline">
              Discard
            </button>
            <button type="button" onClick={save} disabled={pending} className="btn btn-primary disabled:opacity-40">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      ) : (
        (() => {
          /* Six columns of mostly "—" was a lot of page for data nobody had
             filled in. Show what is set; summarise the rest as one prompt to
             Edit profile, so an empty record reads as an invitation rather
             than a wall of dashes. */
          const facts = [
            { label: "Country", value: draft.country, mono: true },
            { label: "Tax residency", value: draft.taxResidency, mono: true },
            { label: "HE number", value: draft.registrationNumber, mono: true },
            { label: "VAT number", value: draft.vatNumber, mono: true },
            {
              label: "Engagement letter",
              value: draft.engagementLetterDate
                ? new Date(draft.engagementLetterDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : null,
            },
            { label: "Address", value: draft.address },
          ];
          const set = facts.filter((f) => f.value);
          const missing = facts.filter((f) => !f.value).map((f) => f.label.toLowerCase());

          if (set.length === 0) {
            return (
              <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                No company details recorded yet — country, tax residency, HE and VAT numbers,
                engagement letter and address. Use <strong>Edit profile</strong> to add them.
              </p>
            );
          }
          return (
            <>
              <dl className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-6">
                {set.map((f) => (
                  <Fact key={f.label} label={f.label} value={String(f.value)} mono={f.mono} />
                ))}
              </dl>
              {missing.length > 0 && (
                <p className="help mt-4">
                  Not recorded: {missing.join(", ")}.
                </p>
              )}
            </>
          );
        })()
      )}
    </section>
  );
}

function Fact({
  label,
  value,
  mono,
  href,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
  className?: string;
}) {
  const valueNode = (
    <span className={`block ${mono ? "mono" : ""} truncate`} style={{ fontSize: "0.875rem", lineHeight: 1.4 }} title={value}>
      {value}
    </span>
  );
  return (
    <div className={className}>
      <dt className="eyebrow mb-1.5">
        {label}
      </dt>
      <dd style={{ margin: 0 }}>
        {href ? <a href={href} className="link-gold">{valueNode}</a> : valueNode}
      </dd>
    </div>
  );
}

function FieldEdit({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}
