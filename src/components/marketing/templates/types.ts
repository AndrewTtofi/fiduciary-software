import type { SiteContent } from "@/lib/services/content";
import type { ArticleData } from "@/lib/services/articles";
import type { CalcRates } from "@/components/marketing/TaxCalculator";

/* =====================================================================
   Front-face template component contract

   Every template renders a complete public site — its own header, landing
   page composition and footer — from the SAME data: the content-managed
   SiteContent blob, branding, published articles and tool rates. The
   backend (admin content editing, booking, tools, auth) is shared; only
   the presentation differs. See src/lib/front-templates.ts for the
   catalog (fonts/palette) and src/components/marketing/templates/index.ts
   for the registry.
   ===================================================================== */

/** Everything a template's Landing needs — assembled once in
 *  src/app/(marketing)/page.tsx so all five templates stay in lockstep
 *  with the content model. */
export type LandingData = {
  brandName: string;
  /** "Legal Name · HE 123456 · Nicosia, Cyprus" — statutory line for heros. */
  registration: string;
  content: SiteContent;
  articles: ArticleData[];
  rates: CalcRates;
};

type ServerComponent<P> = (props: P) => Promise<React.JSX.Element> | React.JSX.Element;

export type TemplateSite = {
  /** Site chrome — rendered by the (marketing) layout on EVERY public page. */
  Header: ServerComponent<Record<string, never>>;
  Footer: ServerComponent<Record<string, never>>;
  /** The landing page composition. */
  Landing: ServerComponent<{ data: LandingData }>;
  /** Whether the heritage MotionFx decoration layer runs (heritage only —
   *  the other templates carry their own, calmer motion in CSS). */
  fx: boolean;
};
