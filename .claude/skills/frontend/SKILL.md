---
name: frontend
description: Frontend conventions for this white-label Next.js 16 / React 19 / Tailwind v4 fiduciary platform. Use this skill whenever you create or edit anything under src/app (pages, layouts, route groups), src/components, globals.css, tailwind.config.ts, or the marketing front-template system — including admin panel screens, client portal screens, the onboarding wizard, the public marketing site, forms, tables, drawers, modals, icons, styling, branding/theme, and Playwright e2e tests. Trigger even when the user just says "add a page", "fix this form", "make the table wider", "change the copy", "add a button", or "restyle X" without naming React or Next.js.
---

# Frontend work in this repo

This repo is a white-label onboarding platform: one deployment serves one firm, and
the firm's name, logo, accent colour and public-site template all come from the
database at request time. Most frontend mistakes here come from forgetting that
(hard-coding a brand, caching something that must be per-request, putting logic in
a client component that only the server can do). Read `CLAUDE.md` first; it wins
over `docs/wiki/*` on stack versions (the wiki still mentions Next 15 / Prisma 5).

## Where things live

| Area | Path | Notes |
|---|---|---|
| Public marketing site | `src/app/(marketing)` | Chrome comes from the active front template (see below) |
| Auth screens | `src/app/(auth)` | login / register / reset |
| Admin console (staff) | `src/app/admin` | Layout calls `requireRole("staff")` |
| Client portal | `src/app/app` | Layout calls `requireUser()`; redirects when client login is disabled |
| Onboarding wizard (prospects) | `src/app/onboarding` | Autosaves via `/api/onboarding/*` |
| API route handlers | `src/app/api` | Mutations go here, not Server Actions |
| Shared components | `src/components/{admin,client,compliance,marketing}` | plus `BrandMark.tsx`, `Icon.tsx` |
| Front templates | `src/lib/front-templates.ts`, `src/components/marketing/templates/*`, `src/app/tpl/*.css` | `src/app/tpl` is CSS only, not routes |
| Styling entry | `src/app/globals.css` → imports `front-templates.css`, `tpl/*.css`, `@config tailwind.config.ts` | Tailwind v4; the `@config` line is required |
| Design tokens | `tailwind.config.ts` (`brand`, `accent`, `ink`, `bone`, `taupe`, `admin.*`, `client.*`, `status.*`) mirrored as CSS vars in `globals.css` | Light-only. No dark mode. |
| Zod schemas shared by form + API | `src/lib/schema/{auth,onboarding,article}.ts` | Import the same schema on both sides |
| Formatting helpers | `src/lib/format.ts` | Only relative-date helpers; no currency module |

## The rules, and why

1. **Pages and layouts are async server components. Push `"use client"` to the smallest leaf.**
   Server components fetch via `src/lib/services/*` and pass typed props down. Client files
   are named for what they do (`*Form.tsx`, `*Table.tsx`, `*Modal.tsx`, `*Panel.tsx`,
   `*Button.tsx`) and live next to their server parent. A client component never imports
   Prisma, `auth()`, or a service.

2. **Never hard-code the firm name, logo, or product name.** Server components call
   `getBranding()` from `src/lib/services/branding.ts` (request-cached) and thread
   `brandName` / `brandMark` / `logo` down as props. Client components cannot call it; if
   you can't thread a prop, use neutral copy ("us", "our team", "the platform"). "ORO" is
   legacy and must not appear in new UI.

3. **Mutations are `fetch()` to `/api/**` then `router.refresh()`.** The route does
   `assertRole()` → `schema.safeParse()` → service call. `revalidatePath`/`revalidateTag`
   are not used anywhere; `router.refresh()` is the refresh mechanism. The only Server
   Action in the repo is the inline sign-out form in `AdminShell` / `ClientShell`. Don't
   introduce Server Actions for CRUD; it would be the only one and would bypass the
   route-level conventions (rate limiting, activity logging) other code relies on.

4. **Authorization is server-side, always.** Guards in `src/lib/auth/guards.ts`:
   `requireUser()` (redirect to `/login`), `requireRole(...roles)` (404, not 403, so admin
   routes aren't probeable), `assertRole(...roles)` (throws; for API routes),
   `requireSuperAdmin()`, `currentIsSuperAdmin()`. Roles are `"prospect" | "client" | "staff"`.
   `useSession` is not used anywhere; compute booleans like `canEditPlan` on the server and
   pass them as props. Hiding a button is UX, not security.

5. **Default to `export const dynamic = "force-dynamic"`** on admin, portal and marketing
   pages. Branding and content are read live from `OrgSettings`, so static rendering would
   freeze one firm's branding into the build. Only skip it with a specific reason.

6. **Use the token system, not ad hoc colours.** Tailwind tokens from `tailwind.config.ts`
   or the CSS vars in `globals.css` for admin/portal; `--mk-*` vars (set by
   `frontThemeStyle()`) for marketing pages so per-deployment palette overrides still
   apply. The accent colour and theme preset are injected per request via `themeCss()` in
   the root layout, so a hard-coded hex silently breaks white-labelling.

7. **Icons come from `src/components/Icon.tsx`** (`<Icon name="shield" className="ic-18" />`,
   registry in `ICON_PATHS`). `AdminShell.tsx` carries its own inline SVG set for the
   sidebar; match whichever the surrounding file already uses rather than adding a third.

8. **Tables: build rows on the server, render with `DataTable`** (`src/components/admin/DataTable.tsx`).
   Cells are pre-rendered `ReactNode[]`; pass a parallel `sort` array for sortable columns
   and `href` or `onRowClick` for row activation. The wrapper `.tbl-wrap` is
   `overflow-x: auto` and `table.tbl` is `width: 100%`; if a table scrolls sideways on
   desktop the cause is usually a container `max-width` or `white-space: nowrap` cells, not
   the table itself.

9. **Images:** raw `<img>` is a documented exception for data-URL logos and arbitrary
   external URLs (`BrandMark.tsx`, `Markdown.tsx`) and carries an eslint-disable comment
   explaining why. For real static assets use `next/image`.

10. **Forms validate with the shared Zod schema on both sides.** Example: `DetailsForm.tsx`
    imports `personalAndIntentSchema` from `src/lib/schema/onboarding.ts` and the API
    route re-parses it. Return `422` with issues for validation failures. Inputs are
    located in e2e tests by `name`, and labels are often not associated via `htmlFor`;
    when you touch a form, add `htmlFor`/`id` pairs. It costs nothing and fixes a known gap.

## Front templates (public site only)

`OrgSettings.frontTemplate` picks one of `heritage | meridian | atelier | summit | clarity`.
Each template is a complete site (`Header`, `Footer`, `Landing`, `fx`) implementing
`TemplateSite` in `src/components/marketing/templates/types.ts`, and every template consumes
the same `LandingData` built once in `src/app/(marketing)/page.tsx`. To add one: register the
key in `FRONT_TEMPLATE_KEYS` + `FRONT_TEMPLATES`, add the folder under `templates/<key>/`,
register it in `templates/index.ts`, add `src/app/tpl/<key>.css` and import it from
`globals.css`. `src/lib/front-templates.ts` must stay client-safe (no Prisma or server
imports) because the admin appearance picker and the live site share it. Changes to shared
marketing blocks must be checked in all five templates, not just the one you're looking at.

## Checklist before you finish

- `npm run typecheck && npm run lint` pass. If you touched `tsconfig*`, `globals.css`
  imports, or dependencies, also run `npm run worker:build` and the prod build command
  from `CLAUDE.md` (PR CI doesn't run the prod build).
- No brand string, no hex colour outside the token system, no `useSession`, no Server
  Action for CRUD, no `revalidatePath`.
- New page has the right guard in its layout or at the top of `page.tsx`.
- Copy is white-label safe and role-appropriate (prospect vs client vs staff wording).
- If behaviour changed, extend an e2e spec in `e2e/*.spec.ts` using helpers from
  `e2e/_fixtures.ts` (`resetAndSeed`, `signInAsStaff`, `registerProspect`). Playwright
  runs with one worker because specs reset a shared dev DB.
- Don't hand-edit `CHANGELOG.md`; release-please generates it from Conventional Commit
  titles.

## Related skills

Load `backend` when the change needs a new API route, service, or schema field, and
`security` before shipping anything that touches auth, documents, public forms, or admin
settings.
