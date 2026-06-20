import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes: { prefix: string; roles: string[] }[] = [
  { prefix: "/app",     roles: ["prospect", "client", "staff", "partner"] },
  { prefix: "/admin",   roles: ["staff"] },
  { prefix: "/partner", roles: ["partner"] },
  { prefix: "/onboarding", roles: ["prospect", "client", "staff"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const guard = protectedPrefixes.find((g) => pathname === g.prefix || pathname.startsWith(`${g.prefix}/`));
  if (!guard) return NextResponse.next();

  // Cookie security must mirror the scheme NextAuth actually uses to SET the
  // cookie, which is derived from AUTH_URL — NOT from NODE_ENV. This deployment
  // serves prod over plain HTTP, so NextAuth sets the non-secure
  // `authjs.session-token`; with secureCookie keyed to NODE_ENV, getToken would
  // look for `__Secure-authjs.session-token`, never find it, and bounce every
  // authenticated user back to /login. Tying it to the AUTH_URL scheme keeps
  // middleware and the auth handler in agreement, and auto-upgrades to secure
  // cookies if/when AUTH_URL becomes https://.
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: authUrl.startsWith("https://"),
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!guard.roles.includes(String(token.role))) {
    // Hide the existence of admin/partner surfaces from the wrong role.
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/partner/:path*", "/onboarding/:path*"],
};
