import type { FrontTemplateKey } from "@/lib/front-templates";
import type { TemplateSite } from "./types";
import { heritage } from "./heritage";
import { meridian } from "./meridian";
import { atelier } from "./atelier";
import { summit } from "./summit";
import { clarity } from "./clarity";

export type { LandingData, TemplateSite } from "./types";

/** Template key → complete site (header, landing composition, footer).
 *  Every entry consumes the same content model and services; only the
 *  presentation differs. The (marketing)/(auth) layouts and the landing
 *  page pick from here by OrgSettings.frontTemplate. */
const SITES: Record<FrontTemplateKey, TemplateSite> = {
  heritage,
  meridian,
  atelier,
  summit,
  clarity,
};

export function getTemplateSite(key: FrontTemplateKey): TemplateSite {
  return SITES[key] ?? SITES.heritage;
}
