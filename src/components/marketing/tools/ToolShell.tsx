import type { ReactNode } from "react";
import Link from "next/link";
import type { Tool } from "@/lib/data/tools";
import { correctAsAtLabel } from "@/lib/services/tool-settings";

/** Shared frame for every tool page: eyebrow, the question as H1, the
 *  "Updated <year>" badge with the "correct as at" date, the tool itself,
 *  and the estimate line every tool carries. No email gate anywhere — the
 *  answer comes first. */
export function ToolShell({
  tool,
  taxYear,
  correctAsAt,
  intro,
  children,
  aside,
  wide,
}: {
  tool: Tool;
  taxYear: number;
  correctAsAt: string;
  intro?: ReactNode;
  children: ReactNode;
  /** Optional column beside the tool (required wording, explanations). */
  aside?: ReactNode;
  /** Let the tool use the full container width — for the jurisdiction
   *  comparison, whose eight-column table scrolled inside the 820px card. */
  wide?: boolean;
}) {
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">Free tool</span>
          <h1>{tool.h1}</h1>
          <div className="tool-badges">
            <span className="tool-badge">Updated {taxYear}</span>
            <span className="tool-asat">Correct as at {correctAsAtLabel(correctAsAt)}</span>
          </div>
          {intro && <p className="sub">{intro}</p>}
        </div>
      </section>
      <section className="ivory sec" style={{ paddingTop: 56 }}>
        <div className={`mk-container${aside ? " calc-grid" : ""}`} style={aside || wide ? undefined : { maxWidth: 820 }}>
          {aside && <div className="tool-aside">{aside}</div>}
          <div>{children}</div>
        </div>
      </section>
      <section className="ivory" style={{ paddingBottom: 56 }}>
        <div className="mk-container" style={{ maxWidth: 820 }}>
          <p className="fine" style={{ fontSize: ".8rem", color: "var(--mk-grey)" }}>
            This tool gives an estimate, not advice. It uses the {taxYear} rates and rules as we
            understand them at the date shown; your own position depends on facts a calculator
            cannot see, and is confirmed on a call.{" "}
            <Link href="/tools" className="link-gold">All tools →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
