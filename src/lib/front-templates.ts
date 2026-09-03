/* =====================================================================
   Front-face UI templates (marketing site + auth pages)

   A "template" is a complete look for the public front face: a font
   pairing, a colour palette (the `--mk-*` token family consumed by
   `.shell-marketing` rules in globals.css) and a structural CSS variant
   (`.tpl-<key>` blocks in src/app/front-templates.css). The super admin
   picks one per deployment and may override individual colours/fonts —
   stored on OrgSettings.frontTemplate / OrgSettings.frontTheme.

   This module is PURE and client-safe (no Prisma / server imports): the
   admin picker renders previews from the same catalog the server uses,
   so the two can never drift.
   ===================================================================== */

/* ── curated font registry ──────────────────────────────────────────
   Every family here is pre-loaded in src/app/layout.tsx via next/font
   (new ones with `preload: false`, so a browser only downloads the
   families the active template actually renders with). A DB value can
   only *select* one of these — next/font cannot load arbitrary
   families at request time. */
export const FRONT_FONTS = {
  playfair: { label: "Playfair Display", stack: "var(--font-display), Georgia, serif", kind: "serif" },
  cormorant: { label: "Cormorant Garamond", stack: "var(--gf-cormorant), Georgia, serif", kind: "serif" },
  jakarta: { label: "Plus Jakarta Sans", stack: "var(--font-body), system-ui, sans-serif", kind: "sans" },
  inter: { label: "Inter", stack: "var(--gf-inter), system-ui, sans-serif", kind: "sans" },
  manrope: { label: "Manrope", stack: "var(--gf-manrope), system-ui, sans-serif", kind: "sans" },
  "space-grotesk": { label: "Space Grotesk", stack: "var(--gf-space-grotesk), system-ui, sans-serif", kind: "sans" },
  sora: { label: "Sora", stack: "var(--gf-sora), system-ui, sans-serif", kind: "sans" },
} as const;

export type FrontFontKey = keyof typeof FRONT_FONTS;
export const FRONT_FONT_KEYS = ["playfair", "cormorant", "jakarta", "inter", "manrope", "space-grotesk", "sora"] as const;

/* ── template palettes ──────────────────────────────────────────────
   Keys mirror the `--mk-*` custom properties. `navy` is the primary
   (headlines, dark bands), `gold` the accent (buttons, links, kickers). */
export type FrontPalette = {
  navy: string; navyDeep: string; navySoft: string;
  gold: string; goldBright: string;
  cream: string; bg: string;
  ink: string; grey: string; grey2: string;
  line: string; border: string;
};

export type FrontTemplate = {
  key: FrontTemplateKey;
  label: string;
  description: string;
  fonts: { display: FrontFontKey; body: FrontFontKey };
  palette: FrontPalette;
};

export const FRONT_TEMPLATE_KEYS = ["heritage", "meridian", "atelier", "summit", "clarity"] as const;
export type FrontTemplateKey = (typeof FRONT_TEMPLATE_KEYS)[number];

export const FRONT_TEMPLATES: Record<FrontTemplateKey, FrontTemplate> = {
  // The original look — serif display over warm cream, navy + gold.
  heritage: {
    key: "heritage",
    label: "Heritage",
    description: "The original site: pill navigation, hero with the tax calculator, dark how-it-works band — serif navy and gold on warm cream.",
    fonts: { display: "playfair", body: "jakarta" },
    palette: {
      navy: "#1A273F", navyDeep: "#111B2C", navySoft: "#24344F",
      gold: "#C49E54", goldBright: "#D8B368",
      cream: "#F2E9DF", bg: "#FAF8F5",
      ink: "#1A273F", grey: "#5C6672", grey2: "#8A929C",
      line: "#ECE7E0", border: "#E7E2DB",
    },
  },
  // Contemporary and product-led: geometric sans, cool white, electric blue.
  meridian: {
    key: "meridian",
    label: "Meridian",
    description: "Modern product site: flat header, centred hero with stat chips, calculator panel, bento services grid, gradient call-to-action — electric blue on cool white.",
    fonts: { display: "space-grotesk", body: "inter" },
    palette: {
      navy: "#16204A", navyDeep: "#0C1230", navySoft: "#232F63",
      gold: "#3B5BDB", goldBright: "#4C6EF5",
      cream: "#E8EDFB", bg: "#F7F8FC",
      ink: "#141A2E", grey: "#59627D", grey2: "#8B92A8",
      line: "#E6E9F2", border: "#DFE3EE",
    },
  },
  // Understated boutique: high-contrast garamond, plum and bronze on ivory.
  atelier: {
    key: "atelier",
    label: "Atelier",
    description: "Boutique editorial brochure: typographic hero, numbered services index, vertical process — Cormorant Garamond, plum and bronze on ivory, square corners.",
    fonts: { display: "cormorant", body: "manrope" },
    palette: {
      navy: "#38273F", navyDeep: "#251733", navySoft: "#4A3752",
      gold: "#B08D57", goldBright: "#C2A06A",
      cream: "#F3ECE1", bg: "#FBF8F3",
      ink: "#2B2231", grey: "#6E6472", grey2: "#99909C",
      line: "#ECE5DA", border: "#E4DBCC",
    },
  },
  // Confident and heavyweight: Sora, deep green, chunky buttons.
  summit: {
    key: "summit",
    label: "Summit",
    description: "Bold conversion site: dark hero with the calculator, oversized service tiles, accent tool strip, heavy Sora headlines — deep green with emerald.",
    fonts: { display: "sora", body: "jakarta" },
    palette: {
      navy: "#0E2A20", navyDeep: "#071B14", navySoft: "#1A3D30",
      gold: "#128552", goldBright: "#17A263",
      cream: "#E2F1E9", bg: "#F4FAF7",
      ink: "#10231B", grey: "#52655C", grey2: "#83958B",
      line: "#DFEAE3", border: "#D4E2DA",
    },
  },
  // Quiet monochrome: a single family, near-black on white, hairlines.
  clarity: {
    key: "clarity",
    label: "Clarity",
    description: "Swiss minimalism: hairline lists instead of cards, dateline insights, whitespace-heavy hero — Inter throughout, near-black on white.",
    fonts: { display: "inter", body: "inter" },
    palette: {
      navy: "#14161B", navyDeep: "#000000", navySoft: "#262A33",
      gold: "#16181D", goldBright: "#3A404C",
      cream: "#F1F2F4", bg: "#FFFFFF",
      ink: "#16181D", grey: "#5E6572", grey2: "#8D93A0",
      line: "#ECEDF0", border: "#E3E5E9",
    },
  },
};

export function isFrontTemplateKey(v: unknown): v is FrontTemplateKey {
  return typeof v === "string" && (FRONT_TEMPLATE_KEYS as readonly string[]).includes(v);
}

/* ── per-deployment overrides (OrgSettings.frontTheme JSON) ─────────── */
export type FrontThemeOverrides = {
  /** Primary colour — headlines, dark bands (replaces the template's navy). */
  primary?: string;
  /** Accent colour — buttons, links, kickers (replaces the template's gold). */
  accent?: string;
  /** Page background. */
  bg?: string;
  displayFont?: FrontFontKey;
  bodyFont?: FrontFontKey;
};

export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}
function isFontKey(v: unknown): v is FrontFontKey {
  return typeof v === "string" && v in FRONT_FONTS;
}

/** Validate a stored frontTheme JSON blob — a broken row must never break
 *  the public site, so anything unrecognised is silently dropped. */
export function parseFrontOverrides(v: unknown): FrontThemeOverrides {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const o = v as Record<string, unknown>;
  const out: FrontThemeOverrides = {};
  if (isHexColor(o.primary)) out.primary = o.primary;
  if (isHexColor(o.accent)) out.accent = o.accent;
  if (isHexColor(o.bg)) out.bg = o.bg;
  if (isFontKey(o.displayFont)) out.displayFont = o.displayFont;
  if (isFontKey(o.bodyFont)) out.bodyFont = o.bodyFont;
  return out;
}

/* ── colour math (pure; mirrors src/lib/services/branding.ts) ───────── */
function hex2rgb(h: string): [number, number, number] {
  let s = h.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgb2hex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
}
function darken(h: string, p: number): string { const [r, g, b] = hex2rgb(h); return rgb2hex(r * (1 - p), g * (1 - p), b * (1 - p)); }
function tint(h: string, p: number): string { const [r, g, b] = hex2rgb(h); return rgb2hex(r + (255 - r) * p, g + (255 - g) * p, b + (255 - b) * p); }

/** WCAG relative luminance. */
function luminance(h: string): number {
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const [r, g, b] = hex2rgb(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Text colour on the accent (buttons, logo mark): whichever of white or the
 *  template's ink reads better — so a custom accent can never produce
 *  unreadable buttons. */
function onAccent(accent: string, ink: string): string {
  return contrast("#FFFFFF", accent) >= contrast(ink, accent) ? "#FFFFFF" : ink;
}

/* ── resolved theme → CSS custom properties ─────────────────────────
   Applied inline (style={}) on the `.shell-marketing` root, so it wins
   over the static token defaults in globals.css regardless of cascade
   order. Fonts are var() references into the pre-loaded registry. */
export function frontThemeStyle(template: string, overrides: FrontThemeOverrides = {}): Record<string, string> {
  const t = FRONT_TEMPLATES[isFrontTemplateKey(template) ? template : "heritage"];
  const p = { ...t.palette };
  if (isHexColor(overrides.primary)) {
    p.navy = overrides.primary;
    p.navyDeep = darken(overrides.primary, 0.35);
    p.navySoft = tint(overrides.primary, 0.12);
  }
  if (isHexColor(overrides.accent)) {
    p.gold = overrides.accent;
    p.goldBright = tint(overrides.accent, 0.18);
    p.cream = tint(overrides.accent, 0.87);
  }
  if (isHexColor(overrides.bg)) p.bg = overrides.bg;
  const display = FRONT_FONTS[overrides.displayFont ?? t.fonts.display];
  const body = FRONT_FONTS[overrides.bodyFont ?? t.fonts.body];
  return {
    "--mk-navy": p.navy, "--mk-navy-deep": p.navyDeep, "--mk-navy-soft": p.navySoft,
    "--mk-gold": p.gold, "--mk-gold-bright": p.goldBright,
    "--mk-cream": p.cream, "--mk-bg": p.bg,
    "--mk-ink": p.ink, "--mk-grey": p.grey, "--mk-grey-2": p.grey2,
    "--mk-line": p.line, "--mk-border": p.border,
    "--mk-on-accent": onAccent(p.gold, p.ink),
    "--mk-font-display": display.stack,
    "--mk-font-body": body.stack,
  };
}
