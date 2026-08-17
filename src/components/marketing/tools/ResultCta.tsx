import type { ReactNode } from "react";
import Link from "next/link";
import { WhatsAppButton } from "@/components/marketing/mk";

/** The block every tool result ends with: the answer, one line of context,
 *  the gold booking button with Message on WhatsApp beside it. Plain
 *  component (no hooks) so both server and client tools can render it. */
export function ResultCta({ answer, context, whatsapp, unit }: { answer: ReactNode; context: string; whatsapp: string; unit?: string }) {
  return (
    <div className="result-cta">
      <div className="ra">{answer}{unit && <small>{unit}</small>}</div>
      <p>{context}</p>
      <div className="final-btns">
        <Link href="/book" className="pill">Book a Free Consultation</Link>
        <WhatsAppButton number={whatsapp} />
      </div>
    </div>
  );
}
