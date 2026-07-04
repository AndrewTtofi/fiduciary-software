import { getSiteContent } from "@/lib/services/content";
import { listPublicSlots } from "@/lib/services/booking";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { telLink, waLink } from "@/components/marketing/mk";
import { ContactBookingForm } from "./ContactBookingForm";

export const metadata = { title: "Contact Us" };

// Availability changes as bookings land — always render fresh.
export const dynamic = "force-dynamic";

/** The firm operates on Cyprus time; slot pills are labelled accordingly. */
const DISPLAY_TZ = "Europe/Nicosia";

export default async function ContactPage() {
  const [{ contact }, slotDates] = await Promise.all([
    getSiteContent(),
    listPublicSlots(6).catch(() => [] as Date[]),
  ]);
  const slots = slotDates.map((d) => ({
    iso: d.toISOString(),
    label: d.toLocaleString("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: DISPLAY_TZ,
    }).replace(",", ""),
  }));
  const inquiries = SERVICES.map(({ key, title }) => ({ key, title }));

  return (
    <main>
      <section className="phero grid-bg" style={{ paddingBottom: 30 }}>
        <div className="mk-container">
          <span className="kicker">&mdash; Contact us</span>
          <h1>Let&apos;s Build Your <span className="gold">Structure</span></h1>
        </div>
      </section>
      <section>
        <div className="mk-container c-grid">
          <div className="c-info">
            <div className="c-photo" style={{ backgroundImage: "url(/marketing/pc-contact.jpg)" }} />
            <div className="c-meta">
              {contact.address && <div><b>Office:</b> {contact.address}</div>}
              {contact.phone && (
                <div><b>Phone:</b> <a href={telLink(contact.phone)}>{contact.phone}</a></div>
              )}
              {contact.whatsapp && (
                <div><b>WhatsApp:</b> <a href={waLink(contact.whatsapp)}>{contact.whatsapp}</a></div>
              )}
              {contact.email && (
                <div><b>Email:</b> <a href={`mailto:${contact.email}`}>{contact.email}</a></div>
              )}
            </div>
          </div>
          <ContactBookingForm slots={slots} inquiries={inquiries} />
        </div>
      </section>
    </main>
  );
}
