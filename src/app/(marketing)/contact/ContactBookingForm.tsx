"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowIc } from "@/components/marketing/mk";
import { CountryCombobox, CountryMultiCombobox } from "@/components/marketing/CountryCombobox";
import { PhoneInput } from "@/components/marketing/PhoneInput";
import { SlotPicker } from "./SlotPicker";

export type InquiryOption = { key: string; title: string };

const HEARD_OPTIONS = ["Google search", "LinkedIn", "Facebook", "Referral", "Other"];
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
const NOT_SURE = { key: "not_sure", title: "Not sure, I want guidance" };

/** The firm operates on Cyprus time; slots are generated inside its working
 *  hours and re-labelled here in the visitor's own time zone. */
const FIRM_TZ = "Europe/Nicosia";

const STEP_LABELS = [
  "Step 1 of 4 · Who you are",
  "Step 2 of 4 · Your situation",
  "Step 3 of 4 · What you need",
  "Step 4 of 4 · Book your slot",
];

/** Public consultation-request form, presented as four short steps (short
 *  steps convert far better than one long page on mobile). Captures a CRM
 *  lead — every answer lands on the lead record so staff read the whole case
 *  in one view — and hard-books the picked slot: reserved internally and
 *  mirrored into the staff calendar (docs/booking-flow.md). */
export function ContactBookingForm({ slots, inquiries, underForm }: { slots: string[]; inquiries: InquiryOption[]; underForm?: string }) {
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
  const [heard, setHeard] = useState(HEARD_OPTIONS[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [stepErr, setStepErr] = useState("");

  // Visitor time zone, applied after mount (SSR and first client render both
  // use Cyprus time, so hydration stays consistent).
  const [tz, setTz] = useState(FIRM_TZ);
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTz(detected);
    } catch {
      /* keep firm time */
    }
  }, []);
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

  function next() {
    if (step === 0 && (!name.trim() || !email.includes("@"))) {
      setStepErr("Please add your name and a valid email to continue.");
      return;
    }
    if (step === 1 && (citizenships.length === 0 || !country.trim() || !relocate || !property || !timeline)) {
      setStepErr("Please answer the required questions to continue.");
      return;
    }
    if (step === 2 && (services.length === 0 || !brief.trim())) {
      setStepErr("Please pick at least one service and describe your situation.");
      return;
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
      setStepErr("Please choose a slot to confirm your consultation.");
      return;
    }
    setStepErr("");
    setState("busy");
    const serviceTitles = serviceOptions.filter((o) => services.includes(o.key)).map((o) => o.title);
    const primaryService = services.find((k) => k !== NOT_SURE.key) ?? null;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: whatsapp.trim() || null,
          serviceKey: primaryService,
          source: "contact",
          note: brief.trim() || null,
          meta: {
            ...(country.trim() && { country: country.trim() }),
            ...(citizenships.length > 0 && { nationality: citizenships.join(", ") }),
            ...(relocate && { relocate }),
            ...(property && { property }),
            ...(timeline && { timeline }),
            ...(serviceTitles.length > 0 && { services: serviceTitles.join(", ") }),
            ...(heard && { heardFrom: heard }),
            ...(slot && {
              preferredSlot: slot,
              preferredSlotLabel: cyFmt.format(new Date(slot)),
              timezone: tz,
            }),
          },
        }),
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

  return (
    <div className="form-card" id="book">
      <div className="fsteps" aria-hidden>
        {STEP_LABELS.map((_, i) => (
          <div key={i} className={`fs${i <= step ? " on" : ""}`} />
        ))}
      </div>
      <div className="fstep-label">{STEP_LABELS[step]}</div>
      <h2>Book Your Free 30-Minute Consultation</h2>

      {step === 0 && (
        <div className="fc-grid">
          <div className="fld full">
            <label htmlFor="cf-name">Full Name</label>
            <input id="cf-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="fld full">
            <label htmlFor="cf-email">Email Address</label>
            <input id="cf-email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="fld full">
            <label htmlFor="cf-wa">WhatsApp Number</label>
            <PhoneInput id="cf-wa" value={whatsapp} onChange={setWhatsapp} />
            <div className="charcount" style={{ textAlign: "left" }}>Optional, and the fastest way to reach us.</div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fc-grid">
          <div className="fld full">
            <label htmlFor="cf-nat">Citizenship or Passports Held</label>
            <CountryMultiCombobox id="cf-nat" values={citizenships} onChange={setCitizenships} />
            <div className="charcount" style={{ textAlign: "left" }}>
              Select all that apply. Dual citizenship is common and it changes the route.
            </div>
          </div>
          <div className="fld full">
            <label htmlFor="cf-country">Country You Currently Live and Pay Tax In</label>
            <CountryCombobox id="cf-country" value={country} onChange={setCountry} />
          </div>
          <div className="fld full">
            <label>Are You Looking to Physically Relocate to Cyprus?</label>
            <div className="optlist" role="radiogroup">
              {RELOCATE_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={relocate === o} className={`optb${relocate === o ? " sel" : ""}`} onClick={() => setRelocate(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="fld full">
            <label>Are You Interested in Investing in Property in Cyprus?</label>
            <div className="charcount" style={{ textAlign: "left", marginBottom: 6 }}>
              Property investment from 300,000 euro can open the Permanent Residency route.
            </div>
            <div className="optlist" role="radiogroup">
              {PROPERTY_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={property === o} className={`optb${property === o ? " sel" : ""}`} onClick={() => setProperty(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div className="fld full">
            <label>When Do You Want to Move Ahead?</label>
            <div className="optlist" role="radiogroup">
              {TIMELINE_OPTIONS.map((o) => (
                <button key={o} type="button" role="radio" aria-checked={timeline === o} className={`optb${timeline === o ? " sel" : ""}`} onClick={() => setTimeline(o)}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fc-grid">
          <div className="fld full">
            <label>What Do You Need Help With?</label>
            <div className="charcount" style={{ textAlign: "left", marginBottom: 6 }}>Select all that apply.</div>
            <div className="optlist">
              {serviceOptions.map((o) => (
                <button key={o.key} type="button" role="checkbox" aria-checked={services.includes(o.key)} className={`optb${services.includes(o.key) ? " sel" : ""}`} onClick={() => toggleService(o.key)}>
                  {o.title}
                </button>
              ))}
            </div>
          </div>
          <div className="fld full">
            <label htmlFor="cf-brief">Tell Us About Your Situation in Your Own Words</label>
            <textarea
              id="cf-brief"
              rows={5}
              maxLength={BRIEF_MAX}
              placeholder="What do you do, and what are you trying to achieve? The more you share, the more prepared we come."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <div className="charcount">{brief.length}/{BRIEF_MAX}</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fc-grid">
          <div className="fld full">
            <label htmlFor="cf-heard">How Did You Hear About Us?</label>
            <select id="cf-heard" value={heard} onChange={(e) => setHeard(e.target.value)}>
              {HEARD_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="fld full">
            <label>Pick Your Slot</label>
            <div className="charcount" style={{ textAlign: "left", marginBottom: 4 }}>
              Shown in your own time zone, offered only within our Cyprus working hours. Every
              slot is 30 minutes and books straight into our calendar.
            </div>
            <SlotPicker
              initialSlots={slots}
              value={slot}
              onChange={setSlot}
              tz={tz}
              onTzChange={setTz}
              reloadToken={reloadToken}
            />
          </div>
        </div>
      )}

      {stepErr && <div className="err-note">{stepErr}</div>}

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
            disabled={state === "busy" || state === "done"}
          >
            {state === "done" ? "Request sent" : state === "busy" ? "Sending…" : <>Confirm My Consultation {ArrowIc}</>}
          </button>
        )}
      </div>

      {underForm && <p className="under-form">{underForm}</p>}

      {state === "done" && (
        <div className="ok-note">
          {booked && slot ? (
            <>Your consultation is booked for <b>{slotFmt.format(new Date(slot))}</b>. A calendar
            invite is on its way to your email, and your adviser reads your answers before the call.</>
          ) : (
            <>Request received. We will confirm your slot on WhatsApp and email shortly, with an
            adviser already briefed on your needs.</>
          )}
        </div>
      )}
      {state === "error" && (
        <div className="err-note">
          Please check your name and email address, then try again. If it still fails, email or
          call us directly.
        </div>
      )}
    </div>
  );
}
