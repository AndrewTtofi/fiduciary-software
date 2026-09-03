"use client";

import Link from "next/link";
import { useState } from "react";
import { TOOL_TABS, type Tool, type ToolTab } from "@/lib/data/tools";

/** Tools hub: category tabs filtering the tool cards. Every tool has its own
 *  page and URL; the hub only lists them. Receives the deployment's enabled
 *  tools from the server page — tabs with no tools in them are not shown. */
export function ToolsHub({ tools }: { tools: Tool[] }) {
  const [tab, setTab] = useState<ToolTab | "all">("all");
  const list = tab === "all" ? tools : tools.filter((t) => t.tab === tab);
  const tabs = TOOL_TABS.filter((t) => tools.some((x) => x.tab === t.key));
  return (
    <>
      <div className="ins-filters" role="tablist" aria-label="Tool categories">
        <button role="tab" aria-selected={tab === "all"} className={`ins-chip${tab === "all" ? " on" : ""}`} onClick={() => setTab("all")}>
          All tools
        </button>
        {tabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`ins-chip${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label} · {tools.filter((x) => x.tab === t.key).length}
          </button>
        ))}
      </div>
      <div className="tools-grid">
        {list.map((t) => (
          <Link key={t.key} href={`/tools/${t.slug}`} className="tool-card">
            <span className="tool-name">{t.name}</span>
            <h3>{t.h1}</h3>
            <p>{t.teaser}</p>
            <span className="tool-go">Open the tool →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
