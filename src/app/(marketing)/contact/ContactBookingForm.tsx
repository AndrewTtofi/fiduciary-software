"use client";

import { useState } from "react";
import { ArrowIc } from "@/components/marketing/mk";

export type SlotOption = { iso: string; label: string };
export type InquiryOption = { key: string; title: string };

const HEARD_OPTIONS = ["Google search", "Referral", "Social media", "Other"];
const BRIEF_MAX = 300;

/** Public consultation-request form. Captures a CRM lead (with the preferred
 *  slot as metadata); actual booking is confirmed by the team after review —
 *  the platform is qualify-first, so no anonymous calendar writes. */
export function ContactBookingForm({ slots, inquiries }: { slots: SlotOption[]; inquiries: InquiryOption[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [inquiry, setInquiry] = useState(inquiries[0]?.key ?? "");
  const [brief, setBrief] = useState("");
  const [heard, setHeard] = useState(HEARD_OPTIONS[0]);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

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
            ...(nationality.trim() && { nationality: nationality.trim() }),
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
      <h2>Book A Consultation.</h2>
      <p style={{ color: "#55524a", fontSize: 14.5, marginTop: 8 }}>
        Tell us briefly what you need — we come to the call prepared.
      </p>
      <div className="fc-grid">
        <div className="fld">
          <label htmlFor="cf-name">Full Name</label>
          <input id="cf-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="cf-email">Email Address</label>
          <input id="cf-email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="cf-wa">WhatsApp Number</label>
          <input id="cf-wa" placeholder="+357 ..." value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="cf-country">Country of Residence</label>
          <input id="cf-country" placeholder="e.g. Germany" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="cf-nat">Nationality</label>
          <input id="cf-nat" placeholder="e.g. German" value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="cf-inq">Inquiry Type</label>
          <select id="cf-inq" value={inquiry} onChange={(e) => setInquiry(e.target.value)}>
            {inquiries.map((o) => (
              <option key={o.key} value={o.key}>{o.title}</option>
            ))}
          </select>
        </div>
        <div className="fld full">
          <label htmlFor="cf-brief">Briefly Describe Your Needs</label>
          <textarea
            id="cf-brief"
            rows={3}
            maxLength={BRIEF_MAX}
            placeholder={`Up to ${BRIEF_MAX} characters`}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <div className="charcount">{brief.length}/{BRIEF_MAX}</div>
        </div>
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
            <label>Preferred Slot</label>
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
      <button
        className="pill"
        style={{ marginTop: 30, width: "100%", justifyContent: "center" }}
        onClick={submit}
        disabled={state === "busy" || state === "done"}
      >
        {state === "done" ? "Request sent" : state === "busy" ? "Sending…" : <>Request Consultation {ArrowIc}</>}
      </button>
      {state === "done" && (
        <div className="ok-note">
          Request received. We&apos;ll confirm your slot on WhatsApp and email shortly — with an
          adviser already briefed on your needs.
        </div>
      )}
      {state === "error" && (
        <div className="err-note">
          Please check your name and email address, then try again. If it still fails, email or
          call us directly — details on the left.
        </div>
      )}
    </div>
  );
}
