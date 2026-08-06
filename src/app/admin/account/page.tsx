import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { AccountForms } from "./AccountForms";

export const metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const me = await requireRole("staff");
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { fullName: true, email: true, phone: true, role: true },
  });
  if (!user) return null;

  return (
    <AdminShell active="account">
      <div className="mb-6">
        <div className="eyebrow mb-2">You</div>
        <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>My account</h2>
        <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)", maxWidth: "62ch", lineHeight: 1.6 }}>
          Your own sign-in details. Change your password here after signing in with a
          one-time password for the first time.
        </p>
      </div>
      <AccountForms fullName={user.fullName} email={user.email} phone={user.phone} />
    </AdminShell>
  );
}
