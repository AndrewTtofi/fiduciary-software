"use client";

import { useEffect, useRef, useState } from "react";
import { DIAL_CODES, type DialCode } from "@/lib/data/countries";

/* Phone number input with a country dial-code picker: small flag + code
   button opens a searchable, alphabetical dropdown of every country;
   the number is typed next to it. Emits one string, e.g. "+357 99123456". */

const flag = (iso2: string) =>
  iso2 === "XK"
    ? "🏴" // Kosovo has no emoji flag
    : String.fromCodePoint(...[...iso2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const DEFAULT_ISO = "CY";

export function PhoneInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [country, setCountry] = useState<DialCode>(
    DIAL_CODES.find((d) => d.iso2 === DEFAULT_ISO) ?? DIAL_CODES[0],
  );
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Emit the combined value upward whenever either part changes.
  function emit(c: DialCode, n: string) {
    onChange(n.trim() ? `${c.dial} ${n.trim()}` : "");
  }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const needle = q.trim().toLowerCase();
  const options = DIAL_CODES.filter(
    (d) => !needle || d.name.toLowerCase().includes(needle) || d.dial.includes(needle),
  );

  return (
    <div className="pi-wrap" ref={wrapRef}>
      <div className="pi-row">
        <button
          type="button"
          className="pi-code"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country code: ${country.name} ${country.dial}`}
          onClick={() => { setOpen((v) => !v); setQ(""); }}
        >
          <span className="pi-flag" aria-hidden>{flag(country.iso2)}</span>
          <span className="pi-dial">{country.dial}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          placeholder="99 123456"
          value={number}
          onChange={(e) => {
            const n = e.target.value.replace(/[^\d\s]/g, "");
            setNumber(n);
            emit(country, n);
          }}
        />
      </div>
      {open && (
        <div className="pi-list" role="listbox">
          <input
            ref={searchRef}
            className="pi-search"
            placeholder="Search country or code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="pi-opts">
            {options.map((d) => (
              <button
                key={d.iso2}
                type="button"
                role="option"
                aria-selected={d.iso2 === country.iso2}
                className={`pi-opt${d.iso2 === country.iso2 ? " sel" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setCountry(d);
                  emit(d, number);
                  setOpen(false);
                }}
              >
                <span className="pi-flag" aria-hidden>{flag(d.iso2)}</span>
                <span className="pi-name">{d.name}</span>
                <span className="pi-dial">{d.dial}</span>
              </button>
            ))}
            {options.length === 0 && <div className="pi-empty">No match</div>}
          </div>
        </div>
      )}
    </div>
  );
}
