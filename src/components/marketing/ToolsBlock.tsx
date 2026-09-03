import Link from "next/link";
import { getFeaturedTools } from "@/lib/services/tools-enabled";

/** Homepage tools block — four compact cards, each linking to its own tool
 *  page, in the space freed by deleting the duplicated hero. Lists only the
 *  tools this deployment has enabled; renders nothing when there are none. */
export async function ToolsBlock() {
  const featured = await getFeaturedTools();
  if (featured.length === 0) return null;
  return (
    <section className="sec-tight tools-home">
      <div className="mk-container">
        <div className="tools-home-head">
          <div>
            <span className="kicker">Free tools</span>
            <h2>Work out where you stand</h2>
          </div>
          <Link href="/tools" className="ins4-all">
            All tools
            <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
        <div className="tools4">
          {featured.map((t) => (
            <Link key={t.key} href={`/tools/${t.slug}`} className="tool-card">
              <span className="tool-name">{t.name}</span>
              <h3>{t.h1}</h3>
              <span className="tool-go">Open the tool →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
