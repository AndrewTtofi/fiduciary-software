import Link from "next/link";
import { signOut } from "@/lib/auth";

interface NavItem { label: string; href: string; locked?: boolean }

export function ClientShell({
  children,
  active,
  approved,
}: {
  children: React.ReactNode;
  active: "dashboard" | "application" | "messages" | "documents" | "booking" | "settings";
  approved: boolean;
}) {
  const nav: NavItem[] = [
    { label: "Overview", href: "/app/dashboard" },
    { label: "My File", href: "/app/application" },
    { label: "Correspondence", href: "/app/messages" },
    { label: "Documents", href: "/app/documents" },
    { label: "Consultation", href: "/app/booking", locked: !approved },
  ];

  return (
    <div className="shell-client min-h-screen grid grid-cols-1 lg:grid-cols-[280px_1fr]">
      {/* ─── Side rail ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col gap-12 px-8 py-10 text-bone relative"
        style={{
          background: "linear-gradient(180deg, #1A1612 0%, #221C15 100%)",
        }}
      >
        <Link href="/app/dashboard" className="group block">
          <div className="font-display text-[28px] leading-none tracking-[-0.02em] text-accent">
            ORO
          </div>
          <div className="mt-2 font-mono text-[9.5px] tracking-[0.32em] uppercase text-bone/45">
            Client Portal
          </div>
          <div
            className="mt-5 h-px w-12 origin-left transition-transform duration-700 ease-out-expo group-hover:scale-x-[2.2]"
            style={{ background: "linear-gradient(90deg, #B08D3E 0%, transparent 100%)" }}
          />
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((n) => {
            const isActive = active === routeKey(n.href);
            const base =
              "group relative flex items-center gap-3 px-3 py-3 text-[13px] font-medium tracking-[0.005em] transition-colors duration-500";
            const tone = isActive
              ? "text-bone"
              : n.locked
              ? "text-bone/25 cursor-not-allowed"
              : "text-bone/55 hover:text-bone";

            const inner = (
              <>
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] origin-center transition-all duration-500 ${
                    isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                  }`}
                  style={{ background: "#B08D3E" }}
                />
                <span className="relative">
                  {n.label}
                  {n.locked && (
                    <span
                      className="ml-2 font-mono text-[9px] tracking-[0.2em] uppercase opacity-60"
                      aria-hidden
                    >
                      Locked
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={`absolute -bottom-0.5 left-0 right-0 h-px transition-transform duration-500 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    style={{ background: "rgba(176,141,62,0.5)" }}
                  />
                </span>
              </>
            );

            return n.locked ? (
              <span key={n.href} className={`${base} ${tone}`} aria-disabled>{inner}</span>
            ) : (
              <Link
                key={n.href}
                href={n.href}
                className={`${base} ${tone}`}
                aria-current={isActive ? "page" : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 pt-6 border-t border-bone/10">
          <Link
            href="/app/settings"
            className={`group relative flex items-center px-3 py-3 text-[13px] font-medium transition-colors duration-500 ${
              active === "settings" ? "text-bone" : "text-bone/55 hover:text-bone"
            }`}
          >
            <span
              aria-hidden
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] origin-center transition-all duration-500 ${
                active === "settings" ? "h-5 opacity-100" : "h-0 opacity-0"
              }`}
              style={{ background: "#B08D3E" }}
            />
            Settings
          </Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button
              type="submit"
              className="w-full text-left px-3 py-3 text-[12px] tracking-[0.04em] uppercase font-medium text-bone/45 hover:text-oxblood transition-colors duration-500"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Right hairline */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-px h-full opacity-30"
          style={{ background: "linear-gradient(180deg, transparent 0%, #B08D3E 35%, #B08D3E 65%, transparent 100%)" }}
        />
      </aside>

      <main className="px-6 lg:px-20 py-14 overflow-y-auto page-enter">{children}</main>
    </div>
  );
}

function routeKey(href: string): "dashboard" | "application" | "messages" | "documents" | "booking" | "settings" {
  if (href.includes("dashboard")) return "dashboard";
  if (href.includes("application")) return "application";
  if (href.includes("messages")) return "messages";
  if (href.includes("documents")) return "documents";
  if (href.includes("booking")) return "booking";
  return "settings";
}
