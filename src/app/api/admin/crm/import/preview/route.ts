import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { readWorkbook, parseLeadsWorkbook, parseImportOptions, IMPORT_FIELD_LABELS, type ParseResult } from "@/lib/crm-import";
import { loadImportContext, findExistingLeads } from "@/lib/crm-import-db";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const PREVIEW_ROWS = 300;

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
    const ctx = await loadImportContext();
    parsed = parseLeadsWorkbook(readWorkbook(buffer, file.name), ctx, options);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل قراءة الملف — تأكد إنه ملف Excel أو CSV سليم" }, { status: 400 });
  }

  let existing;
  try {
    existing = await findExistingLeads(parsed.rows);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "فشل فحص التكرار" }, { status: 500 });
  }

  const summary = {
    totalDataRows: parsed.totalDataRows,
    skippedBlankRows: parsed.skippedBlankRows,
    skippedNoContact: parsed.skippedNoContact,
    newCount: 0,
    duplicateCount: 0,
    archivedDuplicateCount: 0,
    duplicateInFileCount: 0,
    reviewCount: 0,
    invalidPhoneCount: 0,
    dateFrom: null as string | null,
    dateTo: null as string | null,
  };

  const rows = parsed.rows.map((r) => {
    const match = existing.get(r.rowNumber) ?? null;
    let status: "new" | "duplicate" | "duplicate_in_file";
    if (match) { status = "duplicate"; summary.duplicateCount++; if (match.archived) summary.archivedDuplicateCount++; }
    else if (r.duplicateOfRow) { status = "duplicate_in_file"; summary.duplicateInFileCount++; }
    else { status = "new"; summary.newCount++; }
    if (r.needs_review) summary.reviewCount++;
    if (r.mobile_raw && !r.mobile_normalized) summary.invalidPhoneCount++;
    if (r.entry_date) {
      if (!summary.dateFrom || r.entry_date < summary.dateFrom) summary.dateFrom = r.entry_date;
      if (!summary.dateTo || r.entry_date > summary.dateTo) summary.dateTo = r.entry_date;
    }
    return {
      rowNumber: r.rowNumber,
      legacy_id: r.legacy_id,
      entry_date: r.entry_date,
      name: r.name,
      mobile_raw: r.mobile_raw,
      mobile_valid: Boolean(r.mobile_normalized),
      source: r.source,
      service_interest: r.service_interest,
      classification: r.classification,
      lead_score: r.lead_score,
      stage: r.stage,
      needs_review: r.needs_review,
      review_notes: r.review_notes,
      status,
      duplicateOfRow: r.duplicateOfRow,
      existing: match ? { lead_code: match.lead_code, name: match.name, archived: match.archived, matchedBy: match.matchedBy } : null,
    };
  });

  return NextResponse.json({
    sheetName: parsed.sheetName,
    sheetNames: parsed.sheetNames,
    headerRowIndex: parsed.headerRowIndex,
    columns: parsed.columns,
    fieldLabels: IMPORT_FIELD_LABELS,
    unmappedRequired: parsed.unmappedRequired,
    summary,
    rows: rows.slice(0, PREVIEW_ROWS),
    previewTruncated: rows.length > PREVIEW_ROWS,
  });
}
