"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  email: string;
  fullName: string;
  role: "staff" | "partner";
  deactivatedAt: string | null;
  createdAt: string;
};

export function TeamTable({ initial, currentUserId }: { initial: Member[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(null);

  function refresh() { router.refresh(); }

  function createMember(fd: FormData) {
    start(async () => {
      setMsg(null);
      const res = await fetch("/api/admin/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          fullName: fd.get("fullName"),
          role: fd.get("role"),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; tempPassword?: string; email?: string };
      if (!res.ok) { setMsg(j.error ?? "Failed to create."); return; }
      if (j.tempPassword && j.email) setTempPassword({ email: j.email, password: j.tempPassword });
      setCreating(false);
      refresh();
    });
  }

  function patch(id: string, body: Partial<{ role: "staff" | "partner"; deactivated: boolean }>) {
    start(async () => {
      setMsg(null);
      const res = await fetch(`/api/admin/settings/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(j.error ?? "Action failed.");
        return;
      }
      refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-meta text-admin-muted">
          Staff and partner accounts. New members get a one-time password shown here once after creation.
        </p>
        <button type="button" onClick={() => setCreating((v) => !v)} className="btn btn-primary px-4 py-2">
          {creating ? "Cancel" : "+ Add member"}
        </button>
      </div>

      {creating && (
        <form
          className="p-4 bg-admin-bg border border-admin-border rounded-elem flex flex-wrap gap-3 items-end mb-4"
          onSubmit={(e) => { e.preventDefault(); createMember(new FormData(e.currentTarget)); }}
        >
          <Field label="Full name" className="w-56">
            <input name="fullName" required className="input" />
          </Field>
          <Field label="Email" className="w-72">
            <input name="email" type="email" required className="input" />
          </Field>
          <Field label="Role" className="w-40">
            <select name="role" defaultValue="staff" className="input">
              <option value="staff">Staff</option>
              <option value="partner">Partner</option>
            </select>
          </Field>
          <button type="submit" disabled={pending} className="btn btn-primary px-4 py-2 disabled:opacity-50">Create</button>
        </form>
      )}

      {tempPassword && (
        <div className="mb-4 p-4 border border-accent rounded-elem bg-admin-surface">
          <div className="text-meta font-semibold mb-1">One-time password for {tempPassword.email}</div>
          <code className="font-mono text-[13px] bg-admin-bg px-2 py-1 rounded">{tempPassword.password}</code>
          <button type="button" onClick={() => setTempPassword(null)} className="ml-3 text-[12px] underline">Dismiss</button>
          <p className="text-[11px] text-admin-muted mt-2">Share securely. The member should change it after first login.</p>
        </div>
      )}

      <div className="bg-admin-surface border border-admin-border rounded-elem overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FDFDFD" }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {initial.map((m) => {
              const isSelf = m.id === currentUserId;
              const deactivated = !!m.deactivatedAt;
              return (
                <tr key={m.id} className="border-t border-admin-border">
                  <Td className="font-semibold">{m.fullName}</Td>
                  <Td className="font-mono">{m.email}</Td>
                  <Td>
                    <select
                      value={m.role}
                      disabled={pending || isSelf}
                      onChange={(e) => patch(m.id, { role: e.target.value as "staff" | "partner" })}
                      className="input py-1 px-2 text-meta"
                    >
                      <option value="staff">Staff</option>
                      <option value="partner">Partner</option>
                    </select>
                  </Td>
                  <Td>
                    {deactivated
                      ? <span className="badge badge-pending">Deactivated</span>
                      : <span className="badge badge-approved">Active</span>}
                  </Td>
                  <Td className="font-mono text-meta text-admin-muted">
                    {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </Td>
                  <Td>
                    {isSelf ? (
                      <span className="text-[12px] text-admin-muted">(you)</span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => patch(m.id, { deactivated: !deactivated })}
                        className="text-[12px] underline"
                      >
                        {deactivated ? "Reactivate" : "Deactivate"}
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {msg && <p className="text-meta text-[#DC2626] mt-3">{msg}</p>}
    </div>
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
