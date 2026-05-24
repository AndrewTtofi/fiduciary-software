import Link from "next/link";
import { daysAgo, formatDaysAgo, cadenceDays } from "@/lib/format";

type ScreeningRun = { outcome: string; hitCount: number; ranAt: string; hits: { reviewStatus: string }[] };
type KycCaseRow = { state: string; latestScreeningRun: ScreeningRun | null };
type PartyRow = { id: string; role: string; fullName: string; type: string; kycCase: KycCaseRow | null };

export function PartiesTable({ fileId, parties, parentLink, riskRating }: {
  fileId: string;
  parties: PartyRow[];
  parentLink: string;
  riskRating?: string | null;
}) {
  return (
    <section className="bg-admin-surface border border-admin-border rounded-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ background: "#FDFDFD" }}>
            <Th>Party</Th><Th>Role</Th><Th>Type</Th><Th>KYC state</Th><Th>Latest screening</Th><Th>Hits</Th><Th>Schedule</Th><Th>{""}</Th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => {
            const run = p.kycCase?.latestScreeningRun ?? null;
            const unreviewedCount = run ? run.hits.filter((h) => h.reviewStatus === "pending").length : 0;
            const lastDays = run ? daysAgo(run.ranAt) : null;
            const cadence = cadenceDays(riskRating ?? null);
            const nextDays = lastDays !== null ? cadence - lastDays : null;
            const overdue = nextDays !== null && nextDays <= 0;
            return (
              <tr key={p.id} className="border-t border-admin-border">
                <Td className="font-semibold">{p.fullName}</Td>
                <Td>{p.role.replace("_", " ")}</Td>
                <Td>{p.type}</Td>
                <Td><span className="badge badge-pending">{p.kycCase?.state ?? "—"}</span></Td>
                <Td>{run ? `${run.outcome} (${run.hitCount})` : "not run"}</Td>
                <Td>
                  {unreviewedCount > 0 && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: "#DC2626" }}>
                      {unreviewedCount} to review
                    </span>
                  )}
                </Td>
                <Td>
                  {lastDays !== null && nextDays !== null ? (
                    <span className={`text-[12px] ${overdue ? "text-[#DC2626] font-semibold" : "text-admin-muted"}`}>
                      last {formatDaysAgo(lastDays)} · next: {overdue ? "overdue" : `${nextDays}d`}
                    </span>
                  ) : (
                    <span className="text-[12px] text-admin-muted">—</span>
                  )}
                </Td>
                <Td><Link href={`${parentLink}/parties/${p.id}`} className="text-meta underline">Open</Link></Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="text-left p-4 text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{children}</th>; }
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`p-4 align-middle text-meta ${className}`}>{children}</td>; }
