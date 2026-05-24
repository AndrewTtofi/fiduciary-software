import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { Role } from "@prisma/client";
import { AdminClientShell } from "./AdminClientShell";
import { EditableClientHeader } from "./EditableClientHeader";
import { ComplianceBar } from "./ComplianceBar";
import { ServicesEngagedList } from "./ServicesEngagedList";
import { KeyDatesSection } from "./KeyDatesSection";
import { DocumentsSection } from "./DocumentsSection";
import { ClientStatusPanel } from "./ClientStatusPanel";
import { ClientNotes } from "./ClientNotes";
import { ClientActivity } from "./ClientActivity";
import { QuickActions } from "./QuickActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client profile" };

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("staff");
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: true,
      primaryStaff: true,
      services: { include: { assignedPartner: true } },
      keyDates: { orderBy: { dueDate: "asc" } },
      internalNotes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      prospect: { include: { documents: true } },
      complianceFile: { select: { status: true, riskRating: true } },
      documentRequests: true,
    },
  });
  if (!client) notFound();

  const activity = await prisma.activityLog.findMany({
    where: { OR: [{ entityType: "client", entityId: client.id }, { entityType: "prospect", entityId: client.prospectId }] },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { actor: true },
  });

  const partners = await prisma.user.findMany({ where: { role: Role.partner, deactivatedAt: null }, select: { id: true, fullName: true } });
  const staff    = await prisma.user.findMany({ where: { role: Role.staff,   deactivatedAt: null }, select: { id: true, fullName: true } });
  const taxonomy = await prisma.service.findMany({ where: { active: true }, select: { key: true, label: true }, orderBy: { sortOrder: "asc" } });

  const initials = client.user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AdminClientShell breadcrumb={client.user.fullName}>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] items-start max-w-[1200px]">
        <div>
          <EditableClientHeader
            clientId={client.id}
            initials={initials}
            name={client.user.fullName}
            reference={client.prospect.referenceNumber}
            since={client.createdAt.toISOString()}
            email={client.user.email}
            initial={{
              companyName: client.companyName,
              country: client.country,
              address: client.address,
              registrationNumber: client.registrationNumber,
              vatNumber: client.vatNumber,
              taxResidency: client.taxResidency,
              engagementLetterDate: client.engagementLetterDate?.toISOString() ?? null,
              phone: client.user.phone,
            }}
          />

          <ComplianceBar clientId={client.id} status={client.complianceFile?.status ?? null} riskRating={client.complianceFile?.riskRating ?? null} />

          <ServicesEngagedList
            clientId={client.id}
            rows={client.services.map((s) => ({
              id: s.id,
              clientId: client.id,
              serviceType: s.serviceType,
              status: s.status,
              assignedPartnerId: s.assignedPartnerId,
              startDate: s.startDate?.toISOString() ?? null,
              notes: s.notes,
            }))}
            partners={partners}
            taxonomy={taxonomy}
          />

          <KeyDatesSection
            clientId={client.id}
            rows={client.keyDates.map((kd) => ({
              id: kd.id,
              clientId: client.id,
              description: kd.description,
              dueDate: kd.dueDate.toISOString(),
              status: kd.status,
            }))}
          />

          <DocumentsSection
            clientId={client.id}
            services={client.services.map((s) => ({ serviceType: s.serviceType }))}
            taxonomy={taxonomy}
            documents={client.prospect.documents.map((d) => ({
              id: d.id,
              originalName: d.originalName,
              mime: d.mime,
              sizeBytes: d.sizeBytes,
              status: d.status,
              uploadedAt: d.uploadedAt.toISOString(),
              serviceTypeKey: d.serviceTypeKey,
              purpose: d.purpose,
              partyId: d.partyId,
            }))}
            requests={client.documentRequests.map((r) => ({
              id: r.id,
              description: r.description,
              serviceTypeKey: r.serviceTypeKey,
              dueAt: r.dueAt?.toISOString() ?? null,
              state: r.state,
            }))}
          />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <ClientStatusPanel
            clientId={client.id}
            status={client.status}
            primaryStaff={{ id: client.primaryStaff.id, name: client.primaryStaff.fullName, role: "Primary Contact / Partner" }}
            extras={Array.from(
              new Map(
                client.services
                  .filter((s) => s.assignedPartner && s.assignedPartner.id !== client.primaryStaff.id)
                  .map((s) => [s.assignedPartner!.id, { id: s.assignedPartner!.id, name: s.assignedPartner!.fullName, role: "Assigned Partner" }]),
              ).values(),
            )}
            staff={staff}
          />
          <ClientNotes
            clientId={client.id}
            initial={client.internalNotes.map((n) => ({
              id: n.id,
              author: n.author.fullName,
              body: n.body,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
          <ClientActivity
            entries={activity.map((a) => ({
              id: a.id,
              action: a.action,
              actor: a.actor?.fullName ?? "System",
              createdAt: a.createdAt.toISOString(),
            }))}
          />
          <QuickActions clientId={client.id} />
        </div>
      </div>
    </AdminClientShell>
  );
}
