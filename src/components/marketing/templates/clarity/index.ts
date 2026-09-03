import type { TemplateSite } from "@/components/marketing/templates/types";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";

/** Clarity — minimal monochrome site: hairlines, whitespace, no decoration. */
export const clarity: TemplateSite = {
  Header,
  Footer,
  Landing,
  fx: false,
};
