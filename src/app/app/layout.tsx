import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getClientLoginEnabled } from "@/lib/services/settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth + role check is enforced by middleware; we still trigger the auth call so
  // server components can rely on it being cached for the request.
  const user = await requireUser();
  // Portal off-switch: existing client sessions lose portal access the moment
  // client login is disabled — consultation booking is the only public path.
  if ((user.role === "client" || user.role === "prospect") && !(await getClientLoginEnabled())) {
    redirect("/contact");
  }
  return <>{children}</>;
}
