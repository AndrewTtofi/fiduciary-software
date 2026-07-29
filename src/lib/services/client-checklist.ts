import { prisma } from "@/lib/db";

/** Baseline items every engagement starts with. Staff can add or remove items
 *  per client; the defaults are seeded on first read so every case shows the
 *  same starting checklist. */
export const DEFAULT_CHECKLIST_ITEMS = ["Passport received", "Proof of address received"];

/** The staff-only checklist for a client, seeding the defaults when empty.
 *  Internal record-keeping — rendered only inside /admin, never to clients. */
export async function getClientChecklist(clientId: string) {
  const existing = await prisma.checklistItem.findMany({
    where: { clientId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (existing.length > 0) return existing;
  await prisma.checklistItem.createMany({
    data: DEFAULT_CHECKLIST_ITEMS.map((label, i) => ({ clientId, label, sortOrder: i })),
  });
  return prisma.checklistItem.findMany({
    where: { clientId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
