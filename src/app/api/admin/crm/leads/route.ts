import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { resolveScope, applyScope } from "@/lib/crm-scope";
import { deriveLeadComputedFields } from "@/lib/crm-leads";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.read")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get("pageSize")) || PAGE_SIZE_DEFAULT));
  const search = searchParams.get("q")?.trim();

  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");

  let query = applyScope(
    supabase.from("leads").select("*", { count: "exact" }).is("archived_at", null),
    scope
  );

  for (const [param, column] of [
    ["stage", "stage"], ["classification", "classification"],
    ["qualification_status", "qualification_status"], ["assigned_to", "assigned_to"],
    ["branch_id", "branch_id"], ["source", "source"], ["service_interest", "service_interest"],
  ] as const) {
    const val = searchParams.get(param);
    if (val) query = query.eq(column, val);
  }

  if (searchParams.get("overdue_followups") === "1") {
    query = query.lt("next_follow_up_at", new Date().toISOString());
  }
  if (searchParams.get("no_followup") === "1") {
    query = query.is("next_follow_up_at", null);
  }
  if (searchParams.get("unassigned") === "1") {
    query = query.is("assigned_to", null);
  }

  if (search) {
    const escaped = search.replace(/[%_]/g, "");
    query = query.or(
      `name.ilike.%${escaped}%,mobile_raw.ilike.%${escaped}%,mobile_normalized.ilike.%${escaped}%,lead_code.ilike.%${escaped}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.create")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "اسم العميل مطلوب" }, { status: 400 });
  }

  const computed = await deriveLeadComputedFields({
    case_size: body.case_size ?? null,
    start_timing: body.start_timing ?? null,
    asked_price: Boolean(body.asked_price),
    opened_messenger: Boolean(body.opened_messenger),
    mobile_raw: body.mobile_raw ?? null,
  });

  // Leads created by a sales_agent are always assigned to themselves,
  // regardless of what (if anything) the client sent — never trust a
  // client-submitted assignee.
  const assignedTo = session.role === "sales_agent" ? session.userId : (body.assigned_to || null);

  const supabase = supabaseServer();

  let branchId = body.branch_id || null;
  if (!branchId) {
    const { data: defaultBranch } = await supabase.from("branches").select("id").eq("is_active", true).limit(1).maybeSingle();
    branchId = defaultBranch?.id ?? null;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name,
      mobile_raw: body.mobile_raw || null,
      mobile_normalized: computed.mobile_normalized,
      whatsapp_raw: body.whatsapp_raw || null,
      alt_phone: body.alt_phone || null,
      source: body.source || null,
      campaign_raw: body.campaign_raw || null,
      service_interest: body.service_interest || null,
      mapped_service_id: body.mapped_service_id || null,
      case_size: body.case_size || null,
      start_timing: body.start_timing || null,
      branch_id: branchId,
      gender: body.gender || null,
      job_title: body.job_title || null,
      asked_price: Boolean(body.asked_price),
      opened_messenger: Boolean(body.opened_messenger),
      conversation_summary: body.conversation_summary || null,
      lead_score: computed.lead_score,
      score_breakdown: computed.score_breakdown,
      classification: computed.classification,
      qualification_status: computed.qualification_status,
      expected_value_egp: body.expected_value_egp || null,
      notes: body.notes || null,
      assigned_to: assignedTo,
      created_by: session.userId || null,
      updated_by: session.userId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("lead_stage_history").insert({
    lead_id: data.id, from_stage: null, to_stage: "new", changed_by: session.userId || null,
  });

  return NextResponse.json(data, { status: 201 });
}
