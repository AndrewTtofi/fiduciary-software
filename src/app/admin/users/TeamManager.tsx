"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataRow } from "@/components/admin/DataTable";

/* Firm-team management for the firm's own admin.

   The API routes behind this (/api/admin/settings/team) were already
   assertRole("staff") — the only thing keeping a firm admin out was the
   middleware redirect on /admin/settings/*, which exists to keep the platform
   operator's plan/billing surface separate. A firm managing its own colleagues
   needs no operator involvement, so it lives here instead. */

export type Member = {
  id: string;
  email: string;
  fullName: string;
  role: "staff" | "partner";
  deactivatedAt: string | null;
  createdAt: string;
};

export function TeamManager({
  members, currentUserId, partnersAllowed,
}: {
  members: Member[];
  currentUserId: string;
  /** Partner access is gated at the Professional plan; below it a partner
   *  account can only reach a "portal unavailable" wall. */
  partnersAllowed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ email: string; password: string; invited: boolean } | null>(null);

  function createMember(fd: FormData) {
    start(async () => {
      setError(null);
      const res = await fetch("/api/admin/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(fd.get("fullName") ?? ""),
          email: String(fd.get("email") ?? ""),
          role: String(fd.get("role") ?? "staff"),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; email?: string; tempPassword?: string; invited?: boolean };
      if (!res.ok) { setError(j.error ?? "Could not create the account."); return; }
      setCreating(false);
      setIssued({ email: j.email ?? "", password: j.tempPassword ?? "", invited: !!j.invited });
      router.refresh();
    });
  }

  function patch(id: string, body: Record<string, unknown>) {
    start(async () => {
      setError(null);
      const res = await fetch(`/api/admin/settings/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "That change did not go through.");
        return;
      }
      router.refresh();
    });
  }

  const rows: DataRow[] = members.map((m) => {
    const isSelf = m.id === currentUserId;
    const off = !!m.deactivatedAt;
    return {
      key: m.id,
      sort: [m.fullName, m.email, m.role, off ? 1 : 0, new Date(m.createdAt).getTime()],
      cells: [
        <div className="cell-entity" key="n">
          <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
            {m.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600 }}>{m.fullName}</span>
          {isSelf && <span className="tag">You</span>}
        </div>,
        <span className="mono" style={{ fontSize: "var(--fs-xs)" }} key="e">{m.email}</span>,
        // Your own role is not editable here — the API refuses it, so don't offer it.
        isSelf ? (
          <span className="tag" key="r">{m.role === "staff" ? "Staff" : "Partner"}</span>
        ) : (
          <select
            key="r"
            className="select select-sm"
            style={{ width: 120 }}
            value={m.role}
            disabled={pending}
            onChange={(e) => patch(m.id, { role: e.target.value })}
          >
            <option value="staff">Staff</option>
            <option value="partner" disabled={!partnersAllowed && m.role !== "partner"}>
              Partner{partnersAllowed || m.role === "partner" ? "" : " — needs Professional"}
            </option>
          </select>
        ),
        off
          ? <span className="badge badge-neutral" key="s">Deactivated</span>
          : <span className="badge badge-approved" key="s">Active</span>,
        <span className="mono muted" key="c">
          {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </span>,
        isSelf ? (
          <span className="muted" key="a">—</span>
        ) : (
          <button
            key="a"
            type="button"
            className={`btn btn-sm ${off ? "btn-secondary" : "btn-ghost"}`}
            style={off ? undefined : { color: "var(--danger)" }}
            disabled={pending}
            onClick={() => patch(m.id, { deactivated: !off })}
          >
            {off ? "Reactivate" : "Deactivate"}
          </button>
        ),
      ],
    };
  });

  return (
    <>
      <div className="row-between mb-6" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <p className="muted" style={{ fontSize: "var(--fs-sm)", maxWidth: "62ch" }}>
          Colleagues who work at the firm. New members are emailed a link to set their own
          password — deactivate instead of deleting so their history on past files stays intact.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating((v) => !v)}>
          {creating ? "Cancel" : "+ Add colleague"}
        </button>
      </div>

      {creating && (
        <form
          className="card mb-6"
          onSubmit={(e) => { e.preventDefault(); createMember(new FormData(e.currentTarget)); }}
        >
          <div className="row gap-3 wrap" style={{ alignItems: "flex-end" }}>
            <label className="field" style={{ marginBottom: 0, width: 220 }}>
              <span className="flabel">Full name</span>
              <input name="fullName" required minLength={2} className="input" />
            </label>
            <label className="field" style={{ marginBottom: 0, width: 280 }}>
              <span className="flabel">Email</span>
              <input name="email" type="email" required className="input" />
            </label>
            <label className="field" style={{ marginBottom: 0, width: 150 }}>
              <span className="flabel">Role</span>
              <select name="role" defaultValue="staff" className="select">
                <option value="staff">Staff</option>
                <option value="partner" disabled={!partnersAllowed}>
                  Partner{partnersAllowed ? "" : " — needs Professional"}
                </option>
              </select>
            </label>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      )}

      {issued && (
        <div className="card mb-6" style={{ borderColor: "var(--brand)" }}>
          <div className="eyebrow mb-3">Account created</div>
          {issued.invited ? (
            <p style={{ fontSize: "var(--fs-sm)" }}>
              We emailed <strong>{issued.email}</strong> a link to choose their own password, valid for 7 days.
              There is nothing for you to pass on.
            </p>
          ) : (
            <>
              <p style={{ fontSize: "var(--fs-sm)" }}>
                The welcome email could not be sent, so share this one-time password with{" "}
                <strong>{issued.email}</strong> yourself:
              </p>
              <code className="mono" style={{ display: "block", margin: "12px 0", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, fontSize: "1rem", userSelect: "all" }}>
                {issued.password}
              </code>
            </>
          )}
          <div className="row-between mt-3">
            <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
              {issued.invited
                ? "They can also use “Forgot?” on the sign-in page at any time."
                : "Shown only once. They should change it from My account after signing in."}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIssued(null)}>Done</button>
          </div>
        </div>
      )}

      {error && <p className="note mb-6" style={{ color: "var(--danger)" }}>{error}</p>}

      <DataTable
        title="Firm team"
        count={members.length}
        columns={[
          { label: "Name", sortable: true },
          { label: "Email", sortable: true },
          { label: "Role", sortable: true },
          { label: "Status", sortable: true },
          { label: "Joined", sortable: true },
          { label: "Actions" },
        ]}
        rows={rows}
        emptyTitle="No colleagues yet"
        emptyBody="Add your first staff or partner account above."
      />
    </>
  );
}
