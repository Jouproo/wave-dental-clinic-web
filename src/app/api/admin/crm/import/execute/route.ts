import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { readWorkbook, parseLeadsWorkbook, parseImportOptions, type ParseResult, type ParsedLeadRow } from "@/lib/crm-import";
import { loadImportContext, findExistingLeads } from "@/lib/crm-import-db";
import type { DbLead } from "@/types/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const INSERT_CHUNK = 200;

interface ResultRow { rowNumber: number; legacy_id: string | null; name: string; outcome: string; notes: string }

/** Fields a "merge" may fill on an existing lead — only where the existing value is empty, never overwriting staff edits. */
const MERGEABLE_FIELDS = [
  "alt_phone", "whatsapp_raw", "whatsapp_normalized", "source", "campaign_raw", "service_interest",
  "branch_id", "gender", "job_title", "conversation_summary", "legacy_id",
  "whatsapp_chat_url", "meta_chat_url",
] as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.import")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "الملف أكبر من 15 ميجا" }, { status: 400 });
  const options = parseImportOptions(formData.get("options"));

  let parsed: ParseResult;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    parsed = parseLeadsWorkbook(readWorkbook(buffer, file.name), await loadImportContext(), options);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل قراءة الملف" }, { status: 400 });
  }
  if (parsed.unmappedRequired.length) {
    return NextResponse.json({ error: parsed.unmappedRequired.join(" · ") }, { status: 400 });
  }

  const supabase = supabaseServer();
  const actor = session.userId || null;
  const now = new Date().toISOString();

  // Round-robin assignees must be real, active team members.
  let assignees: string[] = [];
  if (options.assignees.length) {
    const { data } = await supabase.from("admin_users").select("id").in("id", options.assignees).eq("status", "active");
    const valid = new Set((data ?? []).map((u: { id: string }) => u.id));
    assignees = options.assignees.filter((a) => valid.has(a));
  }

  // ---- batch record (new audit columns are optional until the archive migration runs) ----
  const batchBase = { source_filename: file.name, imported_by: actor, total_rows: parsed.totalDataRows };
  let { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      ...batchBase,
      sheet_name: parsed.sheetName,
      column_mapping: Object.fromEntries(parsed.columns.map((c) => [c.header, c.field])),
      options: { ...options, mapping: undefined, assignees },
    })
    .select().single();
  if (batchError && /sheet_name|column_mapping|options/.test(batchError.message)) {
    ({ data: batch, error: batchError } = await supabase.from("import_batches").insert(batchBase).select().single());
  }
  if (batchError || !batch) {
    return NextResponse.json({ error: batchError?.message ?? "فشل بدء عملية الاستيراد" }, { status: 500 });
  }

  let existing;
  try {
    existing = await findExistingLeads(parsed.rows);
  } catch (err) {
    await supabase.from("import_batches").update({ status: "failed", finished_at: new Date().toISOString() }).eq("id", batch.id);
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل فحص التكرار" }, { status: 500 });
  }

  const { data: defaultBranch } = await supabase.from("branches").select("id").eq("is_active", true).limit(1).maybeSingle();

  const results: ResultRow[] = [];
  const toInsert: { row: ParsedLeadRow; record: Record<string, unknown> }[] = [];
  const toMerge: { row: ParsedLeadRow; leadId: string; leadCode: string; archived: boolean }[] = [];
  let duplicateCount = 0;
  let reviewCount = 0;
  let rr = 0;

  for (const r of parsed.rows) {
    const match = existing.get(r.rowNumber);
    if (match) {
      duplicateCount++;
      if (options.duplicatePolicy === "merge") {
        toMerge.push({ row: r, leadId: match.id, leadCode: match.lead_code, archived: match.archived });
      } else {
        results.push({
          rowNumber: r.rowNumber, legacy_id: r.legacy_id, name: r.name,
          outcome: "مكرر — تم تجاهله",
          notes: `موجود بالفعل: ${match.lead_code} (${match.matchedBy === "phone" ? "نفس الرقم" : "نفس الكود"})${match.archived ? " — في الأرشيف" : ""}`,
        });
      }
      continue;
    }
    if (r.duplicateOfRow) {
      duplicateCount++;
      results.push({ rowNumber: r.rowNumber, legacy_id: r.legacy_id, name: r.name, outcome: "مكرر داخل الملف — تم تجاهله", notes: `نفس العميل في الصف ${r.duplicateOfRow}` });
      continue;
    }
    if (r.needs_review) reviewCount++;

    const assigned = r.assigned_to ?? (assignees.length ? assignees[rr++ % assignees.length] : null);
    toInsert.push({
      row: r,
      record: {
        legacy_id: r.legacy_id,
        entry_date: r.entry_date || undefined,
        imported_at: now,
        name: r.name,
        mobile_raw: r.mobile_raw,
        mobile_normalized: r.mobile_normalized,
        whatsapp_raw: r.whatsapp_raw,
        whatsapp_normalized: r.whatsapp_normalized,
        alt_phone: r.alt_phone,
        source: r.source,
        campaign_raw: r.campaign_raw,
        service_interest: r.service_interest,
        case_size: r.case_size,
        start_timing: r.start_timing,
        branch_id: r.branch_id || defaultBranch?.id || null,
        gender: r.gender,
        job_title: r.job_title,
        asked_price: r.asked_price,
        opened_messenger: r.opened_messenger,
        conversation_summary: r.conversation_summary,
        lead_score: r.lead_score,
        score_breakdown: r.score_breakdown,
        classification: r.classification,
        qualification_status: r.qualification_status,
        stage: r.stage,
        assigned_to: assigned,
        contact_attempts: r.contact_attempts,
        expected_value_egp: r.expected_value_egp,
        loss_reason: r.loss_reason,
        last_call_result: r.last_call_result,
        next_follow_up_at: r.next_follow_up_at,
        last_contact_at: r.last_contact_at,
        whatsapp_chat_url: r.whatsapp_chat_url,
        meta_chat_url: r.meta_chat_url,
        next_exam_at: r.next_exam_at,
        notes: r.notes,
        created_by: actor,
        updated_by: actor,
        import_batch_id: batch.id,
        needs_review: r.needs_review,
        review_notes: r.review_notes.length ? r.review_notes.join(" · ") : null,
      },
    });
  }

  // ---- insert in chunks; a failing chunk is retried row by row so one bad row can't sink the file ----
  let insertedCount = 0;
  let errorCount = 0;
  let chatLinksUnsupported = false;
  const inserted: { id: string; stage: string }[] = [];

  // Chat-link columns are optional until crm_chat_links.sql is run — if the DB
  // doesn't have them yet, drop them rather than failing the whole import.
  {
    const { error: colErr } = await supabase.from("leads").select("whatsapp_chat_url, meta_chat_url").limit(1);
    if (colErr) {
      for (const c of toInsert) { delete c.record.whatsapp_chat_url; delete c.record.meta_chat_url; }
      chatLinksUnsupported = true;
    }
  }

  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK);
    const { data, error } = await supabase.from("leads").insert(chunk.map((c) => c.record)).select("id, stage");
    if (!error && data) {
      inserted.push(...data);
      insertedCount += data.length;
      for (const c of chunk) results.push(okResult(c.row));
      continue;
    }
    for (const c of chunk) {
      const { data: one, error: oneErr } = await supabase.from("leads").insert(c.record).select("id, stage").single();
      if (oneErr || !one) {
        errorCount++;
        results.push({ rowNumber: c.row.rowNumber, legacy_id: c.row.legacy_id, name: c.row.name, outcome: "خطأ — لم يتم الاستيراد", notes: oneErr?.message ?? "" });
      } else {
        inserted.push(one);
        insertedCount++;
        results.push(okResult(c.row));
      }
    }
  }

  for (let i = 0; i < inserted.length; i += 500) {
    await supabase.from("lead_stage_history").insert(
      inserted.slice(i, i + 500).map((row) => ({
        lead_id: row.id, from_stage: null, to_stage: row.stage, changed_by: actor, reason: `استيراد من ${file.name}`,
      }))
    );
  }

  // ---- merge duplicates: fill only empty fields, log the re-inquiry, bring archived leads back ----
  let mergedCount = 0;
  for (const m of toMerge) {
    const { data: cur } = await supabase.from("leads").select("*").eq("id", m.leadId).single();
    if (!cur) continue;
    const lead = cur as DbLead;
    const patch: Record<string, unknown> = { updated_by: actor };
    const filled: string[] = [];
    for (const f of MERGEABLE_FIELDS) {
      if (chatLinksUnsupported && (f === "whatsapp_chat_url" || f === "meta_chat_url")) continue;
      const incoming = (m.row as unknown as Record<string, unknown>)[f];
      if ((lead[f] === null || lead[f] === "") && incoming !== null && incoming !== undefined && incoming !== "") {
        patch[f] = incoming;
        filled.push(f);
      }
    }
    const stamp = `[${now.slice(0, 10)}] ظهر مرة تانية في ملف "${file.name}"${m.row.entry_date ? ` بتاريخ ${m.row.entry_date}` : ""}`;
    patch.notes = [lead.notes, stamp, m.row.notes].filter(Boolean).join("\n");
    if (m.archived) {
      patch.archived_at = null;
      patch.archived_by = null;
      patch.archive_reason = null;
    }
    let { error } = await supabase.from("leads").update(patch).eq("id", m.leadId);
    if (error && /archive_reason|archived_by/.test(error.message)) {
      delete patch.archived_by; delete patch.archive_reason;
      ({ error } = await supabase.from("leads").update(patch).eq("id", m.leadId));
    }
    if (error) {
      errorCount++;
      results.push({ rowNumber: m.row.rowNumber, legacy_id: m.row.legacy_id, name: m.row.name, outcome: "خطأ في الدمج", notes: error.message });
    } else {
      mergedCount++;
      results.push({
        rowNumber: m.row.rowNumber, legacy_id: m.row.legacy_id, name: m.row.name,
        outcome: m.archived ? "مكرر — تم الدمج واسترجاعه من الأرشيف" : "مكرر — تم الدمج",
        notes: `${m.leadCode}${filled.length ? ` · اتملى: ${filled.join(", ")}` : ""}`,
      });
    }
  }

  results.sort((a, b) => a.rowNumber - b.rowNumber);

  await supabase.from("import_batches").update({
    status: errorCount > 0 && insertedCount === 0 && mergedCount === 0 ? "failed" : "completed",
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
      mergedCount,
      duplicateCount,
      reviewCount,
      errorCount,
      assignedRoundRobin: assignees.length > 0,
      chatLinksUnsupported,
    },
    results,
  });
}

function okResult(r: ParsedLeadRow): ResultRow {
  return {
    rowNumber: r.rowNumber, legacy_id: r.legacy_id, name: r.name,
    outcome: r.needs_review ? "تم الاستيراد — يحتاج مراجعة" : "تم الاستيراد",
    notes: r.review_notes.join(" · "),
  };
}
