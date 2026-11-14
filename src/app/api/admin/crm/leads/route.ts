import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { resolveScope, applyScope } from "@/lib/crm-scope";
import { deriveLeadComputedFields, parseLeadFilter, applyLeadFilter } from "@/lib/crm-leads";
import { sanitizeChatUrl } from "@/lib/chat-links";

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
  const filter = parseLeadFilter(searchParams);

  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");

  let query = applyLeadFilter(
    applyScope(supabase.from("leads").select("*", { count: "exact" }), scope),
    filter
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort = searchParams.get("sort");
  if (sort === "entry_asc") query = query.order("entry_date", { ascending: true }).order("created_at", { ascending: true });
  else if (sort === "score_desc") query = query.order("lead_score", { ascending: false }).order("entry_date", { ascending: false });
  else if (sort === "followup_asc") query = query.order("next_follow_up_at", { ascending: true, nullsFirst: false });
  else query = query.order("entry_date", { ascending: false }).order("created_at", { ascending: false });
  query = query.range(from, to);

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

  const chatLinks: Record<string, string> = {};
  for (const f of ["whatsapp_chat_url", "meta_chat_url"] as const) {
    const raw = typeof body[f] === "string" ? body[f].trim() : "";
    if (!raw) continue;
    const url = sanitizeChatUrl(raw);
    if (!url) return NextResponse.json({ error: "لينك الشات غير صالح — لازم يبدأ بـ https://" }, { status: 400 });
    chatLinks[f] = url;
  }

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
      ...chatLinks,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("lead_stage_history").insert({
    lead_id: data.id, from_stage: null, to_stage: "new", changed_by: session.userId || null,
  });

  return NextResponse.json(data, { status: 201 });
}
