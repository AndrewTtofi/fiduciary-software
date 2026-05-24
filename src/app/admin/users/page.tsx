import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { VerifyButton } from "./VerifyButton";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole("staff");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: [{ emailVerified: "asc" }, { createdAt: "desc" }],
  });

  const unverifiedCount = users.filter((u) => !u.emailVerified).length;

  return (
    <AdminShell active="users">
      <div className="mb-8">
        <h1 className="font-display text-3xl flex items-center">
          Users
          <span className="ml-3 font-mono text-meta px-2 py-0.5 rounded border border-admin-border text-admin-muted bg-admin-bg">
            {users.length}
          </span>
        </h1>
        <p className="text-meta text-admin-muted mt-1">
          {unverifiedCount > 0
            ? `${unverifiedCount} account${unverifiedCount === 1 ? "" : "s"} awaiting email verification.`
            : "All accounts have verified emails."}
        </p>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-elem overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: "#FDFDFD" }}>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Verified</Th>
              <Th>Created</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-admin-border">
                <Td><span className="font-semibold text-dark">{u.fullName}</span></Td>
                <Td className="font-mono text-meta">{u.email}</Td>
                <Td className="capitalize">{u.role}</Td>
                <Td>
                  {u.emailVerified ? (
                    <span className="badge badge-approved">Verified</span>
                  ) : (
                    <span className="badge badge-pending">Pending</span>
                  )}
                </Td>
                <Td className="font-mono text-meta text-admin-muted">
                  {u.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </Td>
                <Td>{u.emailVerified ? <span className="text-admin-muted text-meta">—</span> : <VerifyButton userId={u.id} />}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-4 text-[11px] uppercase tracking-widest text-admin-muted font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-4 align-middle text-meta ${className}`}>{children}</td>;
}
