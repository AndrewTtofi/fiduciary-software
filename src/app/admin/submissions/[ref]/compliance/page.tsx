import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";
import { recomputeAndStoreRisk } from "@/lib/services/compliance/risk-persist";

export const dynamic = "force-dynamic";

export default async function SubmissionCompliancePage({ params }: { params: Promise<{ ref: string }> }) {
  await requireRole("staff");
  const { ref } = await params;
  const prospect = await prisma.prospect.findFirst({
    where: { OR: [{ id: ref }, { referenceNumber: ref }] },
    include: { complianceFile: { include: {
      parties: { include: { kycCase: { include: { latestScreeningRun: { include: { hits: true } } } } } },
      reviewTasks: { where: { state: "open" }, include: { assignedTo: true } },
    } } },
  });
  if (!prospect?.complianceFile) notFound();
  if (!prospect.complianceFile.riskComputed) await recomputeAndStoreRisk(prospect.complianceFile.id, null);
  const file: any = prospect.complianceFile;

  const overrideHistory = await prisma.activityLog.findMany({
    where: { entityType: "compliance_file", entityId: file.id, action: "compliance.risk_overridden" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: true },
  });

  return (
    <AdminShell active="submissions">
      <ComplianceDashboard file={{
        ...file,
        signedOffAt: file.signedOffAt?.toISOString() ?? null,
        parties: file.parties.map((p: any) => ({
          ...p,
          kycCase: p.kycCase ? {
            ...p.kycCase,
            latestScreeningRun: p.kycCase.latestScreeningRun ? {
              ...p.kycCase.latestScreeningRun,
              ranAt: p.kycCase.latestScreeningRun.ranAt?.toISOString() ?? null,
              hits: p.kycCase.latestScreeningRun.hits.map((h: any) => ({
                id: h.id, matchedName: h.matchedName, matchedTopics: h.matchedTopics, reviewStatus: h.reviewStatus,
              })),
            } : null,
          } : null,
        })),
        reviewTasks: file.reviewTasks.map((t: any) => ({
          id: t.id, kind: t.kind, dueAt: t.dueAt?.toISOString() ?? null,
          assignedTo: t.assignedTo ? { fullName: t.assignedTo.fullName } : null,
        })),
        riskOverrideHistory: overrideHistory.map((h: any) => {
          const meta = (h.meta ?? {}) as Record<string, unknown>;
          return {
            id: h.id,
            createdAt: h.createdAt.toISOString(),
            actor: h.actor?.fullName ?? "System",
            before: (meta.before as string | null) ?? null,
            after: (meta.after as string | null) ?? null,
            reason: (meta.reason as string | null) ?? null,
            escalated: !!(meta.escalated),
          };
        }),
      }} parentLink={`/admin/submissions/${ref}/compliance`} />
    </AdminShell>
  );
}
