import type { TemplateSite } from "@/components/marketing/templates/types";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";

/** Meridian — modern product-led site: flat header, bento grid, light footer. */
export const meridian: TemplateSite = {
  Header,
  Footer,
  Landing,
  fx: false,
};
