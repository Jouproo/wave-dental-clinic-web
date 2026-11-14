/**
 * Server-side data for the CRM dashboard, follow-ups and reports pages.
 * Lead volume is in the low thousands, so we page through the slim columns
 * once per request and aggregate in JS — every number on a page then comes
 * from the same rows, and every card can link to the leads list with the
 * matching filter.
 */
import { supabaseServer } from "@/lib/supabase";
import type { Session } from "@/lib/auth";
import { resolveScope, type Scope } from "@/lib/crm-scope";
import { normalizeCrmConfig, ymdInTz, type CrmConfig } from "@/lib/crm-config";
import type { LeadStage } from "@/types/admin";

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase's builder generics don't survive being threaded through these helpers; server-internal only. */

export async function getCrmConfig(): Promise<{ config: CrmConfig; stored: boolean }> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("crm_settings").select("config").eq("id", 1).maybeSingle();
  // Missing column (migration not run yet) → defaults; saving reports the missing migration.
  if (error) return { config: normalizeCrmConfig(null), stored: false };
  return { config: normalizeCrmConfig(data?.config), stored: true };
}

export interface LeadRow {
  id: string;
  lead_code: string;
  name: string;
  stage: LeadStage;
  classification: string;
  qualification_status: string;
  source: string | null;
  service_interest: string | null;
  assigned_to: string | null;
  entry_date: string;
  next_follow_up_at: string | null;
  last_contact_at: string | null;
  last_call_result: string | null;
  contact_attempts: number;
  needs_review: boolean;
  loss_reason: string | null;
  mobile_raw: string | null;
  mobile_normalized: string | null;
  whatsapp_normalized: string | null;
  whatsapp_chat_url?: string | null;
  meta_chat_url?: string | null;
  archived_at: string | null;
  created_at: string;
}

const BASE_COLS = "id, lead_code, name, stage, classification, qualification_status, source, service_interest, assigned_to, entry_date, next_follow_up_at, last_contact_at, last_call_result, contact_attempts, needs_review, loss_reason, mobile_raw, mobile_normalized, whatsapp_normalized, archived_at, created_at";
const CHAT_COLS = ", whatsapp_chat_url, meta_chat_url";

function scoped(q: any, scope: Scope, col = "assigned_to"): any {
  if (scope.kind === "own") return q.eq(col, scope.userId);
  if (scope.kind === "team") return q.in(col, scope.userIds);
  return q;
}

/** Every lead in the session's scope (active + archived), slim columns, capped. */
export async function loadLeadRows(scope: Scope, cap = 20000): Promise<LeadRow[]> {
  const sb = supabaseServer();
  let cols = BASE_COLS + CHAT_COLS;
  const rows: LeadRow[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data, error } = await scoped(sb.from("leads").select(cols), scope).order("id").range(from, from + 999);
    if (error) {
      // Chat-link columns are optional (crm_chat_links.sql) — retry without them once.
      if (cols !== BASE_COLS && /whatsapp_chat_url|meta_chat_url/.test(error.message)) { cols = BASE_COLS; from -= 1000; continue; }
      throw new Error(error.message);
    }
    rows.push(...((data ?? []) as LeadRow[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export interface HistoryRow {
  lead_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  changed_at: string;
  reason: string | null;
}

/** Real stage moves (not creation/import rows) between two instants, limited to leads in scope. */
export async function loadStageMoves(scope: Scope, fromIso: string, toIso: string, cap = 20000): Promise<HistoryRow[]> {
  const sb = supabaseServer();
  const out: HistoryRow[] = [];
  for (let from = 0; from < cap; from += 1000) {
    let q: any = sb.from("lead_stage_history")
      .select("lead_id, from_stage, to_stage, changed_by, changed_at, reason, leads!inner(assigned_to)")
      .not("from_stage", "is", null)
      .gte("changed_at", fromIso).lt("changed_at", toIso);
    q = scoped(q, scope, "leads.assigned_to");
    const { data, error } = await q.order("changed_at").range(from, from + 999);
    if (error) break; // history is a nice-to-have on these pages; never fail the page over it
    out.push(...((data ?? []) as HistoryRow[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function loadStaff(): Promise<Map<string, string>> {
  const sb = supabaseServer();
  const { data } = await sb.from("admin_users").select("id, name, email");
  return new Map((data ?? []).map((u: { id: string; name: string | null; email: string }) => [u.id, u.name || u.email]));
}

export async function crmContext(session: Session) {
  const [scope, { config, stored }] = await Promise.all([resolveScope(session, "crm"), getCrmConfig()]);
  const today = ymdInTz(new Date(), config.timezone);
  return { scope, config, stored, today };
}

/** Counts rows by a key, keeping first-seen order unless `order` is given. */
export function countBy<T>(rows: T[], key: (r: T) => string | null | undefined, order?: string[]) {
  const m = new Map<string, number>();
  for (const k of order ?? []) m.set(k, 0);
  for (const r of rows) {
    const k = key(r) ?? "";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([k, count]) => ({ key: k, count }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
