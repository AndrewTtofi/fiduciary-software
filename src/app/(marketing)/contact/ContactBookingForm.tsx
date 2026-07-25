"use client";

import { useState } from "react";
import { ArrowIc } from "@/components/marketing/mk";
import { CountryCombobox, CountryMultiCombobox } from "@/components/marketing/CountryCombobox";
import { PhoneInput } from "@/components/marketing/PhoneInput";

export type SlotOption = { iso: string; label: string };
export type InquiryOption = { key: string; title: string };

const HEARD_OPTIONS = ["Google search", "LinkedIn", "Facebook", "Referral", "Other"];
const BRIEF_MAX = 500;

const STEP_LABELS = [
  "Step 1 of 4 · Who you are",
  "Step 2 of 4 · Your situation",
  "Step 3 of 4 · What you need",
  "Step 4 of 4 · Book your slot",
];

/** Public consultation-request form, presented as four short steps (short
 *  steps convert far better than one long page on mobile). Captures a CRM
 *  lead exactly as before — same payload, same endpoint; the steps are
 *  purely presentational. Actual booking is confirmed by the team after
 *  review — the platform is qualify-first, so no anonymous calendar writes. */
export function ContactBookingForm({ slots, inquiries, underForm }: { slots: SlotOption[]; inquiries: InquiryOption[]; underForm?: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [citizenships, setCitizenships] = useState<string[]>([]);
  const [inquiry, setInquiry] = useState(inquiries[0]?.key ?? "");
  const [brief, setBrief] = useState("");
  const [heard, setHeard] = useState(HEARD_OPTIONS[0]);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [stepErr, setStepErr] = useState("");

  function next() {
    if (step === 0 && (!name.trim() || !email.includes("@"))) {
      setStepErr("Please add your name and a valid email to continue.");
      return;
    }
    if (step === 2 && !brief.trim()) {
      setStepErr("A sentence or two about your situation helps us come prepared.");
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
    setState("busy");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: whatsapp.trim() || null,
          serviceKey: inquiry || null,
          source: "contact",
          note: brief.trim() || null,
          meta: {
            ...(country.trim() && { country: country.trim() }),
            ...(citizenships.length > 0 && { nationality: citizenships.join(", ") }),
            ...(heard && { heardFrom: heard }),
            ...(slot && { preferredSlot: slot.iso, preferredSlotLabel: slot.label }),
          },
        }),
      });
      setState(res.ok ? "done" : "error");
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
            <label htmlFor="cf-country">Country You Currently Live and Pay Tax In</label>
            <CountryCombobox id="cf-country" value={country} onChange={setCountry} />
          </div>
          <div className="fld full">
            <label htmlFor="cf-nat">Citizenship or Passports Held</label>
            <CountryMultiCombobox id="cf-nat" values={citizenships} onChange={setCitizenships} />
            <div className="charcount" style={{ textAlign: "left" }}>
              Select all that apply. Dual citizenship is common and it changes the route.
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fc-grid">
          <div className="fld full">
            <label htmlFor="cf-inq">What Do You Need Help With?</label>
            <select id="cf-inq" value={inquiry} onChange={(e) => setInquiry(e.target.value)}>
              {inquiries.map((o) => (
                <option key={o.key} value={o.key}>{o.title}</option>
              ))}
            </select>
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
          {slots.length > 0 && (
            <div className="fld full">
              <label>Pick Your Slot</label>
              <div className="charcount" style={{ textAlign: "left", marginBottom: 4 }}>
                Shown in Cyprus time. Every slot is 30 minutes.
              </div>
              <div className="slots">
                {slots.map((s) => (
                  <button
                    key={s.iso}
                    type="button"
                    className={`slot-b${slot?.iso === s.iso ? " sel" : ""}`}
                    onClick={() => setSlot(s)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          Request received. We will confirm your slot on WhatsApp and email shortly, with an
          adviser already briefed on your needs.
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
