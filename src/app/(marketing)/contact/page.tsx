import Link from "next/link";
import { getBranding } from "@/lib/services/branding";
import { getSiteContent } from "@/lib/services/content";
import { listPublicSlots } from "@/lib/services/booking";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { telLink, waLink } from "@/components/marketing/mk";
import { ContactBookingForm } from "./ContactBookingForm";

export const metadata = { title: "Book Your Consultation" };

// Availability changes as bookings land — always render fresh.
export const dynamic = "force-dynamic";

/** The firm operates on Cyprus time; slot pills are labelled accordingly. */
const DISPLAY_TZ = "Europe/Nicosia";

export default async function ContactPage() {
  const [{ brandName }, { contact, consultation }, slotDates] = await Promise.all([
    getBranding(),
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
      <section className="phero grid-bg" style={{ paddingBottom: 40 }}>
        <div className="mk-container">
          <span className="kicker">Start here</span>
          <h1>Map Your Cyprus Structure in <span className="gold">30 Minutes</span></h1>
          <p className="sub">
            Tell us where you are today and where you want to be. We will show you the route,
            the timeline and what it involves, before you commit to anything.
          </p>
        </div>
      </section>
      <section>
        <div className="mk-container c-grid">
          <div className="c-info">
            {/* Short version of the Who Takes Your Call page, directly above the form */}
            <div className="form-card" style={{ marginBottom: 26 }}>
              <span className="kicker">{consultation.kicker}</span>
              <h2 style={{ fontSize: "1.4rem" }}>{consultation.personName}</h2>
              <p style={{ color: "var(--mk-grey)", fontSize: ".9rem", margin: "6px 0 0" }}>
                {consultation.personTitle}, {brandName}
              </p>
              <p className="body" style={{ fontSize: ".92rem" }}>{consultation.body}</p>
              <Link href="/your-consultation" style={{ color: "var(--mk-gold)", fontWeight: 600, fontSize: ".9rem" }}>
                Read who takes your call →
              </Link>
            </div>
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
          <ContactBookingForm slots={slots} inquiries={inquiries} underForm={consultation.underForm} />
        </div>
      </section>
    </main>
  );
}
