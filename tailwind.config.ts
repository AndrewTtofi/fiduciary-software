import type { Config } from "tailwindcss";

/**
 * ORO — Mediterranean private-bank design system.
 *
 * Palette: warm ivory paper, ink, brushed champagne gold, taupe shadow,
 * oxblood for danger. Distinct admin/client/marketing chromes but all
 * share the same tonal family — refined rather than utilitarian.
 *
 * Typography: Fraunces (variable serif, optical sizing) for display;
 * Manrope for body; IBM Plex Mono for figures and metadata.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "48px",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1240px",
        "2xl": "1480px",
      },
    },
    extend: {
      colors: {
        // Shared tonal anchors
        accent: "#B08D3E",         // brushed champagne gold
        "accent-deep": "#8A6B26",
        "accent-soft": "#E9DDBE",
        ink: "#1A1612",            // warm-black, never #000
        bone: "#FBF8F2",           // paper, never #FFF
        taupe: "#6B6256",
        oxblood: "#7A1F1F",

        // Legacy shared name kept for backwards compat
        dark: "#1A1612",

        // Admin chrome
        admin: {
          bg: "#F2EDE4",
          surface: "#FBF8F2",
          fg: "#1A1612",
          muted: "#7A7060",
          border: "#E5DDC9",
        },

        // Client / marketing chrome
        client: {
          bg: "#F5EFE3",
          surface: "#FBF8F2",
          fg: "#1A1612",
          muted: "#7A7060",
          border: "#E5DDC9",
        },

        // Status — muted, never saturated
        status: {
          "pending-bg": "#F1E4C5",
          "pending-fg": "#6E4F12",
          "approved-bg": "#D9E1CC",
          "approved-fg": "#3A4D2A",
          "info-bg": "#D9E1E5",
          "info-fg": "#2A3D49",
          "done-bg": "#E8E2D5",
          "done-fg": "#4B4338",
          danger: "#7A1F1F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "'Cormorant Garamond'", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        h1: ["clamp(56px, 7vw, 104px)", { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        h2: ["clamp(40px, 4.5vw, 64px)", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        h3: ["28px", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        lead: ["20px", { lineHeight: "1.55", letterSpacing: "-0.005em" }],
        body: ["16px", { lineHeight: "1.65" }],
        meta: ["13px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        eyebrow: ["11px", { lineHeight: "1.4", letterSpacing: "0.22em" }],
      },
      borderRadius: {
        card: "2px",
        elem: "2px",
        inner: "1px",
        pill: "999px",
      },
      boxShadow: {
        "card-soft": "0 1px 0 rgba(229,221,201,0.6), 0 24px 48px -32px rgba(60,40,16,0.18)",
        "card-hover": "0 1px 0 rgba(229,221,201,0.8), 0 40px 80px -28px rgba(60,40,16,0.22)",
        "inset-line": "inset 0 -1px 0 rgba(229,221,201,1)",
        gold: "0 0 0 1px rgba(176,141,62,0.4), 0 8px 32px -8px rgba(176,141,62,0.35)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-luxe": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "900": "900ms",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(12px)" },
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
        "fade-rise": "fade-rise 900ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "draw-line": "draw-line 700ms cubic-bezier(0.65, 0, 0.35, 1) both",
        "shimmer": "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
