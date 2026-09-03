import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans, Playfair_Display, IBM_Plex_Mono,
  Inter, Manrope, Space_Grotesk, Sora, Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";
import { getBranding, themeCss } from "@/lib/services/branding";

// Brand type: Plus Jakarta Sans drives body/UI, Playfair Display carries
// marketing display headings, IBM Plex Mono for figures/IDs.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});

// Front-template font registry (src/lib/front-templates.ts). next/font can't
// load a family picked from the DB at request time, so every selectable family
// is declared here with `preload: false` — @font-face is lazy, so a browser
// only downloads the families the active template's CSS actually uses.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--gf-inter", preload: false });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--gf-manrope", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--gf-space-grotesk", preload: false });
const sora = Sora({ subsets: ["latin"], display: "swap", variable: "--gf-sora", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", variable: "--gf-cormorant", preload: false, weight: ["400", "500", "600", "700"] });

const fontVars = [jakarta, playfair, plexMono, inter, manrope, spaceGrotesk, sora, cormorant]
  .map((f) => f.variable)
  .join(" ");

// Branding (name/theme) is read from the DB per request so white-label changes
// apply live across every page without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { brandName } = await getBranding();
  return {
    title: {
      default: `${brandName} · Corporate Services`,
      template: `%s · ${brandName}`,
    },
    description:
      "Relocate to Cyprus without the guesswork: tax residency and Non-Dom, immigration and work permits, citizenship, company formation and accounting, with the route mapped before you commit to anything.",
    icons: { icon: "/favicon.ico" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { themePreset, accentColor } = await getBranding();
  return (
    <html lang="en" className={fontVars}>
      <head>
        {/* White-label theme override — recolours brand/surfaces app-wide. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(themePreset, accentColor) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
