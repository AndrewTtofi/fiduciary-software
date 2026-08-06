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

export function ClientTabs({ active, showDocuments = true, portalOn = true }: {
  active: ClientTab; showDocuments?: boolean;
  /** Messages still reach the client by email with the portal off, so the tab
   *  stays — but "Conversation" implies a two-way thread they can open. */
  portalOn?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabs = (showDocuments ? TABS : TABS.filter((t) => t.key !== "documents"))
    .map((t) => (t.key === "conversation" && !portalOn ? { ...t, label: "Emails" } : t));

  function go(tab: ClientTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="chips mb-10">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            className={`chip ${isActive ? "active" : ""}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

