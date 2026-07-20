import Link from "next/link";
import { getSiteContent } from "@/lib/services/content";
import { ArrowIc, GoldHeading, telLink, waLink } from "@/components/marketing/mk";

/** Dark rounded CTA band with the firm's phone lines and a booking CTA.
 *  `heading` overrides the content-managed default ("Discuss X with us"). */
export async function CtaBand({
  heading,
  body,
  onWhite = false,
}: {
  heading?: string;
  body?: string;
  onWhite?: boolean;
}) {
  const { cta, contact } = await getSiteContent();
  return (
    <div className={`band-wrap${onWhite ? " on-white" : ""}`}>
      <div className="mk-container">
        <div className="band grid-bg reveal">
          <h2><GoldHeading text={heading ?? cta.heading} /></h2>
          {(contact.phone || contact.whatsapp) && (
            <div className="phones">
              {contact.phone && <a href={telLink(contact.phone)}>{contact.phone}</a>}
              {contact.whatsapp && (
                <a href={waLink(contact.whatsapp)}>{contact.whatsapp} (WhatsApp)</a>
              )}
            </div>
          )}
          <p>{body ?? cta.body}</p>
          <Link href="/contact" className="pill" style={{ marginTop: 30 }}>
            {cta.button} {ArrowIc}
          </Link>
        </div>
      </div>
    </div>
  );
}
