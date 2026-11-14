import { supabaseServer } from "@/lib/supabase";
import type { Session } from "@/lib/auth";
import { resolveScope, applyScope } from "@/lib/crm-scope";
import { normalizeEgyptianPhone } from "@/lib/phone";
import { computeLeadScore, computeQualificationStatus } from "@/lib/lead-scoring";
import type { DbLead } from "@/types/admin";

/**
 * The only way any route may fetch a single lead by id. Folds the
 * ownership/scope check into the query itself — an id outside the caller's
 * scope simply matches no row, so it's never fetched or serialized. Returns
 * null (callers should respond 404, not 403) rather than throwing, so a
 * scope mismatch can't be distinguished from "doesn't exist" — an agent
 * can't use this to enumerate which lead ids exist outside their reach.
 */
export async function getLeadForSession(leadId: string, session: Session): Promise<DbLead | null> {
  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");
  const { data, error } = await applyScope(
    supabase.from("leads").select("*").eq("id", leadId),
    scope
  ).maybeSingle();
  if (error || !data) return null;
  return data as DbLead;
}

export interface LeadScoringFields {
  case_size: string | null;
  start_timing: string | null;
  asked_price: boolean;
  opened_messenger: boolean;
  mobile_raw?: string | null;
}

export async function getScoringContext() {
  const supabase = supabaseServer();
  const { data } = await supabase.from("crm_settings").select("scoring_weights, classification_thresholds").eq("id", 1).single();
  return {
    weights: data?.scoring_weights,
    thresholds: data?.classification_thresholds,
  };
}

/** Normalizes phone + computes score/classification/qualification — always server-side, never trusts client-submitted values. */
export async function deriveLeadComputedFields(fields: LeadScoringFields) {
  const phone = normalizeEgyptianPhone(fields.mobile_raw ?? null);
  const { weights, thresholds } = await getScoringContext();

  const { score, classification, breakdown } = computeLeadScore(
    {
      case_size: fields.case_size,
      start_timing: fields.start_timing,
      asked_price: fields.asked_price,
      opened_messenger: fields.opened_messenger,
      has_valid_phone: phone.valid,
    },
    weights,
    thresholds
  );

  const qualification_status = computeQualificationStatus({
    has_any_phone: Boolean(fields.mobile_raw && fields.mobile_raw.trim()),
    has_valid_phone: phone.valid,
    asked_price: fields.asked_price,
  });

  return {
    mobile_normalized: phone.normalized,
    lead_score: score,
    score_breakdown: breakdown,
    classification,
    qualification_status,
  };
}

// ============================================================
// Shared lead filtering — the list endpoint, CSV export and bulk actions
// all go through these two functions, so "the leads matching this filter"
// means exactly the same rows everywhere (what you see is what you archive).
// ============================================================

export type LeadView = "active" | "archived" | "all";

export interface LeadFilter {
  view: LeadView;
  q?: string;
  stage?: string;
  classification?: string;
  qualification_status?: string;
  assigned_to?: string;
  branch_id?: string;
  source?: string;
  service_interest?: string;
  unassigned?: boolean;
  overdue_followups?: boolean;
  no_followup?: boolean;
  needs_review?: boolean;
  date_from?: string; // YYYY-MM-DD inclusive, on entry_date
  date_to?: string;   // YYYY-MM-DD inclusive, on entry_date
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const STRING_FILTER_KEYS = [
  "q", "stage", "classification", "qualification_status", "assigned_to",
  "branch_id", "source", "service_interest",
] as const;
const FLAG_FILTER_KEYS = ["unassigned", "overdue_followups", "no_followup", "needs_review"] as const;

/** Builds a LeadFilter from URL params or a JSON body, dropping anything malformed. */
export function parseLeadFilter(input: URLSearchParams | Record<string, unknown> | null | undefined): LeadFilter {
  const get = (k: string): unknown =>
    !input ? undefined : input instanceof URLSearchParams ? input.get(k) ?? undefined : input[k];

  const viewRaw = get("view");
  const filter: LeadFilter = {
    view: viewRaw === "archived" || viewRaw === "all" ? viewRaw : "active",
  };
  for (const k of STRING_FILTER_KEYS) {
    const v = get(k);
    if (typeof v === "string" && v.trim()) filter[k] = v.trim();
  }
  for (const k of FLAG_FILTER_KEYS) {
    const v = get(k);
    if (v === true || v === "1" || v === "true") filter[k] = true;
  }
  const from = get("date_from");
  const to = get("date_to");
  if (typeof from === "string" && YMD.test(from)) filter.date_from = from;
  if (typeof to === "string" && YMD.test(to)) filter.date_to = to;
  return filter;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase's filter-builder generics don't survive being threaded through a helper; this stays server-internal. */
export function applyLeadFilter(query: any, filter: LeadFilter): any {
  let q = query;
  if (filter.view === "active") q = q.is("archived_at", null);
  else if (filter.view === "archived") q = q.not("archived_at", "is", null);

  for (const col of ["stage", "classification", "qualification_status", "assigned_to", "branch_id", "source", "service_interest"] as const) {
    const v = filter[col];
    if (v) q = q.eq(col, v);
  }
  if (filter.unassigned) q = q.is("assigned_to", null);
  if (filter.overdue_followups) q = q.lt("next_follow_up_at", new Date().toISOString());
  if (filter.no_followup) q = q.is("next_follow_up_at", null);
  if (filter.needs_review) q = q.eq("needs_review", true);
  if (filter.date_from) q = q.gte("entry_date", filter.date_from);
  if (filter.date_to) q = q.lte("entry_date", filter.date_to);

  if (filter.q) {
    // Strip characters that would break out of PostgREST's or() grammar.
    const escaped = filter.q.replace(/[%_,()*\\]/g, "");
    if (escaped) {
      q = q.or(
        `name.ilike.%${escaped}%,mobile_raw.ilike.%${escaped}%,mobile_normalized.ilike.%${escaped}%,lead_code.ilike.%${escaped}%,legacy_id.ilike.%${escaped}%`
      );
    }
  }
  return q;
}

/**
 * Every lead id matching a filter within the session's scope. PostgREST caps
 * a response at 1000 rows, so this pages through. Hard-capped so a runaway
 * bulk action can't touch an unbounded number of rows.
 */
export async function collectLeadIds(session: Session, filter: LeadFilter, cap = 10000): Promise<string[]> {
  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");
  const ids: string[] = [];
  const PAGE = 1000;
  for (let from = 0; from < cap; from += PAGE) {
    const base: any = applyScope(supabase.from("leads").select("id"), scope);
    const { data, error } = await applyLeadFilter(base, filter)
      .order("id", { ascending: true })
      .range(from, Math.min(from + PAGE, cap) - 1);
    if (error) throw new Error(error.message);
    ids.push(...(data ?? []).map((r: { id: string }) => r.id));
    if (!data || data.length < PAGE) break;
  }
  return ids;
}

/** Keeps only the ids this session is allowed to touch (an agent can't bulk-archive someone else's lead by id). */
export async function filterIdsToScope(session: Session, ids: string[]): Promise<string[]> {
  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");
  const allowed: string[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const base: any = applyScope(supabase.from("leads").select("id").in("id", chunk), scope);
    const { data, error } = await base;
    if (error) throw new Error(error.message);
    allowed.push(...(data ?? []).map((r: { id: string }) => r.id));
  }
  return allowed;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
