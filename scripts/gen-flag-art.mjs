/* Regenerates src/components/admin/flag-art.ts from country-flag-icons.

   The flags started out hand-drawn, which was a mistake: several were simply
   wrong (Cyprus most obviously) and there is no way to eyeball fifty of them
   for accuracy. They now come from a vetted set, extracted at build time so
   the package stays out of package.json and the artwork lands in the diff
   where it can be reviewed.

   Usage:
     npm i --no-save --legacy-peer-deps country-flag-icons@1.6.20
     node scripts/gen-flag-art.mjs
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "node_modules/country-flag-icons/3x2");
const OUT = path.join(root, "src/components/admin/flag-art.ts");
const COUNTRIES = path.join(root, "src/lib/data/countries.ts");

if (!fs.existsSync(SRC)) {
  console.error("country-flag-icons is not installed. Run:\n  npm i --no-save --legacy-peer-deps country-flag-icons@1.6.20");
  process.exit(1);
}

// Only the jurisdictions the forms can actually produce, so the file does not
// carry artwork nothing can ever select.
const isos = [...new Set([...fs.readFileSync(COUNTRIES, "utf8").matchAll(/iso2: "([A-Z]{2})"/g)].map((m) => m[1]))].sort();

const art = {};
const missing = [];
for (const iso of isos) {
  const p = path.join(SRC, `${iso}.svg`);
  if (!fs.existsSync(p)) { missing.push(iso); continue; }
  const svg = fs.readFileSync(p, "utf8").trim();
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  if (!viewBox) { missing.push(iso); continue; }
  art[iso] = { v: viewBox, d: svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim() };
}

const header = `/* GENERATED FILE — do not edit by hand.

   Flag artwork for ${Object.keys(art).length} jurisdictions, extracted at build time from
   country-flag-icons@1.6.20 (MIT). Generated rather than imported so the
   package is not a runtime dependency and the markup is reviewable in the
   diff. Hand-drawn flags were replaced because their accuracy could not be
   verified — Cyprus in particular was wrong.

   Regenerate:
     npm i --no-save --legacy-peer-deps country-flag-icons@1.6.20
     node scripts/gen-flag-art.mjs
*/

export type FlagArt = { v: string; d: string };

export const FLAG_ART: Record<string, FlagArt> = `;

fs.writeFileSync(OUT, header + JSON.stringify(art) + ";\n");
console.log(`wrote ${Object.keys(art).length} flags → ${path.relative(root, OUT)}`);
if (missing.length) console.warn("no artwork for:", missing.join(", "));
