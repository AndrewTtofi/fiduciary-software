import Link from "next/link";
import { signOut } from "@/lib/auth";

type AdminTab = "submissions" | "bookings" | "clients" | "users" | "compliance" | "analytics" | "content" | "settings";

export function AdminShell({
  children,
  active,
  search,
  topRight,
}: {
  children: React.ReactNode;
  active: AdminTab;
  search?: { placeholder: string };
  topRight?: React.ReactNode;
}) {
  return (
    <div className="shell-admin min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* ─── Side rail ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col gap-12 px-7 py-9 text-bone relative"
        style={{
          background: "linear-gradient(180deg, #1A1612 0%, #221C15 100%)",
        }}
      >
        {/* Brand mark */}
        <Link href="/admin" className="group block">
          <div className="font-display text-[26px] leading-none tracking-[-0.02em] text-accent">
            ORO
          </div>
          <div className="mt-2 font-mono text-[9.5px] tracking-[0.32em] uppercase text-bone/45">
            Private&nbsp;·&nbsp;Counsel
          </div>
          <div
            className="mt-5 h-px w-12 origin-left transition-transform duration-700 ease-out-expo group-hover:scale-x-[2.2]"
            style={{ background: "linear-gradient(90deg, #B08D3E 0%, transparent 100%)" }}
          />
        </Link>

        {/* Nav — capitalised serif eyebrow + grouped items */}
        <nav className="flex flex-col gap-7 flex-1">
          <NavGroup label="Pipeline">
            <NavLink href="/admin/submissions" label="Submissions" active={active === "submissions"} />
            <NavLink href="/admin/bookings" label="Bookings" active={active === "bookings"} />
          </NavGroup>
          <NavGroup label="Engagements">
            <NavLink href="/admin/clients" label="Clients" active={active === "clients"} />
            <NavLink href="/admin/compliance/tasks" label="Compliance" active={active === "compliance"} />
          </NavGroup>
          <NavGroup label="Firm">
            <NavLink href="/admin/users" label="Users" active={active === "users"} />
            <NavLink href="/admin/analytics" label="Analytics" active={active === "analytics"} />
            <NavLink href="/admin/content" label="Content" active={active === "content"} />
          </NavGroup>
        </nav>

        <div className="flex flex-col gap-1 pt-6 border-t border-bone/10">
          <NavLink href="/admin/settings" label="Settings" active={active === "settings"} />
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button
              type="submit"
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-[12px] tracking-[0.04em] uppercase font-medium text-bone/45 hover:text-oxblood transition-colors duration-500"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Subtle gold hairline at the right edge of the rail */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-px h-full opacity-30"
          style={{ background: "linear-gradient(180deg, transparent 0%, #B08D3E 35%, #B08D3E 65%, transparent 100%)" }}
        />
      </aside>

      {/* ─── Main column ─────────────────────────────────────────── */}
      <div className="flex flex-col min-w-0">
        <header
          className="h-[72px] flex items-center justify-between px-10 shrink-0"
          style={{
            background: "var(--admin-surface)",
            boxShadow: "0 1px 0 rgba(229,221,201,0.6)",
          }}
        >
          {search ? (
            <div className="relative w-[360px]">
              <svg
                aria-hidden
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                className="w-full pl-10 pr-3 py-2.5 text-[13px] italic placeholder:not-italic placeholder:text-admin-muted/70"
                style={{
                  background: "transparent",
                  border: "1px solid transparent",
                  borderBottom: "1px solid var(--admin-border)",
                  borderRadius: 0,
                  outline: "none",
                }}
                placeholder={search.placeholder}
              />
            </div>
          ) : <span />}
          {topRight ?? (
            <div
              className="w-10 h-10 grid place-items-center font-mono text-[11px] tracking-[0.1em] uppercase"
              style={{
                background: "var(--ink)",
                color: "var(--accent)",
                borderRadius: "999px",
                boxShadow: "0 0 0 1px rgba(176,141,62,0.4), 0 8px 24px -8px rgba(60,40,16,0.3)",
              }}
            >
              JD
            </div>
          )}
        </header>
        <main className="px-10 py-12 flex-1 overflow-y-auto page-enter">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="px-3 mb-2 font-mono text-[9.5px] tracking-[0.28em] uppercase text-bone/35">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium tracking-[0.005em] transition-colors duration-500 ${
        active ? "text-bone" : "text-bone/55 hover:text-bone"
      }`}
    >
      {/* Gold tick on the left when active */}
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] origin-center transition-all duration-500 ${
          active ? "h-5 opacity-100" : "h-0 opacity-0"
        }`}
        style={{ background: "#B08D3E" }}
      />
      <span className="relative">
        {label}
        <span
          aria-hidden
          className={`absolute -bottom-0.5 left-0 right-0 h-px transition-transform duration-500 origin-left ${
            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
          style={{ background: "rgba(176,141,62,0.5)" }}
        />
      </span>
    </Link>
  );
}
