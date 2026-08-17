import Link from "next/link";
import type { Step } from "@/lib/services/content";

/** "How it works" — the dark navy band that replaced the positioning strip
 *  and the repeated statistics cards. Reduced height, three numbered
 *  columns, one centred gold button beneath. */
export function HowItWorks({ heading, sub, steps, button }: { heading: string; sub: string; steps: Step[]; button: string }) {
  return (
    <section className="how" id="how-it-works">
      <div className="mk-container">
        <div className="how-head">
          <h2>{heading}</h2>
          <p>{sub}</p>
        </div>
        <div className="how-cols">
          {steps.map((s, i) => (
            <div className="how-col" key={i}>
              <span className="n">0{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 34 }}>
          <Link href="/book" className="pill">{button}</Link>
        </div>
      </div>
    </section>
  );
}
