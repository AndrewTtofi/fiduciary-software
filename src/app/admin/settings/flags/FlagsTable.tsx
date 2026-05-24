"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export type FlagRow = {
  key: string;
  label: string;
  envHint: string;
  enabled: boolean;
  envPresent: boolean;
};

export function FlagsTable({ initial }: { initial: FlagRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle(key: string, next: boolean) {
    start(async () => {
      await fetch(`/api/admin/settings/flags/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-meta text-admin-muted mb-4">
        Toggles for optional providers. Most require an app restart to take effect because the
        Auth.js providers list is built at module load.
      </p>
      <div className="bg-admin-surface border border-admin-border rounded-elem overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FDFDFD" }}>
              <Th>Feature</Th>
              <Th>Required env</Th>
              <Th>Env present</Th>
              <Th>Enabled</Th>
            </tr>
          </thead>
          <tbody>
            {initial.map((f) => (
              <tr key={f.key} className="border-t border-admin-border">
                <Td>
                  <div className="font-semibold text-dark">{f.label}</div>
                  <div className="font-mono text-[11px] text-admin-muted">{f.key}</div>
                </Td>
                <Td className="font-mono text-[12px] text-admin-muted">{f.envHint}</Td>
                <Td>
                  {f.envPresent
                    ? <span className="badge badge-approved">Yes</span>
                    : <span className="badge badge-pending">Missing</span>}
                </Td>
                <Td>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      disabled={pending || !f.envPresent}
                      onChange={(e) => toggle(f.key, e.target.checked)}
                    />
                    <span className="text-meta">{f.enabled ? "On" : "Off"}</span>
                  </label>
                  {!f.envPresent && (
                    <div className="text-[11px] text-admin-muted mt-1">Add the env values and restart to enable.</div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-4 text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-top text-meta ${className}`}>{children}</td>;
}
