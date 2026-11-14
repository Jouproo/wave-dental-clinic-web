import { supabaseServer } from "@/lib/supabase";
import { getScoringContext } from "@/lib/crm-leads";
import type { ImportContext, ParsedLeadRow } from "@/lib/crm-import";

export async function loadImportContext(): Promise<ImportContext> {
  const supabase = supabaseServer();
  const [{ weights, thresholds }, branchesRes, usersRes] = await Promise.all([
    getScoringContext(),
    supabase.from("branches").select("id, name, slug"),
    supabase.from("admin_users").select("id, name, email").eq("status", "active"),
  ]);
  return {
    weights: weights && Object.keys(weights).length ? weights : undefined,
    thresholds: thresholds && Object.keys(thresholds).length ? thresholds : undefined,
    branches: branchesRes.data ?? [],
    users: usersRes.data ?? [],
  };
}

export interface ExistingMatch {
  id: string;
  lead_code: string;
  name: string;
  archived: boolean;
  matchedBy: "legacy_id" | "phone";
}

/**
 * Finds leads already in the CRM that match an import row — by the sheet's
 * own ID or by normalized phone (the same person submitting a form twice,
 * or appearing in two different exports, is the most common duplicate).
 * Searches the archive too: a returning archived lead is a duplicate, not a
 * new lead. Unscoped on purpose — imports are admin-level and must see all.
 */
export async function findExistingLeads(rows: ParsedLeadRow[]): Promise<Map<number, ExistingMatch>> {
  const supabase = supabaseServer();
  const legacyIds = [...new Set(rows.map((r) => r.legacy_id).filter((x): x is string => Boolean(x)))];
  const phones = [...new Set(rows.map((r) => r.mobile_normalized).filter((x): x is string => Boolean(x)))];

  type Row = { id: string; lead_code: string; name: string; archived_at: string | null; legacy_id: string | null; mobile_normalized: string | null };
  const byLegacy = new Map<string, Row>();
  const byPhone = new Map<string, Row>();
  const CHUNK = 150;

  for (let i = 0; i < legacyIds.length; i += CHUNK) {
    const { data, error } = await supabase.from("leads").select("id, lead_code, name, archived_at, legacy_id, mobile_normalized").in("legacy_id", legacyIds.slice(i, i + CHUNK));
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as Row[]) if (r.legacy_id) byLegacy.set(r.legacy_id, r);
  }
  for (let i = 0; i < phones.length; i += CHUNK) {
    const { data, error } = await supabase.from("leads").select("id, lead_code, name, archived_at, legacy_id, mobile_normalized").in("mobile_normalized", phones.slice(i, i + CHUNK)).order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as Row[]) if (r.mobile_normalized && !byPhone.has(r.mobile_normalized)) byPhone.set(r.mobile_normalized, r);
  }

  const result = new Map<number, ExistingMatch>();
  for (const row of rows) {
    const legacyHit = row.legacy_id ? byLegacy.get(row.legacy_id) : undefined;
    const phoneHit = row.mobile_normalized ? byPhone.get(row.mobile_normalized) : undefined;
    const hit = legacyHit ?? phoneHit;
    if (hit) {
      result.set(row.rowNumber, {
        id: hit.id, lead_code: hit.lead_code, name: hit.name,
        archived: Boolean(hit.archived_at), matchedBy: legacyHit ? "legacy_id" : "phone",
      });
    }
  }
  return result;
}
