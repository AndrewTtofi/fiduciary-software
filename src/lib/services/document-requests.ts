import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export interface CreateRequestInput {
  description: string;
  serviceTypeKey?: string | null;
  dueAt?: string | null;
}

export async function createDocumentRequest(clientId: string, input: CreateRequestInput, requestedById: string) {
  const created = await prisma.documentRequest.create({
    data: {
      clientId,
      requestedById,
      description: input.description,
      serviceTypeKey: input.serviceTypeKey ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    },
  });
  await logActivity({
    entityType: "doc_request", entityId: created.id,
    action: "doc_request.created", actorId: requestedById,
    meta: { clientId, description: input.description },
  });
  return created;
}

export async function updateDocumentRequest(
  requestId: string,
  patch: { description?: string; dueAt?: string | null },
  actorId: string,
) {
  const req = await prisma.documentRequest.findUnique({ where: { id: requestId }, select: { state: true, clientId: true } });
  if (!req) throw new Error("Request not found");
  if (req.state !== "open") throw new Error("Only open requests can be edited");

  const data: { description?: string; dueAt?: Date | null } = {};
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.dueAt !== undefined) data.dueAt = patch.dueAt ? new Date(patch.dueAt) : null;

  await prisma.documentRequest.update({ where: { id: requestId }, data });
  await logActivity({
    entityType: "doc_request", entityId: requestId,
    action: "doc_request.updated", actorId,
    meta: { clientId: req.clientId, ...patch },
  });
}

export async function cancelDocumentRequest(requestId: string, actorId: string) {
  const req = await prisma.documentRequest.findUnique({ where: { id: requestId }, select: { state: true, clientId: true } });
  if (!req) throw new Error("Request not found");
  if (req.state === "fulfilled") throw new Error("Cannot cancel a fulfilled request");
  await prisma.documentRequest.update({ where: { id: requestId }, data: { state: "cancelled" } });
  await logActivity({
    entityType: "doc_request", entityId: requestId,
    action: "doc_request.cancelled", actorId,
    meta: { clientId: req.clientId },
  });
}
