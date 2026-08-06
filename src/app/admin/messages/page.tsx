import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Flag } from "@/components/admin/Flag";
import { ConversationView } from "@/app/admin/clients/[id]/ConversationView";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { listThread } from "@/lib/services/messages";
import { PortalOffNotice } from "@/components/admin/PortalOffNotice";
import { getClientLoginEnabled } from "@/lib/services/settings";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireRole("staff");
  const sp = await searchParams;
  const portalOn = await getClientLoginEnabled();

  const clients = await prisma.client.findMany({
    include: {
      user: { select: { fullName: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  // Most-recently-active threads first; clients with no messages sink to the bottom.
  clients.sort((a, b) => {
    const ta = a.messages[0]?.createdAt.getTime() ?? 0;
    const tb = b.messages[0]?.createdAt.getTime() ?? 0;
    return tb - ta;
  });

  const selectedId = sp.c ?? clients[0]?.id ?? null;
  const selected = clients.find((c) => c.id === selectedId) ?? null;
  const thread = selected ? await listThread(selected.id) : [];

  return (
    <AdminShell active="messages">
      <PortalOffNotice what="nothing you write here reaches them — it is recorded for your own history only." />
      <div className="mb-8">
        <div className="eyebrow mb-2">{portalOn ? "Client inbox" : "Email correspondence"}</div>
        <h2 style={{ fontSize: "var(--fs-h3)", fontWeight: 700, letterSpacing: "-0.02em" }}>{portalOn ? "Messages" : "Client emails"}</h2>
      </div>

      {clients.length === 0 ? (
        <div className="empty"><h3>No client conversations yet</h3><p>Once a prospect is converted to a client, your conversation appears here.</p></div>
      ) : (
        <div className="tbl-wrap" style={{ padding: 0, overflow: "hidden" }}>
          <div className="msg-grid">
            {/* Thread list */}
            <div className="msg-list">
              {clients.map((c) => {
                const last = c.messages[0];
                const active = c.id === selectedId;
                const initials = c.user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <Link key={c.id} href={`/admin/messages?c=${c.id}`} className={`row${active ? " active" : ""}`}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="row" style={{ gap: 6, fontWeight: 600, fontSize: "var(--fs-sm)" }}>
                        <span>{c.user.fullName}</span>
                        {c.country && <Flag country={c.country} />}
                      </div>
                      <div className="muted" style={{ fontSize: "var(--fs-xs)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {last ? last.body : "No messages yet"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Conversation */}
            <div className="msg-main">
              {selected ? (
                <ConversationView clientId={selected.id} clientName={selected.user.fullName} messages={thread} portalOn={portalOn} />
              ) : (
                <div className="empty"><h3>Select a conversation</h3><p>Pick a client on the left to view the thread.</p></div>
              )}
            </div>

          </div>
        </div>
      )}
    </AdminShell>
  );
}
