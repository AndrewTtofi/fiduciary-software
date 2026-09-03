---
name: security
description: Security review and secure-coding rules for this fiduciary onboarding platform (Next.js 16, next-auth v5, Prisma 7, AES-256-GCM document storage, single-tenant white-label deployments). Use this skill before shipping any change that touches authentication, sessions, tokens or magic links, roles and permissions, API routes, admin settings, public or unauthenticated endpoints, file upload or download, KYC/compliance data, emails with links, env vars or secrets, deploy scripts, or dependencies. Also use it when the user asks "is this safe", "review this for security", "audit", "pentest", "can a client see another client's data", or asks to add invites, activation links, password flows, exports of personal data, or anything handling PII. If in doubt, load it; the cost of a missed check here is a leaked passport scan.
---

# Security in this repo

This platform stores identity documents, KYC answers and sanctions-screening results
for one firm's clients. The threat model that matters: a prospect or client reaching
another person's data, a stranger reaching the admin console, documents leaving the
encrypted store, and public forms being abused. Everything below is grounded in the
current code; where the wiki disagrees with code, the code wins (the wiki still
describes four roles and an email-verification flow that no longer exist).

## How auth actually works

- **Sessions:** next-auth v5, JWT strategy, 7-day max age, configured in
  `src/lib/auth/index.ts`. Credentials provider uses argon2id; accounts are created
  pre-verified because outbound email isn't guaranteed. Prospect/client login is
  switched off entirely when `OrgSettings.clientLoginEnabled` is false.
- **Roles:** `prospect | client | staff` (Prisma `Role`). A super admin is any staff
  user whose email is in `SUPER_ADMIN_EMAILS`; it gates operator settings (plan tier,
  front template, tools) via `isSuperAdmin()` / `requireSuperAdmin()`.
- **Page protection:** `src/middleware.ts` covers `/app`, `/admin`, `/onboarding` and
  rewrites unauthorized users to 404. It does **not** cover `/api`.
- **Route protection:** every non-public route calls `assertRole(...)` from
  `src/lib/auth/guards.ts` before reading the body. `requireRole()` in server components
  returns 404 rather than 403 on purpose so admin surfaces aren't probeable. Keep that.
- **Intentionally public routes:** `health`, `ready`, `leads`, `leads/referral`,
  `bookings/public-slots`, `media/[id]`, `auth/register`, `auth/[...nextauth]`,
  `auth/reset`, and the test-only `test/*` routes gated by `NODE_ENV=test` or
  `ALLOW_TEST_RESET=1`. Adding to this list is a design decision; say so in the PR.
- **Token flows to copy:** `src/lib/services/auth-flows.ts`. Tokens are
  `crypto.randomBytes(32)` base64url, stored only as a SHA-256 hash, expiring,
  single-use via `usedAt`, delivered in a link built from `env().APP_URL`. The team-invite
  flow there is the template for any invite / activation / magic-link feature. The
  `VerificationToken` table exists but is unused; the `PasswordReset` model is the live
  one. Regenerating a link must invalidate the previous token. The post-call
  activation link (`src/lib/services/lead-activation.ts`, redeemed by the
  `activation` credentials provider) follows the same rules and is the reference
  for any flow that signs someone in from a link.

## Invariants a change must not break

1. A route that touches non-public data starts with `assertRole(...)`; a server page
   with `requireRole(...)` / `requireUser()`.
2. Every lookup by an id from the request (`params.id`, `prospectId`, `clientId`,
   `documentId`, `leadId`) is followed by an ownership check for non-staff users. Reference
   patterns: `authorizeDocAccess()` in `src/app/api/documents/[id]/route.ts` and the thread
   check in `src/app/api/messages/route.ts`. Never trust a client-supplied `userId`.
3. Operator-only settings require `isSuperAdmin(user)` on top of `assertRole("staff")`,
   returning 403 with the existing "Only a super admin can ..." message.
4. Documents go through `storage()` (`src/lib/providers/storage.ts`, AES-256-GCM,
   random IV per file, key from `ENCRYPTION_KEY_B64`). No plaintext writes, no presigned
   or public URLs to a `storageKey`, downloads only via `/api/documents/[id]` with
   `Cache-Control: private, no-store` and `nosniff`, and `logActivity("document.viewed")`
   on every read.
5. All request input is Zod-validated before use. Uploads enforce the MIME allowlist and
   size cap server-side (`uploadDocument()` in `src/lib/services/documents.ts`); storage
   keys are server-generated and validated against `..` and a strict charset.
6. Public POST routes carry `rateLimit()` (`src/lib/rate-limit.ts`, per-IP). New public
   endpoints add a bucket. The limiter is process-local and disabled when
   `ALLOW_TEST_RESET=1`, which must never be set in production.
7. Raw SQL is tagged-template `$queryRaw` only; `$executeRawUnsafe` stays confined to
   the test reset route.
8. `dangerouslySetInnerHTML` only with server-generated or `JSON.stringify`'d content.
   Email HTML escapes every interpolated user string (`esc()` in `auth-flows.ts`,
   `escapeHtml()` in `booking.ts` / `messages.ts`).
9. Secrets (`AUTH_SECRET`, `ENCRYPTION_KEY_B64`, `SUPER_ADMIN_PASSWORD`, SMTP/S3/OAuth
   creds) come only from env via `src/lib/env.ts` and the deploy's `.env` written by
   `deploy/deploy-oro.sh` from GitHub secrets. Never log them, never return them in an
   error, never commit them. Only `NEXT_PUBLIC_GA4_ID` and `NEXT_PUBLIC_META_PIXEL_ID` are
   exposed client-side; don't add a `NEXT_PUBLIC_` var that carries anything sensitive.
10. Password hashing stays argon2id. Password reset and login never reveal whether an
    email exists, except register's deliberate 409 which is documented in the route.
11. `secureCookie` is derived from the `AUTH_URL` scheme in both `src/lib/auth/index.ts`
    and `src/middleware.ts` because this deployment can run over plain HTTP. Change both
    or neither, or every user gets locked out.
12. `logActivity()` `meta` is free-form JSON. Don't put passport numbers, document
    contents, raw KYC answers or tokens in it.
13. Security headers live in `next.config.ts` and are duplicated in `deploy/Caddyfile`
    (nosniff, frame-deny, referrer-policy, permissions-policy, HSTS). Don't remove any.
    There is no global CSP yet; if you render less-trusted HTML, add a scoped one like
    `/api/media/[id]` does.
14. Never hard-code a firm name in security-sensitive copy either; use branding so an
    email or error can't reveal which firm's platform this is when it shouldn't.

## Review checklist for a PR

Work through this literally and quote the file:line for each answer.

- Which routes/pages changed? Does each start with a guard? Which are public, and why?
- For each id read from the request, where is the ownership check?
- Is any new setting operator-only? Is `isSuperAdmin` checked?
- Where is the Zod schema for every new input, and what are its length caps?
- New public endpoint: which `rateLimit` bucket, limit and key?
- New token or link: random 32 bytes? hashed at rest? expiry? single-use? revoked on
  resend? bound to a specific record (lead/prospect/user id) server-side? What happens on
  expired, used, and already-activated?
- New email: is every interpolated value escaped? Does the link use `APP_URL`?
- New file handling: through `storage()`? MIME and size checked server-side? Activity
  logged?
- Any `dangerouslySetInnerHTML`, `$executeRaw`, `fetch()` to a user-influenced URL,
  `redirect(next)` with an unvalidated target?
- Any new env var in `env.ts` with the right required/optional split, and the Dockerfile
  build placeholder still sufficient?
- Any export of personal data (CSV/XLSX): staff-only, ownership-scoped, not cached,
  `Content-Disposition: attachment`, and does it include only the columns the feature
  needs?
- Dependency bump: does `--legacy-peer-deps` hide a real peer conflict? Run `npm audit`.

## Known gaps (verified as of this writing, not fixed)

Mention these when relevant so nobody assumes they're covered:

- Credential login has no rate limit. A `"login"` bucket exists in `rate-limit.ts` but
  nothing calls it, so `/api/auth/callback/credentials` is open to brute force in-app.
- Uncaught `assertRole` throws produce a 500, not 401/403, on API routes.
- Upload MIME checks trust the browser-declared type; there's no magic-byte sniffing.
- No CAPTCHA or honeypot on public forms; rate limiting is the only abuse control.
- No global Content-Security-Policy.
- The `?next=` parameter in `src/app/(auth)/login/AuthTabs.tsx` is passed to
  `router.push` without an allowlist; add a same-origin relative-path check if you touch
  it.
- `.ics` generation in `src/lib/services/booking.ts` hasn't been reviewed for CRLF
  injection from user-supplied names or notes.

## Output format when asked for a security review

```
## Summary        (one paragraph: safe to merge / needs changes)
## Findings       (severity, file:line, what, why it matters, fix)
## Verified OK    (the checks that passed, briefly)
## Not verified   (what you couldn't confirm and how to)
```

Severity: **High** = cross-user data access, auth bypass, secret exposure, plaintext PII;
**Medium** = missing rate limit, weak token, unescaped email HTML, missing audit log;
**Low** = header hygiene, stale docs, defence-in-depth.

## Related skills

`backend` for how routes and services are structured; `frontend` for where client
components must not do authorization.
