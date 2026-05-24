import Link from "next/link";

export function ComplianceBar({ clientId, status, riskRating }: {
  clientId: string;
  status: "open" | "in_review" | "cleared" | "blocked" | null;
  riskRating: "low" | "standard" | "high" | null;
}) {
  if (!status) return null;
  const cls = status === "cleared" ? "badge-approved" : status === "blocked" ? "badge-pending" : "badge-pending";
  const riskColor = riskRating === "high" ? "#DC2626" : riskRating === "low" ? "#16A34A" : "#CA8A04";

  return (
    <section className="mb-6 flex items-center justify-between bg-admin-bg border border-admin-border rounded-card px-4 py-3">
      <div className="flex items-center gap-3 text-meta">
        <span className="font-semibold uppercase tracking-widest text-[11px] text-admin-muted">Compliance</span>
        <span className={`badge ${cls} capitalize`}>{status.replace("_", " ")}</span>
        {riskRating && (
          <span className="text-meta">
            risk: <span className="font-semibold capitalize" style={{ color: riskColor }}>{riskRating}</span>
          </span>
        )}
      </div>
      <Link href={`/admin/clients/${clientId}/compliance`} className="text-meta underline">
        Open compliance file →
      </Link>
    </section>
  );
}
