import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import type { Role, Permission } from "@/lib/permissions";
import { hasPermission as checkPermission } from "@/lib/permissions";

const COOKIE_NAME = "admin_session";
const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "fallback-dev-secret-change-in-prod"
);

interface TokenPayload {
  sub: string; // admin_users.id — "" for the legacy env-password login (no DB user)
  email: string;
  role: Role;
}

export async function createAdminToken(user: TokenPayload): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/** Decodes the JWT only — identity claims, not authorization. See getSession() for the real check. */
async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { sub: payload.sub, email: String(payload.email ?? ""), role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

/**
 * Advisory-only role read for proxy.ts (edge, JWT-only — no DB call).
 * This is a UX redirect-speed optimization, NOT the security boundary: the
 * embedded role can be stale for up to 7 days if an admin changes it.
 * getSession() below is what every API route and the admin layout actually
 * trust, because it re-reads the live row on every call.
 */
export async function getAdvisoryRoleFromRequest(req: NextRequest): Promise<Role | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = await decodeToken(token);
  return decoded?.role ?? null;
}

/** Any valid admin-area session — used by existing (pre-RBAC) admin-only routes. */
export async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
  status: "active" | "disabled";
  allowedBranchIds: string[];
  extraPermissions: Permission[];
  managerId: string | null;
  scopeOverride: "own" | "team" | "all" | null;
}

/**
 * The real authorization boundary. Re-reads role/status/branches/permission
 * exceptions from admin_users on every call (never trusts the JWT's embedded
 * role) so a disabled account or role change takes effect immediately, not
 * after the JWT's 7-day lifetime. cache()-deduped per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = await decodeToken(token);
  if (!decoded) return null;

  // Legacy env-password login has no admin_users row (sub is empty) — treat
  // as an unrestricted admin, matching this app's behavior before RBAC
  // existed. Real per-user scoping only applies to DB-backed accounts.
  if (!decoded.sub) {
    return {
      userId: "",
      email: "",
      name: "Legacy Admin",
      role: "admin",
      status: "active",
      allowedBranchIds: [],
      extraPermissions: [],
      managerId: null,
      scopeOverride: null,
    };
  }

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, email, name, role, status, allowed_branch_ids, extra_permissions, manager_id, scope_override")
      .eq("id", decoded.sub)
      .single();

    if (error || !data) return null;

    return {
      userId: data.id,
      email: data.email,
      name: data.name ?? "",
      role: data.role as Role,
      status: (data.status as "active" | "disabled") ?? "active",
      allowedBranchIds: data.allowed_branch_ids ?? [],
      extraPermissions: (data.extra_permissions ?? []) as Permission[],
      managerId: data.manager_id ?? null,
      scopeOverride: data.scope_override ?? null,
    };
  } catch {
    return null;
  }
});

export function sessionHasPermission(session: Session, permission: Permission): boolean {
  return checkPermission({ role: session.role, extraPermissions: session.extraPermissions }, permission);
}
