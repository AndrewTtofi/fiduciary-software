import type { TemplateSite } from "@/components/marketing/templates/types";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Landing } from "./Landing";

/** Summit — bold, conversion-first site: dark header, dark hero, big numbers. */
export const summit: TemplateSite = {
  Header,
  Footer,
  Landing,
  fx: false,
};
