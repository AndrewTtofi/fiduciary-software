import { getSiteContent } from "@/lib/services/content";
import { listPublicAvailability } from "@/lib/services/booking";
import { SERVICES } from "@/components/marketing/ServiceIcons";
import { telLink, waLink } from "@/components/marketing/mk";
import { ContactBookingForm } from "./ContactBookingForm";

export const metadata = {
  title: "Book Your Free 30-Minute Consultation",
  description: "Thirty minutes, no charge. Tell us where you are today and where you want to be, and pick a slot that suits you.",
};

// Availability changes as bookings land — always render fresh.
export const dynamic = "force-dynamic";

/** The four-step booking flow behind every "Book Your Free 30-Minute
 *  Consultation" button. The Contact page links here rather than carrying a
 *  second form (Contact spec, Part 3). */
export default async function BookPage() {
  const [{ contact }, slotDates] = await Promise.all([
    getSiteContent(),
    listPublicAvailability().catch(() => [] as Date[]),
  ]);
  const slots = slotDates.map((d) => d.toISOString());
  const inquiries = SERVICES.map(({ key, title }) => ({ key, title }));

  return (
    <main>
      <section className="phero phero-short">
        <div className="mk-container">
          <h1>Book Your Free <span className="gold">30-Minute Consultation</span></h1>
          <p className="sub">
            Tell us where you are today and where you want to be. We will show you the route,
            the timeline and what it involves, before you commit to anything.
          </p>
        </div>
      </section>
      <div className="book">
        <ContactBookingForm slots={slots} inquiries={inquiries} />
        <p style={{ textAlign: "center", fontSize: ".88rem", color: "var(--mk-grey)", marginTop: 22 }}>
          Prefer to talk first?{" "}
          {contact.phone && <a href={telLink(contact.phone)} style={{ color: "var(--mk-gold)", fontWeight: 600 }}>{contact.phone}</a>}
          {contact.phone && contact.whatsapp && " · "}
          {contact.whatsapp && (
            <a href={waLink(contact.whatsapp)} target="_blank" rel="noopener" style={{ color: "var(--mk-gold)", fontWeight: 600 }}>
              {contact.whatsapp} (WhatsApp)
            </a>
          )}
        </p>
      </div>
    </main>
  );
}
