import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { resolveScope, applyScope } from "@/lib/crm-scope";
import { parseLeadFilter, applyLeadFilter } from "@/lib/crm-leads";
import { rowsToCsv } from "@/lib/csv-export";
import { STAGE_LABELS, QUALIFICATION_LABELS } from "@/lib/crm-labels";
import type { DbLead } from "@/types/admin";

const MAX_ROWS = 20000;

/** CSV export of exactly the rows the current list filter shows (same filter + scope code path). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.export")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const filter = parseLeadFilter(new URL(req.url).searchParams);
  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");

  const rows: DbLead[] = [];
  for (let from = 0; from < MAX_ROWS; from += 1000) {
    const { data, error } = await applyLeadFilter(applyScope(supabase.from("leads").select("*"), scope), filter)
      .order("entry_date", { ascending: false })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows.push(...((data ?? []) as DbLead[]));
    if (!data || data.length < 1000) break;
  }

  const [{ data: users }, { data: branches }] = await Promise.all([
    supabase.from("admin_users").select("id, name"),
    supabase.from("branches").select("id, name"),
  ]);
  const userName = new Map((users ?? []).map((u: { id: string; name: string }) => [u.id, u.name]));
  const branchName = new Map((branches ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));

  const headers = [
    "الكود", "الكود القديم", "تاريخ الدخول", "الاسم", "الموبايل", "رقم بديل", "المصدر", "الحملة",
    "الخدمة", "حجم الحالة", "موعد البدء", "الفرع", "التصنيف", "Score", "التأهيل", "المرحلة",
    "المسؤول", "عدد المحاولات", "المتابعة القادمة", "سبب الخسارة", "ملاحظات", "مؤرشف", "سبب الأرشفة",
  ];
  const csv = rowsToCsv(headers, rows.map((l) => [
    l.lead_code, l.legacy_id, l.entry_date, l.name, l.mobile_normalized ?? l.mobile_raw, l.alt_phone,
    l.source, l.campaign_raw, l.service_interest, l.case_size, l.start_timing,
    l.branch_id ? branchName.get(l.branch_id) : "", l.classification, l.lead_score,
    QUALIFICATION_LABELS[l.qualification_status], STAGE_LABELS[l.stage],
    l.assigned_to ? userName.get(l.assigned_to) : "", l.contact_attempts,
    l.next_follow_up_at?.slice(0, 16).replace("T", " "), l.loss_reason, l.notes,
    l.archived_at ? l.archived_at.slice(0, 10) : "", l.archive_reason,
  ]));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wave-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
