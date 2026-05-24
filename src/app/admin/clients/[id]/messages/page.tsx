import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// The dedicated /messages route now redirects into the unified Conversation tab
// on the client detail page so there is one canonical surface for correspondence.
export default async function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("staff");
  const { id } = await params;
  const exists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!exists) notFound();
  redirect(`/admin/clients/${id}?tab=conversation`);
}
