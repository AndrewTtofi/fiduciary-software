import { redirect } from "next/navigation";

/** Consultation hours now live as a tab on Bookings — the schedule and the
 *  bookings it produces belong on one screen. Kept as a redirect so existing
 *  links and bookmarks still land somewhere useful. */
export default function ConsultationHoursRedirect() {
  redirect("/admin/bookings?tab=hours");
}
