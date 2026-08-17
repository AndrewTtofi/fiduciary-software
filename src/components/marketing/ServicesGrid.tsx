import Link from "next/link";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";

/** Static grid of the eight service cards, four across and two down: equal
 *  size, no rotation, no blur, no arrows, no dots — every card readable
 *  without clicking through. Keeps the navy header block, the gold number
 *  badge and the icon from the previous card design; every card links to
 *  its own service page via "Learn more". */
export function ServicesGrid() {
  return (
    <div className="svc8">
      {SERVICES.map((s, i) => (
        <Link key={s.key} href={`/services/${s.key}`} className="svc8-card">
          <div className="svc8-top">
            <span className="svc8-tag">0{i + 1}</span>
            <span className="svc8-ic">{ServiceIcons[s.key]}</span>
          </div>
          <div className="svc8-body">
            <h3>{s.title}</h3>
            <p>{s.blurb}</p>
            <span className="svc8-cta">
              Learn more{" "}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
