import type { Config } from "tailwindcss";

/**
 * ORO — "Quiet Authority" design system (ported from the platform prototype).
 *
 * Palette: indigo brand (#2E4A8B) with a champagne-gold accent (#C9A86A),
 * cool light-gray surfaces, navy ink. Unified chrome across admin/client/
 * marketing — modern SaaS platform rather than warm private-bank.
 *
 * Typography: system sans for everything (display + body); monospace for
 * figures, IDs and metadata. Restrained, tabular numerals.
 *
 * Token names below are kept stable (ink/bone/accent/admin/client/status…)
 * so existing utility usages re-skin to the new values without edits.
 */
const SANS = [
  "var(--font-body)",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "system-ui",
  "Roboto",
  "Helvetica Neue",
  "Arial",
  "sans-serif",
];

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        // Brand (indigo) + gold accent
        brand: "#2E4A8B",
        "brand-dark": "#1E3164",
        "brand-50": "#EBEFF8",
        accent: "#C9A86A",          // champagne gold
        "accent-deep": "#A8843F",
        "accent-soft": "#F1E8D6",

        // Ink / paper / neutrals
        ink: "#10182A",             // navy-black text
        bone: "#FFFFFF",            // surface
        "surface-2": "#F1F3F7",
        taupe: "#5A6478",           // muted text
        "border-strong": "#CBD2DE",
        oxblood: "#B42318",         // danger

        // Legacy alias
        dark: "#10182A",

        // Admin chrome (cool, unified)
        admin: {
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          fg: "#10182A",
          muted: "#5A6478",
          border: "#E3E7EE",
        },

        // Client / marketing chrome (same cool family)
        client: {
          bg: "#F7F8FA",
          surface: "#FFFFFF",
          fg: "#10182A",
          muted: "#5A6478",
          border: "#E3E7EE",
        },

        // Status — prototype tints
        status: {
          "pending-bg": "#FBF1E3",
          "pending-fg": "#B5751B",
          "approved-bg": "#E6F2EC",
          "approved-fg": "#1F7A4D",
          "info-bg": "#EBEFF8",
          "info-fg": "#2E4A8B",
          "done-bg": "#F1F3F7",
          "done-fg": "#5A6478",
          danger: "#B42318",
        },
      },
      fontFamily: {
        display: SANS,
        body: SANS,
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      fontSize: {
        // Cool, restrained sans scale (1.25 modular)
        display: ["clamp(2.25rem, 4vw, 3.052rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        h1: ["clamp(1.9rem, 3vw, 2.441rem)", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        h2: ["1.953rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h3: ["1.563rem", { lineHeight: "1.25", letterSpacing: "-0.015em" }],
        h4: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        lead: ["1.125rem", { lineHeight: "1.55" }],
        body: ["1rem", { lineHeight: "1.6" }],
        meta: ["0.875rem", { lineHeight: "1.5" }],
        eyebrow: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        card: "8px",
        elem: "6px",
        inner: "4px",
        pill: "999px",
      },
      boxShadow: {
        "card-soft": "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.04)",
        "card-hover": "0 2px 4px rgba(16,24,40,.05), 0 12px 24px rgba(16,24,40,.08)",
        "inset-line": "inset 0 -1px 0 #E3E7EE",
        gold: "0 0 0 1px rgba(201,168,106,.4), 0 8px 24px -8px rgba(201,168,106,.35)",
        focus: "0 0 0 3px #EBEFF8, 0 0 0 1px #2E4A8B",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-luxe": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "400": "240ms",
        "600": "320ms",
        "900": "320ms",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "draw-line": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "draw-line": "draw-line 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "shimmer": "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
