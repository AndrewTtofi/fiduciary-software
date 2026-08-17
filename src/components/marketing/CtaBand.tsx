import Link from "next/link";
import { getSiteContent } from "@/lib/services/content";
import { GoldHeading, WhatsAppButton, telLink, waLink } from "@/components/marketing/mk";

/** Closing call-to-action band (every page). Reduced height, no eyebrow —
 *  this is the end of the page, not the start — gold booking button with the
 *  outline WhatsApp button beside it, and the phone numbers on one line
 *  below the buttons so they do not read as part of the heading.
 *  `heading`/`body` override the content-managed default. */
export async function CtaBand({
  heading,
  body,
}: {
  heading?: string;
  body?: string;
}) {
  const { cta, contact } = await getSiteContent();
  return (
    <section className="final">
      <div className="wrap-in">
        <h2><GoldHeading text={heading ?? cta.heading} /></h2>
        <p>{body ?? cta.body}</p>
        <div className="final-btns">
          <Link href="/book" className="pill">{cta.button}</Link>
          <WhatsAppButton number={contact.whatsapp} />
        </div>
        {(contact.phone || contact.whatsapp) && (
          <div className="phones">
            {contact.phone && <a href={telLink(contact.phone)}>Phone {contact.phone}</a>}
            {contact.whatsapp && <a href={waLink(contact.whatsapp)}>WhatsApp {contact.whatsapp}</a>}
          </div>
        )}
      </div>
    </section>
  );
}
