import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { GoldHeading, telLink, waLink } from "@/components/marketing/mk";

/** Full-bleed final CTA (prototype-v2 ".final"): dark gradient, phone lines,
 *  booking CTA and the oversized closing wordmark that slides together as it
 *  scrolls into view (driven by MotionFx). `heading`/`body` override the
 *  content-managed default. `onWhite` is kept for call-site compatibility —
 *  the band is now full-bleed, so it has no effect. */
export async function CtaBand({
  heading,
  body,
}: {
  heading?: string;
  body?: string;
  onWhite?: boolean;
}) {
  const [{ brandName }, { cta, contact }] = await Promise.all([getBranding(), getSiteContent()]);
  // Closing wordmark letters: first word of the brand, uppercase (e.g. "ORO").
  const word = (brandName || "").trim().split(/\s+/)[0]?.toUpperCase().slice(0, 4) ?? "";
  return (
    <section className="final">
      <div className="wrap-in">
        <span className="kicker">Start here</span>
        <h2><GoldHeading text={heading ?? cta.heading} /></h2>
        {(contact.phone || contact.whatsapp) && (
          <div className="phones">
            {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
            {contact.whatsapp && <a href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>}
          </div>
        )}
        <p>{body ?? cta.body}</p>
        <Link href="/contact" className="pill" style={{ marginBottom: 28 }}>
          {cta.button}
        </Link>
      </div>
      {word.length > 1 && (
        <div className="wm" aria-hidden>
          {[...word].map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      )}
    </section>
  );
}
