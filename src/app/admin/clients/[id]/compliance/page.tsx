import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { recomputeAndStoreRisk } from "@/lib/services/compliance/risk-persist";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compliance" };

export default async function ClientCompliancePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("staff");
  const { id } = await params;
  const file = await prisma.complianceFile.findFirst({
    where: { clientId: id },
    include: {
      parties: {
        include: {
          kycCase: { include: { latestScreeningRun: { include: { hits: true } } } },
        },
      },
      reviewTasks: { where: { state: "open" }, include: { assignedTo: true } },
    },
  });
  if (!file) notFound();
  if (!file.riskComputed) await recomputeAndStoreRisk(file.id, null);

  const overrideHistory = await prisma.activityLog.findMany({
    where: { entityType: "compliance_file", entityId: file.id, action: "compliance.risk_overridden" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: true },
  });

  return (
    <AdminShell active="clients">
      <ComplianceDashboard
        file={serialize(file, overrideHistory)}
        parentLink={`/admin/clients/${id}/compliance`}
      />
    </AdminShell>
  );
}

function serialize(f: any, overrideHistory: any[] = []) {
  return {
    ...f,
    signedOffAt: f.signedOffAt?.toISOString() ?? null,
    parties: f.parties.map((p: any) => ({
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
    reviewTasks: f.reviewTasks.map((t: any) => ({
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
  };
}
