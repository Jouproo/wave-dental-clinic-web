import { NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { normalizeCrmConfig } from "@/lib/crm-config";
import { normalizeEgyptianPhone } from "@/lib/phone";
import {
  computeLeadScore, computeQualificationStatus,
  DEFAULT_SCORING_WEIGHTS, DEFAULT_CLASSIFICATION_THRESHOLDS,
  type ScoringWeights, type ClassificationThresholds,
} from "@/lib/lead-scoring";

async function guard() {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.settings.manage")) return null;
  return session;
}

const num = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1000 ? Math.round(n) : fallback;
};

function cleanWeights(raw: unknown): ScoringWeights {
  const r = (raw ?? {}) as Partial<ScoringWeights>;
  const d = DEFAULT_SCORING_WEIGHTS;
  const map = (src: unknown, def: Record<string, number>) =>
    Object.fromEntries(Object.keys(def).map((k) => [k, num((src as Record<string, unknown> | undefined)?.[k], def[k])]));
  return {
    case_size: map(r.case_size, d.case_size),
    start_timing: map(r.start_timing, d.start_timing),
    asked_price: num(r.asked_price, d.asked_price),
    opened_messenger: num(r.opened_messenger, d.opened_messenger),
    valid_phone: num(r.valid_phone, d.valid_phone),
  };
}

function cleanThresholds(raw: unknown): ClassificationThresholds {
  const r = (raw ?? {}) as Partial<ClassificationThresholds>;
  const hot = num(r.hot_min, DEFAULT_CLASSIFICATION_THRESHOLDS.hot_min);
  const warm = Math.min(num(r.warm_min, DEFAULT_CLASSIFICATION_THRESHOLDS.warm_min), hot);
  return { hot_min: hot, warm_min: warm };
}

/** Saves the CRM settings page: general/stages/lists (config) and scoring weights/thresholds. */
export async function PUT(req: Request) {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

  const supabase = supabaseServer();
  const { data: before } = await supabase.from("crm_settings").select("*").eq("id", 1).maybeSingle();

  const update: Record<string, unknown> = { updated_by: session.userId || null };
  if (body.scoring_weights) update.scoring_weights = cleanWeights(body.scoring_weights);
  if (body.classification_thresholds) update.classification_thresholds = cleanThresholds(body.classification_thresholds);
  if (body.config) update.config = normalizeCrmConfig(body.config);

  const { error } = await supabase.from("crm_settings").upsert({ id: 1, ...update });
  if (error) {
    const missing = /config/.test(error.message);
    return NextResponse.json({
      error: missing ? "لازم تشغّل ملف supabase/migrations/crm_settings_v2.sql في Supabase الأول عشان تتحفظ الإعدادات." : error.message,
    }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    actor_id: session.userId || null, action: "crm.settings_update", entity_type: "crm_settings", entity_id: "1",
    before: before ?? null, after: update,
  });
  return NextResponse.json({ ok: true });
}

/** Re-scores every active lead with the current weights (changing weights alone doesn't touch existing leads). */
export async function POST() {
  const session = await guard();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const supabase = supabaseServer();
  const { data: s } = await supabase.from("crm_settings").select("scoring_weights, classification_thresholds").eq("id", 1).maybeSingle();
  const weights = cleanWeights(s?.scoring_weights);
  const thresholds = cleanThresholds(s?.classification_thresholds);

  let changed = 0, scanned = 0;
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase.from("leads")
      .select("id, case_size, start_timing, asked_price, opened_messenger, mobile_raw, lead_score, classification, qualification_status")
      .is("archived_at", null).order("id").range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message, changed }, { status: 500 });
    const rows = data ?? [];
    scanned += rows.length;
    const updates = rows.map((l) => {
      const phone = normalizeEgyptianPhone(l.mobile_raw);
      const r = computeLeadScore({ case_size: l.case_size, start_timing: l.start_timing, asked_price: l.asked_price, opened_messenger: l.opened_messenger, has_valid_phone: phone.valid }, weights, thresholds);
      const qualification_status = computeQualificationStatus({ has_any_phone: Boolean(l.mobile_raw?.trim()), has_valid_phone: phone.valid, asked_price: l.asked_price });
      return { id: l.id, lead_score: r.score, classification: r.classification, score_breakdown: r.breakdown, qualification_status, prev: l };
    }).filter((u) => u.lead_score !== u.prev.lead_score || u.classification !== u.prev.classification || u.qualification_status !== u.prev.qualification_status);

    for (let i = 0; i < updates.length; i += 20) {
      await Promise.all(updates.slice(i, i + 20).map((u) =>
        supabase.from("leads").update({ lead_score: u.lead_score, classification: u.classification, score_breakdown: u.score_breakdown, qualification_status: u.qualification_status }).eq("id", u.id)
      ));
    }
    changed += updates.length;
    if (rows.length < 1000) break;
  }

  await supabase.from("audit_logs").insert({
    actor_id: session.userId || null, action: "crm.rescore_all", entity_type: "lead", entity_id: null, after: { scanned, changed },
  });
  return NextResponse.json({ ok: true, scanned, changed });
}
