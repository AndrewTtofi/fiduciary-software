"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ClientTab } from "./tabs";

const TABS: { key: ClientTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "services", label: "Services" },
  { key: "documents", label: "Documents" },
  { key: "conversation", label: "Conversation" },
  { key: "activity", label: "Activity" },
];

export function ClientTabs({ active }: { active: ClientTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(tab: ClientTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      className="flex gap-8 mb-10 border-b"
      style={{ borderColor: "var(--admin-border)" }}
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            className={`relative pb-4 font-mono text-[11px] tracking-[0.22em] uppercase transition-colors duration-500 ${
              isActive ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            <span
              aria-hidden
              className={`absolute -bottom-px left-0 right-0 h-px transition-transform duration-500 origin-left ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
              style={{ background: "var(--accent)" }}
            />
          </button>
        );
      })}
    </div>
  );
}

