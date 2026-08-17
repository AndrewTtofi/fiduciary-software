import { LegalPage } from "@/components/marketing/LegalPage";
import { getServerBranding } from "@/lib/services/branding-server";

export const metadata = { title: "Cookie Policy" };

export default async function CookiesPage() {
  const { legalName, contactEmail } = await getServerBranding();
  return (
    <LegalPage
      title="Cookie Policy"
      updated="17 August 2026"
      legalName={legalName}
      contactEmail={contactEmail}
      intro={`This Policy explains how ${legalName} uses cookies and similar technologies on this website, and the choices you have.`}
      sections={[
        { h: "What cookies are", p: ["Cookies are small text files placed on your device by a website. They let the site remember your choices between pages and visits, and help us understand how the site is used."] },
        { h: "Cookies we use", p: [
          "Strictly necessary: a session cookie that keeps you signed in to the client portal (only if you have an account), and a cookie that remembers whether you have accepted or declined analytics cookies. These cannot be switched off because the site does not work without them.",
          "Analytics and marketing: only if you accept them in the cookie banner, we may load Google Analytics and the Meta pixel to understand which pages are read and which enquiries come from which channel. These are off by default and never load before you choose.",
        ] },
        { h: "Third parties", p: ["The embedded map on the Contact page is served by Google and may set its own cookies when it loads. Links to WhatsApp open in the WhatsApp app or website, which is governed by WhatsApp's own policies."] },
        { h: "Your choices", p: ["You can accept or decline analytics cookies in the banner shown on your first visit, and change your mind at any time by clearing the site's cookies in your browser, after which the banner appears again. Blocking strictly necessary cookies in your browser may prevent the client portal from working."] },
        { h: "More information", p: [`How we use personal data more generally, and your rights, are set out in our Privacy Policy. Questions about cookies can be sent to ${legalName}${contactEmail ? ` at ${contactEmail}` : ""}.`] },
      ]}
    />
  );
}
