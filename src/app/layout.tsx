import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// "Quiet Authority" — system-sans character. Manrope drives both body and
// display (headings are bold sans, no serif); IBM Plex Mono for figures/IDs.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "ORO Corporate Services · Private Counsel · Cyprus",
    template: "%s · ORO",
  },
  description:
    "Private corporate counsel for international principals. Discreet incorporation, fiduciary administration, tax residency, and family-office services from Cyprus.",
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
