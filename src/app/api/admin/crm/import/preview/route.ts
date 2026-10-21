import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { parseLeadsWorkbook } from "@/lib/crm-import";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.import")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });

  let parsed;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseLeadsWorkbook(buffer);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل قراءة الملف" }, { status: 400 });
  }

  const legacyIds = parsed.rows.map((r) => r.legacy_id).filter((x): x is string => Boolean(x));
  const supabase = supabaseServer();
  const { data: existing } = legacyIds.length
    ? await supabase.from("leads").select("legacy_id").in("legacy_id", legacyIds)
    : { data: [] as { legacy_id: string }[] };
  const existingSet = new Set((existing ?? []).map((r) => r.legacy_id));

  const summary = {
    totalDataRows: parsed.totalDataRows,
    skippedBlankRows: parsed.skippedBlankRows,
    newCount: 0,
    duplicateCount: 0,
    reviewCount: 0,
  };

  const rows = parsed.rows.map((r) => {
    const isDuplicate = Boolean(r.legacy_id && existingSet.has(r.legacy_id));
    if (isDuplicate) summary.duplicateCount++;
    else summary.newCount++;
    if (r.needs_review) summary.reviewCount++;
    return { ...r, isDuplicate };
  });

  return NextResponse.json({ summary, rows });
}
