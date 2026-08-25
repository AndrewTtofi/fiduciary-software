import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getServerBranding } from "@/lib/services/branding-server";
import { getSiteContent, paragraphs } from "@/lib/services/content";
import { SERVICES, ServiceIcons } from "@/components/marketing/ServiceIcons";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ArrowIc, statutoryLine } from "@/components/marketing/mk";

export const metadata = { title: "About" };

/** About page (rebuilt per the review): how it started, how we work, what
 *  we do (the eight services), why clients stay, the people (names, titles
 *  and biographies — deliberately no photographs), where we are with the
 *  statutory details, then the standard closing band. All copy is
 *  content-managed under Admin → Content → About. */
export default async function AboutPage() {
  const [{ brandName }, { legalName }, { about, contact }] = await Promise.all([
    getBranding(),
    getServerBranding(),
    getSiteContent(),
  ]);
  const story = paragraphs(about.story.replaceAll("{brand}", brandName));
  const how = paragraphs(about.how);
  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <span className="kicker">About</span>
          <h1>About {brandName}</h1>
        </div>
      </section>

      <section className="ivory sec">
        <div className="mk-container about-grid">
          <div>
            <span className="kicker">How it started</span>
            <h2>Conversations that became a company</h2>
            {story.map((p, i) => <p className={i === 0 ? "lead" : "body"} key={i} style={{ marginTop: i === 0 ? 16 : 14 }}>{p}</p>)}
          </div>
          <div>
            <span className="kicker">How we work</span>
            <h2>Speed matters. Clarity matters more.</h2>
            {how.map((p, i) => <p className={i === 0 ? "lead" : "body"} key={i} style={{ marginTop: i === 0 ? 16 : 14 }}>{p}</p>)}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="mk-container">
          <span className="kicker">What we do</span>
          <h2>{about.whatWeDoIntro}</h2>
          <div className="about-services">
            {SERVICES.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`} className="about-svc">
                <span className="sic">{ServiceIcons[s.key]}</span>
                <span>{s.title}</span>
                {ArrowIc}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ivory sec">
        <div className="mk-container">
          <span className="kicker">Why clients stay</span>
          <h2>What you can count on</h2>
          <div className="feat-grid three">
            {about.why.map((f, i) => (
              <div className="feat" key={i}>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="mk-container">
          {about.people.length > 0 && (
            <>
              <span className="kicker">The people</span>
              <h2>Who you will be dealing with</h2>
              <div className="people">
                {about.people.map((p, i) => (
                  <div className="person" key={i}>
                    <b>{p.name}</b>
                    <span className="role">{p.title}</span>
                    {p.bio && <p>{p.bio}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="about-where">
            <span className="kicker">Where we are</span>
            {contact.address && <p className="lead">{contact.address}</p>}
            <p className="statutory">{statutoryLine(legalName, contact.regNo, contact.vatNo)}</p>
            <div className="final-btns" style={{ marginTop: 22, justifyContent: "flex-start" }}>
              <Link href="/contact" className="pill">Talk to us {ArrowIc}</Link>
              <Link href="/faq" className="pill ghost">Questions we get every week</Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
