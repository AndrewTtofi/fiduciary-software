"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowIc } from "@/components/marketing/mk";
import { CountryCombobox, CountryMultiCombobox } from "@/components/marketing/CountryCombobox";
import { PhoneInput } from "@/components/marketing/PhoneInput";
import type { PrepVideo } from "@/lib/services/content";
import { SlotPicker } from "./SlotPicker";

export type InquiryOption = { key: string; title: string };

const HEARD_OPTIONS = ["Google search", "LinkedIn", "Facebook", "Referral", "Other"];
const NOT_SAID = "";
const BRIEF_MAX = 500;

const RELOCATE_OPTIONS = [
  "Yes, myself or my family",
  "Yes, myself and my team or company",
  "No, company or structure only",
  "Not sure yet",
];
const PROPERTY_OPTIONS = [
  "Yes, for permanent residency",
  "Yes, as an investment or a home",
  "Maybe, tell me my options",
  "No",
];
const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 3 months",
  "Within 6 to 12 months",
  "Just researching for now",
];

/** Pseudo-service for visitors who want guidance rather than a named line. */
const NOT_SURE = { key: "not_sure", title: "Not sure yet, I'd like guidance" };

/** The firm operates on Cyprus time; slots are generated inside its working
 *  hours and re-labelled here in the visitor's own time zone. The picker
 *  auto-detects the visitor's zone from the browser and falls back to
 *  Asia/Nicosia (the canonical IANA name for Cyprus). */
const FIRM_TZ = "Asia/Nicosia";

/* The browser's zone never changes mid-session, so there is nothing to
   subscribe to; the server snapshot keeps hydration consistent. */
const NO_SUBSCRIBE = () => () => {};

const STEP_LABELS = [
  "Step 1 of 4 · What you need",
  "Step 2 of 4 · Your situation",
  "Step 3 of 4 · Your plan",
  "Step 4 of 4 · Book your slot",
];

const STEP_HEADINGS: { title: string; sub: string }[] = [
  { title: "What are you trying to sort out?", sub: "Tap all that apply — it just helps us point you the right way." },
  { title: "A little about your setup", sub: "All clicks, no typing. Where you are today changes the route." },
  { title: "Where should we send your plan?", sub: "We'll prep a tailored route before the call and send it here." },
  { title: "Pick your time", sub: "Shown in your time zone, within our Cyprus working hours. 30 minutes, straight into our calendar." },
];

/** Public consultation-request form, presented as four short steps, ordered
 *  so the visitor clicks before they type and invests before they are asked
 *  for anything personal (docs/booking-flow.md):
 *
 *    1. what you need      — service tiles only; no typing, no consent
 *    2. your situation     — citizenship, residence, relocation, timeline: clicks
 *    3. your plan          — first name + email, framed as "where to send your
 *                            plan"; consent lives here, at the point of capture.
 *                            Passing this step saves the lead straight away
 *                            (partial save), so an abandon on the calendar is
 *                            still a lead the team can follow up.
 *    4. book your slot     — the calendar, then the phone number last and
 *                            optional, one tap from booked.
 *
 *  The final submit upserts the same lead record (email + source) with every
 *  answer, hard-books the slot (reserved internally, mirrored into the staff
 *  calendar) and lands on a confirmation that is not a dead end: calendar
 *  link, prep videos, and the speed-to-lead outreach behind the scenes. */
export function ContactBookingForm({
  slots,
  inquiries,
  prepVideos,
}: {
  slots: string[];
  inquiries: InquiryOption[];
  prepVideos: PrepVideo[];
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [citizenships, setCitizenships] = useState<string[]>([]);
  const [relocate, setRelocate] = useState("");
  const [property, setProperty] = useState("");
  const [timeline, setTimeline] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [brief, setBrief] = useState("");
  const [consent, setConsent] = useState(false);
  const [heard, setHeard] = useState(NOT_SAID);
  const [heardSent, setHeardSent] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [stepErr, setStepErr] = useState("");

  // Detected zone, plus whatever the visitor picks instead. Deriving the
  // default rather than setting it from an effect keeps hydration consistent
  // without a cascading render.
  const detectedTz = useSyncExternalStore(
    NO_SUBSCRIBE,
    () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || FIRM_TZ; } catch { return FIRM_TZ; } },
    () => FIRM_TZ,
  );
  const [tzOverride, setTz] = useState<string | null>(null);
  const tz = tzOverride ?? detectedTz;
  const slotFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      }),
    [tz],
  );
  // Cyprus-time label for the firm's records, whatever the visitor's zone.
  const cyFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: FIRM_TZ,
      }),
    [],
  );

  const serviceOptions = [...inquiries, NOT_SURE];

  function toggleService(key: string) {
    setServices((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  /** Everything the lead record holds, built the same way for the partial
   *  save and the final submit so the final upsert simply completes it. */
  function leadPayload(extra: Record<string, string> = {}) {
    const serviceTitles = serviceOptions.filter((o) => services.includes(o.key)).map((o) => o.title);
    const primaryService = services.find((k) => k !== NOT_SURE.key) ?? null;
    return {
      email: email.trim(),
      name: name.trim(),
      phone: whatsapp.trim() || null,
      serviceKey: primaryService,
      source: "contact" as const,
      note: brief.trim() || null,
      meta: {
        ...(country.trim() && { country: country.trim() }),
        ...(citizenships.length > 0 && { nationality: citizenships.join(", ") }),
        ...(relocate && { relocate }),
        ...(property && { property }),
        ...(timeline && { timeline }),
        ...(serviceTitles.length > 0 && { services: serviceTitles.join(", ") }),
        gdprConsent: "yes",
        ...extra,
      },
    };
  }

  function next() {
    if (step === 0 && services.length === 0) {
      setStepErr("Pick at least one — or “Not sure yet” if you'd like guidance.");
      return;
    }
    if (step === 1 && (citizenships.length === 0 || !country.trim() || !relocate || !timeline)) {
      setStepErr("Please answer the required questions to continue.");
      return;
    }
    if (step === 2) {
      if (!name.trim() || !email.includes("@")) {
        setStepErr("Please add your first name and a valid email so we know where to send your plan.");
        return;
      }
      if (!consent) {
        setStepErr("Please agree to the Privacy Policy so we can prepare your plan.");
        return;
      }
      // The visitor is now a lead, whatever happens on the calendar. Fire and
      // forget: a failure here must not block the slot step — the final
      // submit sends the full record again.
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leadPayload(), partial: true }),
      }).catch(() => {});
    }
    setStepErr("");
    setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStepErr("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (state === "busy" || state === "done") return;
    if (!email.trim() || !name.trim()) {
      setState("error");
      return;
    }
    if (slots.length > 0 && !slot) {
      setStepErr("Please choose a slot to confirm your call.");
      return;
    }
    setStepErr("");
    setState("busy");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          leadPayload(
            slot
              ? { preferredSlot: slot, preferredSlotLabel: cyFmt.format(new Date(slot)), timezone: tz }
              : {},
          ),
        ),
      });
      if (res.status === 409) {
        // The slot went to someone else between render and submit — refresh
        // availability and let the visitor pick again (their answers are kept).
        setSlot(null);
        setReloadToken((n) => n + 1);
        setState("idle");
        setStepErr("That time was just taken. Please pick another slot.");
        return;
      }
      if (res.ok) {
        const j = (await res.json().catch(() => ({}))) as { booked?: boolean };
        setBooked(!!j.booked);
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <Confirmation
        slot={booked ? slot : null}
        slotLabel={booked && slot ? slotFmt.format(new Date(slot)) : null}
        tz={tz}
        prepVideos={prepVideos}
        heard={heard}
        heardSent={heardSent}
        onHeard={(o) => {
          setHeard(o);
          setHeardSent(true);
          fetch("/api/leads/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), heardFrom: o }),
          }).catch(() => {});
        }}
      />
    );
  }

  const heading = STEP_HEADINGS[step];

  return (
    <div className="form-card" id="book">
      <div className="fsteps" aria-hidden>
        {STEP_LABELS.map((_, i) => (
          <div key={i} className={`fs${i <= step ? " on" : ""}`} />
        ))}
      </div>
      <div className="fstep-label">{STEP_LABELS[step]}</div>
      <h2>{heading.title}</h2>
      <p className="bk-sub">{heading.sub}</p>

      {/* keyed by step so every step change remounts and replays the
          prototype's slide-in (.mo-step) */}
      <div key={step} className="mo-step">
      {step === 0 && (
        <div className="fc-grid">
          <div className="fld full">
            <div className="optlist" role="group" aria-label="What you need">
              {serviceOptions.map((o) => (
                <button key={o.key} type="button" role="checkbox" aria-checked={services.includes(o.key)} className={`optb${services.includes(o.key) ? " sel" : ""}`} onClick={() => toggleService(o.key)}>
                  {o.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fc-grid">
          <div className="fld full">
            <label htmlFor="cf-nat">Citizenship or passports held</label>
            <CountryMultiCombobox id="cf-nat" values={citizenships} onChange={setCitizenships} />
            <div className="charcount" style={{ textAlign: "left" }}>
              Select all that apply. Dual citizenship is common and it changes the route.
            </div>
          </div>
          <div className="fld full">
            <label htmlFor="cf-country">Where you currently live and pay tax</label>
            <CountryCombobox id="cf-country" value={country} onChange={setCountry} />
          </div>
          <div className="fld full">
            <label>Looking to relocate to Cyprus?</label>
            <div className="optlist" role="radiogroup">
              {RELOCATE_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={relocate === o} className={`optb${relocate === o ? " sel" : ""}`} onClick={() => setRelocate(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="fld full">
            <label>When do you want to move ahead?</label>
            <div className="optlist" role="radiogroup">
              {TIMELINE_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={timeline === o} className={`optb${timeline === o ? " sel" : ""}`} onClick={() => setTimeline(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="fld full">
            <label>Interested in property in Cyprus? <span className="bk-opt">(optional)</span></label>
            <div className="charcount" style={{ textAlign: "left", marginBottom: 6 }}>
              Property investment from 300,000 euro can open the Permanent Residency route.
            </div>
            <div className="optlist" role="radiogroup">
              {PROPERTY_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={property === o} className={`optb${property === o ? " sel" : ""}`} onClick={() => setProperty(property === o ? "" : o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fc-grid">
          <div className="fld">
            <label htmlFor="cf-name">First name</label>
            <input id="cf-name" name="name" autoComplete="given-name" placeholder="Your first name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="cf-email">Email address</label>
            <input id="cf-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="fld full">
            <label htmlFor="cf-brief">Anything you want us to know? <span className="bk-opt">(optional)</span></label>
            <textarea
              id="cf-brief"
              rows={3}
              maxLength={BRIEF_MAX}
              placeholder="A sentence is plenty. The more you share, the more prepared we come."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <div className="charcount">{brief.length}/{BRIEF_MAX}</div>
          </div>
          <div className="fld full">
            <label className="consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                I agree to my details being used to arrange and prepare for this consultation, as
                described in the <Link href="/privacy" target="_blank">Privacy Policy</Link>.
              </span>
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fc-grid">
          <div className="fld full">
            <SlotPicker
              initialSlots={slots}
              value={slot}
              onChange={setSlot}
              tz={tz}
              onTzChange={setTz}
              reloadToken={reloadToken}
            />
          </div>
          <div className="fld full">
            <label htmlFor="cf-wa">WhatsApp / mobile <span className="bk-opt">(optional — the fastest way we&apos;ll reach you)</span></label>
            <PhoneInput id="cf-wa" value={whatsapp} onChange={setWhatsapp} />
          </div>
        </div>
      )}

      {stepErr && <div className="err-note">{stepErr}</div>}
      </div>

      <div className="fnav">
        {step > 0 ? (
          <button className="pill ghost" onClick={back} disabled={state === "busy"}>Back</button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button className="pill" onClick={next}>Continue {ArrowIc}</button>
        ) : (
          <button
            className="pill"
            onClick={submit}
            disabled={state === "busy"}
          >
            {state === "busy" ? "Booking…" : <>Confirm my call {ArrowIc}</>}
          </button>
        )}
      </div>

      {state === "error" && (
        <div className="err-note">
          Please check your name and email address, then try again. If it still fails, email or
          call us directly.
        </div>
      )}
    </div>
  );
}

/** Google Calendar "add event" link for the booked slot. The .ics is already
 *  in the confirmation email; this is the one-tap version for people who live
 *  in Google Calendar. */
function googleCalendarUrl(slotIso: string, minutes = 30) {
  const start = new Date(slotIso);
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Consultation call",
    dates: `${stamp(start)}/${stamp(end)}`,
    details: "Your 30-minute consultation. The call link is in your confirmation email.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** The post-booking "hot moment". Peak interest, so instead of "we'll be in
 *  touch" it confirms, sets expectations, and hands over the prep videos that
 *  answer the objections people bring to a first call. */
function Confirmation({
  slot,
  slotLabel,
  tz,
  prepVideos,
  heard,
  heardSent,
  onHeard,
}: {
  slot: string | null;
  slotLabel: string | null;
  tz: string;
  prepVideos: PrepVideo[];
  heard: string;
  heardSent: boolean;
  onHeard: (o: string) => void;
}) {
  return (
    <div className="form-card bk-done" id="book">
      <div className="bk-tick" aria-hidden>✓</div>
      <h2>{slot && slotLabel ? <>You&apos;re booked — {slotLabel}</> : "Request received"}</h2>
      {slot && slotLabel && <p className="bk-tz">{tz.replace(/_/g, " ")}</p>}
      <p className="bk-sub">
        {slot
          ? "Check your inbox: your tailored plan and the call link are on the way. Here's what we'll cover so it's worth your 30 minutes."
          : "Check your inbox: your tailored plan is on the way, and we'll confirm a time with you shortly."}
      </p>

      <div className="bk-actions">
        {slot && (
          <a className="pill sm" href={googleCalendarUrl(slot)} target="_blank" rel="noopener noreferrer">
            Add to calendar
          </a>
        )}
        <Link className="pill ghost sm" href="/contact">{slot ? "Reschedule" : "Talk to us first"}</Link>
      </div>

      {prepVideos.length > 0 && (
        <section className="bk-videos" aria-labelledby="bk-videos-h">
          <div className="fstep-label" id="bk-videos-h">Before we talk</div>
          <p className="bk-videos-intro">
            The {prepVideos.length === 4 ? "4 " : ""}things almost everyone asks — answered in a minute each, by our team:
          </p>
          <div className="bk-vgrid">
            {prepVideos.map((v, i) => {
              const inner = (
                <>
                  <div className="bk-vtop">
                    <span className="bk-vtag">{v.tag}</span>
                    <span className="bk-vplay" aria-hidden>▶</span>
                    <span className="bk-vdur">{v.duration}</span>
                  </div>
                  <h3>{v.title}</h3>
                  <p>{v.blurb}</p>
                </>
              );
              return v.url ? (
                <a key={i} className="bk-vcard is-link" href={v.url} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div key={i} className="bk-vcard">{inner}</div>
              );
            })}
          </div>
        </section>
      )}

      <div className="ok-note">
        <b>What happens next:</b> someone from our team will reach out shortly to confirm and answer
        anything quick — we don&apos;t leave you waiting until the call. Talk soon.
      </div>

      {/* Asked only after the booking is confirmed — the least important
          question in the flow, so it never sits in front of the calendar. */}
      {!heardSent ? (
        <div className="fld full" style={{ marginTop: 22 }}>
          <label htmlFor="cf-heard">One last thing - how did you hear about us?</label>
          <div className="optlist" role="radiogroup" id="cf-heard">
            {HEARD_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={heard === o}
                className={`optb${heard === o ? " sel" : ""}`}
                onClick={() => onHeard(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="charcount" style={{ textAlign: "left", marginTop: 12 }}>Thank you - noted.</p>
      )}
    </div>
  );
}
