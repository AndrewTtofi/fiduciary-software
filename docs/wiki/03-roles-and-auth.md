# 03 — Roles, authentication, sessions

## Roles

There are four roles, defined in the `Role` enum in `prisma/schema.prisma`:

| Role | Lives in | Lands on after login | Can access |
|---|---|---|---|
| `prospect` | every signup before submission | `/onboarding` | their own wizard only |
| `client` | post-conversion users | `/app` | client portal |
| `staff` | internal team | `/admin` | full admin panel |
| `partner` | external partners (e.g. lawyers) | `/partner` | restricted partner workspace |

A user has exactly one role. Conversion of a prospect into a client
*upgrades* the role on the same `User` row inside a transaction — the
session is then refreshed by the next request.

## Sign-in & sign-up

The same page at `/login` hosts two tabs:

1. **Sign In** — credentials provider (email + password, argon2id).
2. **Create Account** — `POST /api/auth/register` with the
   `registerSchema` payload. Creates a `User` with role `prospect`.

### Dev vs prod

In `NODE_ENV=development`, `registerProspect` sets `emailVerified: new Date()`
and the AuthTabs UI auto-signs the user in immediately. In production the
user receives an email containing `/verify/<rawToken>` and is bounced to
`/verify-sent` until they click it.

### Role-aware landing

`AuthTabs.tsx` looks up the session role after sign-in and picks the
landing path:

```ts
switch (s?.user?.role) {
  case "staff":   return "/admin";
  case "partner": return "/partner";
  case "client":  return "/app";
  default:        return "/onboarding";
}
```

If the URL has a `?next=` parameter, that wins.

## Guards

Every server-side surface that does anything sensitive calls a guard
from `src/lib/auth/guards.ts`:

```ts
// Throw if not signed in.
const user = await requireUser();

// Throw if not signed in OR role is wrong.
const user = await requireRole("staff");
const user = await requireRole("staff", "partner");

// Same as requireRole but with a friendlier error type for routes.
const user = await assertRole("staff");
```

Server Components call these at the top of the function. Route handlers
call them before parsing any body. Client-side checks (route group
layouts, conditional UI) are purely cosmetic — the server check is what
actually protects data.

### Deactivated users

`User.deactivatedAt` is set when staff deactivate someone via
`/admin/settings/team`. The credentials provider in `src/lib/auth/index.ts`
rejects login attempts on a deactivated user even if the password is
correct. This is the lever that revokes access for ex-staff.

### Email verification

If `emailVerified` is null, the credentials provider returns
`UnverifiedEmail` and the login fails. The verification token table
(`VerificationToken`) stores a hashed token; the raw token only exists
inside the email link itself.

## Sessions

Auth.js uses JWT-based sessions (no DB session table is consulted on each
request, but `Session` exists in the schema for adapter compatibility).
The token carries `id`, `email`, `fullName`, `role`. The role in the
token is set at sign-in and refreshed when the role changes (conversion).

## Password resets

`POST /api/auth/forgot` → always returns `ok: true` (to avoid enumeration).
If the email exists, a `PasswordReset` row is created and an email is
sent. `POST /api/auth/reset` consumes the hashed token, sets a new
password hash, and marks the row `usedAt`. Tokens expire after one hour.

## Why not OAuth?

Google + LinkedIn OAuth providers are wired but disabled by default. The
project owner explicitly chose not to provision client IDs for the MVP;
the env loader reports them as off via `features.googleOAuth` and the
sign-in form hides the buttons. Switching them on is a settings task,
not a code change.

## Test-only auth

`POST /api/test/reset` and `POST /api/test/setup-client` are gated by
`process.env.NODE_ENV === "test"` *or* `ALLOW_TEST_RESET=1`. They never
appear in production. They exist so Playwright specs can deterministically
seed and clear state. See [17 — Testing](./17-testing-and-deployment.md).
