import { prisma } from "@/lib/db";
import type { ClientStatus } from "@prisma/client";
import { logActivity } from "@/lib/services/activity";

export interface ClientProfilePatch {
  companyName?: string | null;
  country?: string | null;
  address?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  taxResidency?: string | null;
  engagementLetterDate?: string | null; // ISO date
  phone?: string | null; // proxied to User
}

export async function updateClientProfile(clientId: string, patch: ClientProfilePatch, actorId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (!client) throw new Error("Client not found");

  const clientData: Record<string, unknown> = {};
  for (const key of ["companyName", "country", "address", "registrationNumber", "vatNumber", "taxResidency"] as const) {
    if (patch[key] !== undefined) clientData[key] = patch[key];
  }
  if (patch.engagementLetterDate !== undefined) {
    clientData.engagementLetterDate = patch.engagementLetterDate ? new Date(patch.engagementLetterDate) : null;
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(clientData).length > 0) {
      await tx.client.update({ where: { id: clientId }, data: clientData });
    }
    if (patch.phone !== undefined) {
      await tx.user.update({ where: { id: client.userId }, data: { phone: patch.phone } });
    }
  });

  await logActivity({
    entityType: "client", entityId: clientId,
    action: "client.profile_updated", actorId,
    meta: { fieldsChanged: Object.keys({ ...clientData, ...(patch.phone !== undefined ? { phone: 1 } : {}) }) },
  });
}

export async function updatePrimaryStaff(clientId: string, primaryStaffId: string, actorId: string) {
  const target = await prisma.user.findUnique({ where: { id: primaryStaffId }, select: { role: true } });
  if (!target) throw new Error("Staff member not found");
  if (target.role !== "staff") throw new Error("New primary must be a staff user");

  await prisma.client.update({ where: { id: clientId }, data: { primaryStaffId } });
  await logActivity({
    entityType: "client", entityId: clientId,
    action: "client.primary_staff_changed", actorId,
    meta: { primaryStaffId },
  });
}

export async function updateClientStatus(clientId: string, status: ClientStatus, actorId: string) {
  await prisma.client.update({ where: { id: clientId }, data: { status } });
  await logActivity({
    entityType: "client", entityId: clientId,
    action: "client.status_changed", actorId,
    meta: { status },
  });
}
