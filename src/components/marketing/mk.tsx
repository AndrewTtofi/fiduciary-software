import type { ReactNode } from "react";

/* Small shared pieces for the Oceano-style marketing skin.
   Content conventions (see lib/services/content.ts):
   - "\n" splits heading lines; *single asterisks* mark the gold italic span.
   - **double asterisks** mark emphasised (bold) body text. */

function parseGold(line: string, keyBase: string): ReactNode[] {
  return line.split(/\*([^*]+)\*/g).map((seg, i) =>
    i % 2 === 1 ? <span key={`${keyBase}-${i}`} className="gold">{seg}</span> : seg,
  );
}

/** Multi-line heading with gold italic spans ("\n" → <br>). */
export function GoldHeading({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((ln, i) => (
        <span key={i}>
          {parseGold(ln, `l${i}`)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/** Hero headline: each line rises in with a stagger (concept's kinetic type). */
export function KineticHeading({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((ln, i) => (
        <span key={i} className="ln"><span>{parseGold(ln, `k${i}`)}</span></span>
      ))}
    </>
  );
}

/** Body copy with **bold** emphasis. */
export function BoldText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*([^*]+)\*\*/g).map((seg, i) => (i % 2 === 1 ? <b key={i}>{seg}</b> : seg))}
    </>
  );
}

/** "100%+" → { count: 100, suffix: "%", sup: "+" } for the count-up stats. */
export function parseStatValue(v: string): { count: number | null; suffix: string; sup: string } {
  const m = v.match(/^(\d+)([^+]*)(\+?)$/);
  if (!m) return { count: null, suffix: v, sup: "" };
  return { count: parseInt(m[1], 10), suffix: m[2], sup: m[3] };
}

/** "+357 99 123 456" → https://wa.me/35799123456 */
export function waLink(number: string): string {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}`;
}

/** "+357 22 123 456" → tel:+35722123456 */
export function telLink(number: string): string {
  return `tel:${number.replace(/[^+\d]/g, "")}`;
}

/** 12 March 2026 — dates on cards and article pages. */
export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "Legal Name · HE 123456 · VAT 12345678X" — the statutory line shown in
 *  the footer, on the About and Contact pages. Parts that are unset drop out. */
export function statutoryLine(legalName: string, regNo: string, vatNo: string): string {
  return [legalName, regNo, vatNo ? `VAT ${vatNo}` : ""].filter(Boolean).join(" · ");
}

export const WhatsAppIc = (
  <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.3A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
);

/** Outline "Message on WhatsApp" button — the low-commitment option that
 *  sits beside every gold booking button. Renders nothing without a number. */
export function WhatsAppButton({ number, className = "pill ghost", label = "Message on WhatsApp" }: { number: string; className?: string; label?: string }) {
  if (!number) return null;
  return (
    <a href={waLink(number)} target="_blank" rel="noopener noreferrer" className={className}>
      {WhatsAppIc} {label}
    </a>
  );
}

export const ArrowIc = (
  <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronIc = (
  <svg className="ic ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const CheckIc = (
  <svg className="ic ic-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 13l4 4L19 7" />
  </svg>
);
