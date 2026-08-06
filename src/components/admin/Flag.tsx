/* =====================================================================
   Jurisdiction flags — inline SVG, never regional-indicator emoji.
   Windows ships no glyphs for U+1F1E6..U+1F1FF, so emoji flags degrade to
   a bare letter pair (CY, GB) for most desktop users. Countries without a
   drawn flag fall back to a neutral tile carrying the ISO code, which is
   still readable rather than accidentally blank.
   ===================================================================== */

import { DIAL_CODES } from "@/lib/data/countries";
import { FLAG_ART } from "@/components/admin/flag-art";

/** Country name (as stored on leads/prospects) → ISO 3166-1 alpha-2. */
const ISO_BY_NAME: ReadonlyMap<string, string> = new Map(
  DIAL_CODES.map((c) => [c.name.toLowerCase(), c.iso2]),
);

/** Spellings the forms accept that don't match the canonical country list. */
const ALIASES: Record<string, string> = {
  uk: "GB", "u.k.": "GB", britain: "GB", "great britain": "GB", england: "GB",
  scotland: "GB", wales: "GB",
  usa: "US", "u.s.": "US", "u.s.a.": "US", america: "US",
  "united states of america": "US", uae: "AE", "u.a.e.": "AE",
  "czech republic": "CZ", holland: "NL", "south korea": "KR", "north korea": "KP",
  "hong kong": "HK", "russian federation": "RU", "ivory coast": "CI",
};

/** Resolve a free-text country to an ISO2 code, or null when unrecognised. */
export function isoOf(country: string | null | undefined): string | null {
  if (!country) return null;
  const raw = country.trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const key = raw.toLowerCase();
  return ALIASES[key] ?? ISO_BY_NAME.get(key) ?? null;
}

/** Display name for an ISO2 code, falling back to the code itself. */
export function countryName(iso: string): string {
  return DIAL_CODES.find((c) => c.iso2 === iso)?.name ?? iso;
}

/* ---------- Flag artwork ------------------------------------------------
   Accurate SVGs generated from country-flag-icons — see scripts/gen-flag-art.mjs.
   These were hand-drawn once; several were wrong, so they are no longer
   authored here. Rendered on the server only, so the ~110KB of markup never
   reaches the browser as JavaScript — only the handful of flags actually on
   screen ship, as plain HTML. */

/** A single 20×14 flag tile. Unknown jurisdictions render the ISO code. */
export function Flag({ country, title }: { country: string | null | undefined; title?: string }) {
  const iso = isoOf(country);
  const label = title ?? (iso ? countryName(iso) : (country ?? "Unknown"));
  const art = iso ? FLAG_ART[iso] : undefined;

  // An unrecognised jurisdiction gets its ISO code, never an invented flag.
  if (!art) {
    return (
      <span className="flag flag-txt" role="img" aria-label={label} title={label}>
        {iso ?? "?"}
      </span>
    );
  }
  return (
    <span className="flag" role="img" aria-label={label} title={label}>
      {/* Build-time constant from a vetted set — never user input. */}
      <svg viewBox={art.v} preserveAspectRatio="xMidYMid slice" aria-hidden="true"
           dangerouslySetInnerHTML={{ __html: art.d }} />
    </span>
  );
}

/** Flag plus country name — the "Lives in" table cell. */
export function Jurisdiction({ country }: { country: string | null | undefined }) {
  const iso = isoOf(country);
  if (!country?.trim()) return <span className="muted">—</span>;
  return (
    <span className="jur">
      <Flag country={country} />
      <span className="jur-name">{iso ? countryName(iso) : country}</span>
    </span>
  );
}

/** Flags only, side by side — passports held / multiple citizenships. */
export function JurisdictionStack({ countries }: { countries: (string | null | undefined)[] }) {
  const list = countries.filter((c): c is string => !!c?.trim());
  if (!list.length) return <span className="muted">—</span>;
  return (
    <span className="jur-stack">
      {list.map((c, i) => <Flag key={`${c}-${i}`} country={c} />)}
    </span>
  );
}

/** Split a stored "Germany, Cyprus" / "Germany; Cyprus" answer into countries. */
export function splitCountries(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(/[,;/]|\band\b/i).map((s) => s.trim()).filter(Boolean);
}
