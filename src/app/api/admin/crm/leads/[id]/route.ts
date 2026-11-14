import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { getLeadForSession, deriveLeadComputedFields } from "@/lib/crm-leads";
import { ARCHIVE_REASON_OPTIONS } from "@/lib/crm-labels";
import { sanitizeChatUrl } from "@/lib/chat-links";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.read")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const lead = await getLeadForSession(id, session);
  if (!lead) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.update")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;

  // Fetch through the scope-filtered resolver first — an id outside the
  // caller's scope 404s here before any write is attempted.
  const existing = await getLeadForSession(id, session);
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const body = await req.json();
  const supabase = supabaseServer();
  const update: Record<string, unknown> = { updated_by: session.userId || null };

  const SCORING_FIELDS = ["case_size", "start_timing", "asked_price", "opened_messenger", "mobile_raw"] as const;
  const scoringFieldChanged = SCORING_FIELDS.some((f) => f in body);

  const DIRECT_FIELDS = [
    "mobile_raw", "whatsapp_raw", "alt_phone", "source", "campaign_raw",
    "service_interest", "mapped_service_id", "case_size", "start_timing",
    "branch_id", "gender", "job_title", "asked_price", "opened_messenger",
    "conversation_summary", "expected_value_egp", "notes",
    "last_call_result", "next_follow_up_at", "next_exam_at",
  ] as const;
  for (const f of DIRECT_FIELDS) {
    if (f in body) update[f] = body[f];
  }

  // Chat links: empty clears it; anything else must be a safe http(s) link.
  for (const f of ["whatsapp_chat_url", "meta_chat_url"] as const) {
    if (!(f in body)) continue;
    const raw = typeof body[f] === "string" ? body[f].trim() : "";
    if (!raw) { update[f] = null; continue; }
    const url = sanitizeChatUrl(raw);
    if (!url) return NextResponse.json({ error: "اللينك غير صالح — لازم يبدأ بـ https://" }, { status: 400 });
    update[f] = url;
  }

  if (scoringFieldChanged) {
    const computed = await deriveLeadComputedFields({
      case_size: (body.case_size ?? existing.case_size) || null,
      start_timing: (body.start_timing ?? existing.start_timing) || null,
      asked_price: body.asked_price ?? existing.asked_price,
      opened_messenger: body.opened_messenger ?? existing.opened_messenger,
      mobile_raw: (body.mobile_raw ?? existing.mobile_raw) || null,
    });
    update.mobile_normalized = computed.mobile_normalized;
    update.lead_score = computed.lead_score;
    update.score_breakdown = computed.score_breakdown;
    update.classification = computed.classification;
    update.qualification_status = computed.qualification_status;
  }

  // Assignment — only crm.assign may move a lead to someone else.
  if ("assigned_to" in body) {
    if (!sessionHasPermission(session, "crm.assign")) {
      return NextResponse.json({ error: "لا تملك صلاحية إعادة الإسناد" }, { status: 403 });
    }
    update.assigned_to = body.assigned_to || null;
  }

  // Stage change — validated, logged, loss-reason enforced.
  let stageChanged = false;
  if ("stage" in body && body.stage !== existing.stage) {
    const newStage = body.stage as string;
    if (newStage === "lost") {
      if (!body.loss_reason) {
        return NextResponse.json({ error: "سبب الخسارة مطلوب عند تحويل العميل إلى خسارة" }, { status: 400 });
      }
      if (body.loss_reason === "أخرى" && !body.loss_reason_other?.trim()) {
        return NextResponse.json({ error: "من فضلك اكتب توضيحًا لسبب الخسارة" }, { status: 400 });
      }
      update.loss_reason = body.loss_reason;
      update.loss_reason_other = body.loss_reason_other || null;
    }
    update.stage = newStage;
    stageChanged = true;
  }

  // Archive / restore — reversible, reason required, crm.archive only.
  if ("archive" in body) {
    if (!sessionHasPermission(session, "crm.archive")) {
      return NextResponse.json({ error: "لا تملك صلاحية الأرشفة" }, { status: 403 });
    }
    if (body.archive) {
      const reason = typeof body.archive_reason === "string" ? body.archive_reason.trim() : "";
      if (!ARCHIVE_REASON_OPTIONS.includes(reason) && !reason.startsWith("أخرى: ")) {
        return NextResponse.json({ error: "اختر سبب الأرشفة" }, { status: 400 });
      }
      update.archived_at = new Date().toISOString();
      update.archived_by = session.userId || null;
      update.archive_reason = reason;
    } else {
      update.archived_at = null;
      update.archived_by = null;
      update.archive_reason = null;
    }
  }

  let { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error && /archive_reason|archived_by/.test(error.message)) {
    // Archive migration not run yet — still archive, just without the metadata.
    delete update.archived_by;
    delete update.archive_reason;
    ({ data, error } = await supabase.from("leads").update(update).eq("id", id).select().single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (stageChanged) {
    await supabase.from("lead_stage_history").insert({
      lead_id: id,
      from_stage: existing.stage,
      to_stage: update.stage,
      changed_by: session.userId || null,
      reason: body.stage_change_reason || null,
    });
  }

  return NextResponse.json(data);
}
