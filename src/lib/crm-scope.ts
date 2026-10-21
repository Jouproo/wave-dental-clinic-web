import { supabaseServer } from "@/lib/supabase";
import type { Session } from "@/lib/auth";

export type ScopeDomain = "crm" | "bookings" | "financial";

export type Scope =
  | { kind: "all" }
  | { kind: "team"; userIds: string[] }
  | { kind: "own"; userId: string };

/**
 * Resolves a session's data scope for a given domain. Takes a domain
 * parameter from day one — even though only "crm" is used in Phase A — so a
 * later "financial" domain with stricter rules (e.g. a sales_manager getting
 * "team" on leads but only "own" on revenue) never requires touching this
 * function's callers, only adding a branch here.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- domain is intentionally unused in Phase A; kept in the signature now so a later "financial" domain with different rules never requires changing every call site, only this function's body.
export async function resolveScope(session: Session, _domain: ScopeDomain): Promise<Scope> {
  if (session.role === "admin") return { kind: "all" };

  const effective = session.scopeOverride ?? (session.role === "sales_manager" ? "team" : "own");

  if (effective === "all") return { kind: "all" };

  if (effective === "team") {
    const supabase = supabaseServer();
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("manager_id", session.userId);
    const teamIds = (data ?? []).map((r: { id: string }) => r.id);
    return { kind: "team", userIds: [session.userId, ...teamIds] };
  }

  return { kind: "own", userId: session.userId };
}

/**
 * Applies a resolved scope to a Supabase query builder. Used identically for
 * list queries, count queries, and exports so there is exactly one place
 * that decides "which rows can this session see" — never re-derived ad hoc
 * per route.
 */
export function applyScope<T extends { eq: (col: string, val: unknown) => T; in: (col: string, vals: unknown[]) => T }>(
  query: T,
  scope: Scope,
  column: string = "assigned_to"
): T {
  if (scope.kind === "own") return query.eq(column, scope.userId);
  if (scope.kind === "team") return query.in(column, scope.userIds);
  return query;
}
