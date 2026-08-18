import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable, type DataRow } from "@/components/admin/DataTable";
import { requireRole } from "@/lib/auth/guards";
import { auth } from "@/lib/auth";
import { PortalOffNotice } from "@/components/admin/PortalOffNotice";
import { prisma } from "@/lib/db";
import { CreateUserForm } from "./CreateUserForm";
import { TeamManager, type Member } from "./TeamManager";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

/* Two different populations share the User table, and showing them in one
   undifferentiated list is what made this page confusing:
     • the firm's own people (staff)          — colleagues
     • portal logins (client, prospect)       — customers
   The engagement record for a customer lives under Clients; this page is only
   about the sign-in account, so client rows link across rather than restate it. */
type Tab = "team" | "logins";
const TEAM_ROLES = ["staff"] as const;

const ROLE_LABEL: Record<string, string> = {
  staff: "Staff", client: "Client", prospect: "Applicant",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole("staff");
  const session = await auth();
  const tab: Tab = (await searchParams).tab === "logins" ? "logins" : "team";

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, fullName: true, role: true,
      createdAt: true, deactivatedAt: true,
      clientAccount: { select: { id: true } },
      prospect: { select: { referenceNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const isTeam = (r: string) => (TEAM_ROLES as readonly string[]).includes(r);
  const team = users.filter((u) => isTeam(u.role));
  const logins = users.filter((u) => !isTeam(u.role));
  const shown = tab === "team" ? team : logins;

  const teamMembers: Member[] = team.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    deactivatedAt: u.deactivatedAt ? u.deactivatedAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  const rows: DataRow[] = shown.map((u) => ({
    key: u.id,
    sort: [u.fullName, u.email, ROLE_LABEL[u.role] ?? u.role, u.createdAt.getTime()],
    cells: [
      <div className="cell-entity" key="n">
        <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>{initialsOf(u.fullName)}</div>
        <span style={{ fontWeight: 600 }}>{u.fullName}</span>
      </div>,
      <span className="mono" style={{ fontSize: "var(--fs-xs)" }} key="e">{u.email}</span>,
      <span className="tag" key="r">{ROLE_LABEL[u.role] ?? u.role}</span>,
      <span className="mono muted" key="c">
        {u.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </span>,
      // Where the rest of this person's file lives, so nobody looks for an
      // engagement on the accounts page.
      u.clientAccount
        ? <Link href={`/admin/clients/${u.clientAccount.id}`} className="link-gold" key="l">Client record →</Link>
        : u.prospect
          ? <Link href={`/admin/submissions/${u.prospect.referenceNumber}`} className="link-gold" key="l">Submission →</Link>
          : <span className="muted" key="l">—</span>,
    ],
  }));

  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: "team", label: "Firm team", n: team.length },
    { key: "logins", label: "Client logins", n: logins.length },
  ];

  return (
    <AdminShell active="users">
      <div className="mb-6">
        <div className="eyebrow mb-2">Firm</div>
        <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>Users</h2>
        <p className="muted mt-2" style={{ fontSize: "var(--fs-sm)", maxWidth: "68ch", lineHeight: 1.6 }}>
          Sign-in accounts only. <strong>Firm team</strong> is the people who work here;{" "}
          <strong>Client logins</strong> are portal accounts for the people you act for — their
          engagements, documents and key dates live under <Link href="/admin/clients" className="link-gold">Clients</Link>.
        </p>
      </div>

      <div className="chips mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "team" ? "/admin/users" : `/admin/users?tab=${t.key}`}
            className={`chip${tab === t.key ? " active" : ""}`}
          >
            {t.label}<span className="chip-n">{t.n}</span>
          </Link>
        ))}
      </div>

      {tab === "team" ? (
        <TeamManager
          members={teamMembers}
          currentUserId={session?.user?.id ?? ""}
        />
      ) : (
        <>
          <PortalOffNotice what="these accounts cannot be used to sign in." />
          {/* This form only ever provisions client accounts. */}
          <CreateUserForm />
          <DataTable
            title="Client logins"
            count={shown.length}
            columns={[
              { label: "Name", sortable: true },
              { label: "Email", sortable: true },
              { label: "Role", sortable: true },
              { label: "Created", sortable: true },
              { label: "Their file" },
            ]}
            rows={rows}
            emptyTitle="No client logins yet"
            emptyBody="Create a client account above, or convert an approved submission from the Clients page."
          />
        </>
      )}
    </AdminShell>
  );
}

function initialsOf(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
