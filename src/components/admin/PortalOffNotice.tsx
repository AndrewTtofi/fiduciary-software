import Link from "next/link";
import { getClientLoginEnabled } from "@/lib/services/settings";
import { currentIsSuperAdmin } from "@/lib/auth/guards";

/* Several admin screens only matter if clients can sign in: messaging, the
   client dashboard, the status wording. With the portal switched off they kept
   working as though nothing had changed, which meant a staff member could send
   a message believing the client would read it in the portal when they never
   could. Renders nothing when the portal is on. */
export async function PortalOffNotice({ what }: { what: string }) {
  if (await getClientLoginEnabled()) return null;
  const superAdmin = await currentIsSuperAdmin();

  return (
    <div className="note mb-6" style={{ borderColor: "var(--st-wait-br)", background: "var(--st-wait-bg)" }}>
      <span>
        <strong>The client portal is switched off.</strong> Clients cannot sign in, so {what} You
        can still set this up ready for when it is turned back on
        {superAdmin
          ? <> — the switch is under <Link href="/admin/settings" className="link-gold">Settings → Organization</Link>.</>
          : <>; your platform operator controls the switch.</>}
      </span>
    </div>
  );
}
