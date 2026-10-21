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
