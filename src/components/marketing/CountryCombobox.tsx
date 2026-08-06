"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/data/countries";

/* Brand-styled country autocomplete: the full alphabetical list drops down on
   click/focus, filters as the visitor types, arrow keys + Enter select.
   `multi` renders the picked countries as removable chips (for citizenship,
   where dual passports are common). */

type BaseProps = {
  id: string;
  placeholder?: string;
};

export function CountryCombobox({
  id,
  placeholder = "Start typing a country",
  value,
  onChange,
}: BaseProps & { value: string; onChange: (v: string) => void }) {
  return (
    <SingleBox id={id} placeholder={placeholder} value={value} onChange={onChange} />
  );
}

export function CountryMultiCombobox({
  id,
  placeholder = "Start typing a country",
  values,
  onChange,
}: BaseProps & { values: string[]; onChange: (v: string[]) => void }) {
  const add = (c: string) => {
    if (!values.includes(c)) onChange([...values, c]);
  };
  const remove = (c: string) => onChange(values.filter((v) => v !== c));
  return (
    <div>
      {values.length > 0 && (
        <div className="cc-chips">
          {values.map((v) => (
            <button key={v} type="button" className="cc-chip" onClick={() => remove(v)} aria-label={`Remove ${v}`}>
              {v} ×
            </button>
          ))}
        </div>
      )}
      <SingleBox id={id} placeholder={placeholder} value="" onChange={add} clearOnSelect exclude={values} />
    </div>
  );
}

function SingleBox({
  id,
  placeholder,
  value,
  onChange,
  clearOnSelect = false,
  exclude = [],
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  clearOnSelect?: boolean;
  exclude?: string[];
}) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when the parent changes the value (state
  // adjustment during render, not an effect).
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value);
  }

  // Close when clicking anywhere outside the combobox.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = text.trim().toLowerCase();
  const options = COUNTRIES.filter(
    (c) => !exclude.includes(c) && (!q || c.toLowerCase().includes(q)),
  );

  function pick(c: string) {
    onChange(c);
    setText(clearOnSelect ? "" : c);
    setOpen(false);
  }

  const listId = `${id}-listbox`;

  return (
    <div className="cc-wrap" ref={wrapRef}>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        onFocus={() => { setOpen(true); setHi(0); }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setHi(0);
          if (!clearOnSelect) onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setOpen(true); return; }
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, options.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && open && options[hi]) { e.preventDefault(); pick(options[hi]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && options.length > 0 && (
        <div className="cc-list" role="listbox" id={listId}>
          {options.map((c, i) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={i === hi}
              className={`cc-opt${i === hi ? " hi" : ""}`}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
