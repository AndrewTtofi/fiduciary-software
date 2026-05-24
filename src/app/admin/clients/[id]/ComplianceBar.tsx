import Link from "next/link";

export function ComplianceBar({
  clientId,
  status,
  riskRating,
}: {
  clientId: string;
  status: "open" | "in_review" | "cleared" | "blocked" | null;
  riskRating: "low" | "standard" | "high" | null;
}) {
  if (!status) return null;

  const statusLabel: Record<string, string> = {
    open: "Open",
    in_review: "In review",
    cleared: "Cleared",
    blocked: "Blocked",
  };

  const statusTone: Record<string, string> = {
    open: "#6E4F12",
    in_review: "#2A3D49",
    cleared: "#3A4D2A",
    blocked: "#7A1F1F",
  };

  const riskTone: Record<string, string> = {
    high: "#7A1F1F",
    standard: "#8A6B26",
    low: "#3A4D2A",
  };

  const tone = statusTone[status];

  return (
    <section
      className="mb-10 flex flex-wrap items-center gap-x-10 gap-y-3 px-6 py-4"
      style={{
        background: "var(--admin-surface)",
        borderTop: "1px solid var(--admin-border)",
        borderBottom: "1px solid var(--admin-border)",
      }}
    >
      <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-muted">
        Compliance file
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="w-2 h-2 rounded-full inline-block"
          style={{ background: tone }}
        />
        <span
          className="font-mono text-[11px] tracking-[0.14em] uppercase"
          style={{ color: tone }}
        >
          {statusLabel[status]}
        </span>
      </div>

      {riskRating && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-muted">
            Risk
          </span>
          <span
            className="font-mono text-[11px] tracking-[0.14em] uppercase"
            style={{ color: riskTone[riskRating] }}
          >
            {riskRating}
          </span>
        </div>
      )}

      <Link
        href={`/admin/clients/${clientId}/compliance`}
        className="ml-auto font-mono text-[10px] tracking-[0.22em] uppercase text-accent-deep link-gold"
      >
        Open file →
      </Link>
    </section>
  );
}
