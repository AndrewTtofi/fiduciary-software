import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { TeamTable } from "./TeamTable";

export const metadata = { title: "Team · Settings" };
export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const me = await requireRole("staff");
  const members = await prisma.user.findMany({
    where: { role: { in: ["staff", "partner"] } },
    select: { id: true, email: true, fullName: true, role: true, deactivatedAt: true, createdAt: true },
    orderBy: [{ deactivatedAt: "asc" }, { createdAt: "desc" }],
  });
  return (
    <TeamTable
      currentUserId={me.id}
      initial={members.map((m) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName,
        role: m.role as "staff" | "partner",
        deactivatedAt: m.deactivatedAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
