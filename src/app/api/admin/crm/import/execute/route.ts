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

  const supabase = supabaseServer();

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      source_filename: file.name,
      imported_by: session.userId || null,
      total_rows: parsed.totalDataRows,
    })
    .select()
    .single();
  if (batchError || !batch) {
    return NextResponse.json({ error: batchError?.message ?? "فشل بدء عملية الاستيراد" }, { status: 500 });
  }

  // Dedup check (never silently overwrite a lead staff may have already edited — skip entirely, don't update).
  const legacyIds = parsed.rows.map((r) => r.legacy_id).filter((x): x is string => Boolean(x));
  const { data: existing } = legacyIds.length
    ? await supabase.from("leads").select("legacy_id").in("legacy_id", legacyIds)
    : { data: [] as { legacy_id: string }[] };
  const existingSet = new Set((existing ?? []).map((r) => r.legacy_id));

  const { data: branches } = await supabase.from("branches").select("id, slug");
  const branchIdBySlug = new Map((branches ?? []).map((b: { id: string; slug: string }) => [b.slug, b.id]));
  const { data: defaultBranch } = await supabase.from("branches").select("id").eq("is_active", true).limit(1).maybeSingle();

  const toInsert = [];
  const results: { rowNumber: number; legacy_id: string | null; name: string; outcome: string; notes: string }[] = [];
  let duplicateCount = 0;
  let reviewCount = 0;

  for (const r of parsed.rows) {
    if (r.legacy_id && existingSet.has(r.legacy_id)) {
      duplicateCount++;
      results.push({ rowNumber: r.rowNumber, legacy_id: r.legacy_id, name: r.name, outcome: "مكرر — تم تجاهله", notes: "" });
      continue;
    }
    if (r.needs_review) reviewCount++;

    toInsert.push({
      legacy_id: r.legacy_id,
      entry_date: r.entry_date || undefined,
      imported_at: new Date().toISOString(),
      name: r.name,
      mobile_raw: r.mobile_raw,
      mobile_normalized: r.mobile_normalized,
      alt_phone: r.alt_phone,
      source: r.source,
      service_interest: r.service_interest,
      case_size: r.case_size,
      start_timing: r.start_timing,
      branch_id: (r.branch_slug && branchIdBySlug.get(r.branch_slug)) || defaultBranch?.id || null,
      gender: r.gender,
      job_title: r.job_title,
      asked_price: r.asked_price,
      opened_messenger: r.opened_messenger,
      conversation_summary: r.conversation_summary,
      lead_score: r.lead_score,
      score_breakdown: r.score_breakdown,
      classification: r.classification,
      qualification_status: r.qualification_status,
      stage: "new",
      contact_attempts: r.contact_attempts,
      expected_value_egp: r.expected_value_egp,
      loss_reason: r.loss_reason,
      notes: r.notes,
      created_by: session.userId || null,
      updated_by: session.userId || null,
      import_batch_id: batch.id,
      needs_review: r.needs_review,
      review_notes: r.review_notes.length ? r.review_notes.join(" · ") : null,
    });
    results.push({
      rowNumber: r.rowNumber, legacy_id: r.legacy_id, name: r.name,
      outcome: r.needs_review ? "تم الاستيراد — يحتاج مراجعة" : "تم الاستيراد",
      notes: r.review_notes.join(" · "),
    });
  }

  let insertedCount = 0;
  let errorCount = 0;
  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase.from("leads").insert(toInsert).select("id");
    if (insertError) {
      errorCount = toInsert.length;
      await supabase.from("import_batches").update({
        status: "failed", finished_at: new Date().toISOString(),
        duplicate_count: duplicateCount, review_count: reviewCount, error_count: errorCount,
      }).eq("id", batch.id);
      return NextResponse.json({ error: insertError.message, batchId: batch.id }, { status: 500 });
    }
    insertedCount = inserted?.length ?? 0;

    if (inserted?.length) {
      await supabase.from("lead_stage_history").insert(
        inserted.map((row: { id: string }) => ({
          lead_id: row.id, from_stage: null, to_stage: "new",
          changed_by: session.userId || null, reason: "استيراد من إكسل",
        }))
      );
    }
  }

  await supabase.from("import_batches").update({
    status: "completed",
    finished_at: new Date().toISOString(),
    inserted_count: insertedCount,
    duplicate_count: duplicateCount,
    review_count: reviewCount,
    error_count: errorCount,
  }).eq("id", batch.id);

  return NextResponse.json({
    batchId: batch.id,
    summary: {
      totalDataRows: parsed.totalDataRows,
      insertedCount,
      duplicateCount,
      reviewCount,
      errorCount,
    },
    results,
  });
}
