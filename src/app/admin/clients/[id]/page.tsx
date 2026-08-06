import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { getBranding, tierAtLeast } from "@/lib/services/branding";
import { getServices, getStageLabels } from "@/lib/services/settings";
import { Role } from "@prisma/client";
import { listThread } from "@/lib/services/messages";
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
import { ChecklistCard } from "./ChecklistCard";
import { getClientChecklist } from "@/lib/services/client-checklist";
import { ClientTabs } from "./ClientTabs";
import { tabFromParam } from "./tabs";
import { ConversationView } from "./ConversationView";
import { ConversationPreview } from "./ConversationPreview";
import { getClientLoginEnabled } from "@/lib/services/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client profile" };

export default async function ClientProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole("staff");
  const { id } = await params;
  const sp = await searchParams;
  // Starter runs a plain status tracker: no compliance file, no document
  // workspace, no document requests — those surfaces disappear entirely.
  const { planTier } = await getBranding();
  const fullWorkspace = tierAtLeast(planTier, "professional");
  const requested = tabFromParam(sp.tab);
  const portalOn = await getClientLoginEnabled();
  const tab = !fullWorkspace && requested === "documents" ? "overview" : requested;

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
  const staff = await prisma.user.findMany({ where: { role: Role.staff, deactivatedAt: null }, select: { id: true, fullName: true } });
  // Use getServices() (not a raw query) so the taxonomy lazily seeds when empty —
  // otherwise service folders fall back to raw snake_case keys.
  const taxonomy = (await getServices({ activeOnly: true })).map((s) => ({ key: s.key, label: s.label }));
  const stageLabels = await getStageLabels();

  const messages = await listThread(client.id);
  const checklist = await getClientChecklist(client.id);

  const initials = client.user.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  // ── Sidebar (sticks across all tabs) ─────────────────────────
  const sidebar = (
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
      <QuickActions clientId={client.id} showRequestDocs={fullWorkspace} />
      <ChecklistCard
        clientId={client.id}
        initial={checklist.map((c) => ({ id: c.id, label: c.label, done: c.done }))}
      />
    </div>
  );

  return (
    <AdminClientShell breadcrumb={client.user.fullName}>
      {/* ── Header (always visible) ───────────────────────────── */}
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

      {fullWorkspace && (
        <ComplianceBar
          clientId={client.id}
          status={client.complianceFile?.status ?? null}
          riskRating={client.complianceFile?.riskRating ?? null}
        />
      )}

      <ClientTabs active={tab} showDocuments={fullWorkspace} />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-start max-w-[1240px]">
        {/* ── Tab body ──────────────────────────────────────── */}
        <div>
          {tab === "overview" && (
            <div className="flex flex-col gap-8">
              <KeyDatesSection
                clientId={client.id}
                rows={client.keyDates.slice(0, 4).map((kd) => ({
                  id: kd.id,
                  clientId: client.id,
                  description: kd.description,
                  dueDate: kd.dueDate.toISOString(),
                  status: kd.status,
                }))}
              />
              <ConversationPreview clientId={client.id} messages={messages} portalOn={portalOn} />
            </div>
          )}

          {tab === "services" && (
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
              stageLabels={stageLabels}
            />
          )}

          {tab === "documents" && fullWorkspace && (
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
          )}

          {tab === "conversation" && (
            <ConversationView
              clientId={client.id}
              clientName={client.user.fullName}
              messages={messages}
              portalOn={portalOn}
            />
          )}

          {tab === "activity" && (
            <div className="flex flex-col gap-8">
              <ClientActivity
                entries={activity.map((a) => ({
                  id: a.id,
                  action: a.action,
                  actor: a.actor?.fullName ?? "System",
                  createdAt: a.createdAt.toISOString(),
                }))}
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
            </div>
          )}
        </div>

        {/* Sidebar — hidden on conversation tab (the thread takes the full width) */}
        {tab !== "conversation" && sidebar}
      </div>
    </AdminClientShell>
  );
}
