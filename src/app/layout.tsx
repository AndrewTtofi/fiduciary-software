import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, IBM_Plex_Mono } from "next/font/google";
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
      "A qualify-first onboarding platform for corporate-services and fiduciary firms: educate prospects, gate consultations behind KYC, and run the whole client relationship from one branded platform.",
    icons: { icon: "/favicon.ico" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { themePreset, accentColor } = await getBranding();
  return (
    <html lang="en" className={`${jakarta.variable} ${playfair.variable} ${plexMono.variable}`}>
      <head>
        {/* White-label theme override — recolours brand/surfaces app-wide. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(themePreset, accentColor) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
