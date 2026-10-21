import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, getAdvisoryRoleFromRequest } from "@/lib/auth";
import { SALES_ALLOWED_PATH_PREFIXES } from "@/lib/permissions";

function nextWithPathname(req: NextRequest, pathname: string) {
  // admin/layout.tsx (a Server Component with no direct pathname prop) reads
  // this to know whether it's rendering /admin/login, which must stay
  // reachable without a session.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and the favicon/apple-touch-icon routes through
  // without auth — a browser requests these before (or regardless of)
  // login, e.g. while just viewing /admin/login or deciding whether to
  // "Add to Home Screen", and they're cosmetic, not privileged.
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/icon.png" ||
    pathname === "/admin/apple-icon.png"
  ) {
    return nextWithPathname(req, pathname);
  }

  const authed = await isAdminAuthenticated(req);
  if (!authed) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Advisory-only role gate (edge, JWT claim — no DB call). This exists to
  // bounce sales roles away from clearly-disallowed pages instantly; it is
  // NOT the security boundary. The real, DB-backed check (which also
  // catches a disabled account or a role change immediately, unlike this
  // JWT-only check) lives in src/app/admin/layout.tsx and in every CRM API
  // route via getSession()/sessionHasPermission().
  const role = await getAdvisoryRoleFromRequest(req);
  if (role === "sales_manager" || role === "sales_agent") {
    const allowed = SALES_ALLOWED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (!allowed) {
      return NextResponse.redirect(new URL("/admin/crm", req.url));
    }
  }

  return nextWithPathname(req, pathname);
}

export const config = {
  matcher: ["/admin/:path*"],
};
