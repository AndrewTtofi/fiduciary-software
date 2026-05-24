import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

export function AdminClientShell({
  breadcrumb,
  children,
}: {
  breadcrumb: string;
  children: React.ReactNode;
}) {
  return (
    <AdminShell active="clients">
      <nav className="flex items-center gap-3 mb-8 font-mono text-[10px] tracking-[0.22em] uppercase">
        <Link
          href="/admin/clients"
          className="link-gold text-muted hover:text-ink"
        >
          Clients
        </Link>
        <span className="text-muted/50">/</span>
        <span className="text-ink truncate max-w-[420px]">{breadcrumb}</span>
      </nav>
      {children}
    </AdminShell>
  );
}
