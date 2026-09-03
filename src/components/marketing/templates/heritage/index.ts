import type { TemplateSite } from "@/components/marketing/templates/types";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Landing } from "./Landing";

/** Heritage — the original site: pill header, navy footer, MotionFx layer. */
export const heritage: TemplateSite = {
  Header: SiteHeader,
  Footer: SiteFooter,
  Landing,
  fx: true,
};
