"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export function ServicesTable({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function call(method: string, url: string, body?: unknown) {
    start(async () => {
      setMsg(null);
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(j.error ?? "Action failed.");
        return;
      }
      setEditing(null);
      setCreating(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-meta text-admin-muted">
          Services shown on onboarding & assigned to clients. Disabling hides a service from new
          selections but keeps existing client assignments intact.
        </p>
        <button
          type="button"
          onClick={() => { setCreating((v) => !v); setEditing(null); }}
          className="btn btn-primary px-4 py-2"
        >
          {creating ? "Cancel" : "+ Add service"}
        </button>
      </div>

      {creating && (
        <ServiceRowEdit
          initial={{ key: "", label: "", description: "", sortOrder: initial.length, active: true }}
          submit={(data) => call("POST", "/api/admin/settings/services", data)}
          onCancel={() => setCreating(false)}
          pending={pending}
        />
      )}

      <div className="bg-admin-surface border border-admin-border rounded-elem overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FDFDFD" }}>
              <Th>Key</Th>
              <Th>Label</Th>
              <Th>Description</Th>
              <Th>Order</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {initial.map((s) =>
              editing === s.id ? (
                <tr key={s.id} className="border-t border-admin-border">
                  <td colSpan={6} className="p-0">
                    <ServiceRowEdit
                      initial={{ key: s.key, label: s.label, description: s.description ?? "", sortOrder: s.sortOrder, active: s.active }}
                      submit={(data) => call("PATCH", `/api/admin/settings/services/${s.id}`, data)}
                      onCancel={() => setEditing(null)}
                      pending={pending}
                      keyDisabled
                    />
                  </td>
                </tr>
              ) : (
                <tr key={s.id} className="border-t border-admin-border">
                  <Td className="font-mono">{s.key}</Td>
                  <Td className="font-semibold">{s.label}</Td>
                  <Td className="text-admin-muted">{s.description ?? "—"}</Td>
                  <Td className="font-mono">{s.sortOrder}</Td>
                  <Td>
                    {s.active
                      ? <span className="badge badge-approved">Active</span>
                      : <span className="badge badge-pending">Disabled</span>}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditing(s.id)} className="text-[12px] underline">Edit</button>
                      <button
                        type="button"
                        onClick={() => call("PATCH", `/api/admin/settings/services/${s.id}`, { active: !s.active })}
                        disabled={pending}
                        className="text-[12px] underline"
                      >
                        {s.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete service "${s.label}"? This fails if any client is still assigned to it.`)) {
                            call("DELETE", `/api/admin/settings/services/${s.id}`);
                          }
                        }}
                        disabled={pending}
                        className="text-[12px] underline text-[#DC2626]"
                      >
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {msg && <p className="text-meta text-[#DC2626] mt-3">{msg}</p>}
    </div>
  );
}

function ServiceRowEdit({
  initial, submit, onCancel, pending, keyDisabled,
}: {
  initial: { key: string; label: string; description: string; sortOrder: number; active: boolean };
  submit: (data: { key: string; label: string; description: string; sortOrder: number; active: boolean }) => void;
  onCancel: () => void;
  pending: boolean;
  keyDisabled?: boolean;
}) {
  return (
    <form
      className="p-4 bg-admin-bg flex flex-wrap gap-3 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        submit({
          key: String(fd.get("key") ?? "").trim(),
          label: String(fd.get("label") ?? "").trim(),
          description: String(fd.get("description") ?? "").trim(),
          sortOrder: Number(fd.get("sortOrder") ?? 0),
          active: fd.get("active") === "on",
        });
      }}
    >
      <Field label="Key (snake_case)" className="w-40">
        <input name="key" required pattern="[a-z0-9_]+" defaultValue={initial.key} disabled={keyDisabled} className="input font-mono" />
      </Field>
      <Field label="Label" className="w-52">
        <input name="label" required defaultValue={initial.label} className="input" />
      </Field>
      <Field label="Description" className="flex-1 min-w-[200px]">
        <input name="description" defaultValue={initial.description} className="input" />
      </Field>
      <Field label="Order" className="w-20">
        <input name="sortOrder" type="number" defaultValue={initial.sortOrder} className="input" />
      </Field>
      <label className="flex items-center gap-2 text-meta">
        <input name="active" type="checkbox" defaultChecked={initial.active} /> Active
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2 disabled:opacity-50">Save</button>
        <button type="button" onClick={onCancel} className="text-meta underline">Cancel</button>
      </div>
    </form>
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-4 text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-middle text-meta ${className}`}>{children}</td>;
}
