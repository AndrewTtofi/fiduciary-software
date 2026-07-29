import Link from "next/link";
import { currentIsSuperAdmin } from "@/lib/auth/guards";
import type { PlanTier } from "@/lib/services/branding";

const LockIcon = (
  <svg className="ic ic-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** Shown in place of a feature page when the current plan tier is below the
 *  tier that unlocks it. Deliberately neutral: firm staff never see internal
 *  tier names — only the platform operator (super admin) gets the link to the
 *  plan settings. */
export async function UpgradeGate({ title, desc }: { required?: PlanTier; currentTier?: string; title: string; desc: string }) {
  const superAdmin = await currentIsSuperAdmin();
  return (
    <div className="card" style={{ maxWidth: 560, margin: "var(--space-8) 0", textAlign: "center", padding: "var(--space-12)" }}>
      <div className="kpi-tile" style={{ width: 56, height: 56, margin: "0 auto var(--space-4)" }}>{LockIcon}</div>
      <h3 style={{ fontWeight: 600, fontSize: "var(--fs-h3)" }}>{title}</h3>
      <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)" }}>{desc}</p>
      <div className="note mt-6" style={{ textAlign: "left" }}>
        <svg className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
        <div>
          This module is not part of your platform package. Contact your platform provider to
          enable it.
        </div>
      </div>
      {superAdmin && (
        <Link href="/admin/settings/branding" className="btn btn-primary mt-6">Change plan in settings</Link>
      )}
    </div>
  );
}
