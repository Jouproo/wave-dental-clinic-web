import * as XLSX from "xlsx";
import { normalizeEgyptianPhone } from "@/lib/phone";
import { computeLeadScore, computeQualificationStatus } from "@/lib/lead-scoring";
import { SOURCE_OPTIONS, SERVICE_INTEREST_OPTIONS, CASE_SIZE_OPTIONS, START_TIMING_OPTIONS, LOSS_REASON_OPTIONS } from "@/lib/crm-labels";

const SHEET_NAME = "العملاء المحتملين";
const HEADER_ROW_INDEX = 3; // row 4, 0-based
const FIRST_DATA_ROW_INDEX = 4; // row 5, 0-based

const BRANCH_SLUG_BY_LABEL: Record<string, string> = {
  "شبرا": "shubra",
  "6 أكتوبر": "6-october",
};

export interface ParsedLeadRow {
  rowNumber: number; // 1-based sheet row, for error reporting
  legacy_id: string | null;
  entry_date: string | null; // YYYY-MM-DD
  name: string;
  mobile_raw: string | null;
  alt_phone: string | null;
  source: string | null;
  service_interest: string | null;
  case_size: string | null;
  start_timing: string | null;
  branch_slug: string | null;
  gender: string | null;
  job_title: string | null;
  asked_price: boolean;
  opened_messenger: boolean;
  conversation_summary: string | null;
  contact_attempts: number;
  expected_value_egp: number | null;
  loss_reason: string | null;
  notes: string | null;

  // Computed server-side — never trusts the sheet's own Score/التصنيف/مؤهل؟ columns.
  mobile_normalized: string | null;
  lead_score: number;
  score_breakdown: unknown;
  classification: "Hot" | "Warm" | "Cold";
  qualification_status: "qualified" | "qualifies_by_call" | "needs_phone" | "invalid_phone";

  needs_review: boolean;
  review_notes: string[];
}

export interface ParseResult {
  rows: ParsedLeadRow[];
  totalDataRows: number; // rows with a non-empty name (potential leads)
  skippedBlankRows: number; // formula-padding rows with no name
}

function cellToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function excelDateToYmd(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
}

function isYes(v: unknown): boolean {
  const s = cellToString(v);
  return s === "نعم";
}

/** Parses the leads sheet of the known Wave_Dental_CRM.xlsx workbook shape. Does not write to the database. */
export function parseLeadsWorkbook(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`لم يتم العثور على ورقة "${SHEET_NAME}" في الملف`);
  }

  const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
  const headerRow = grid[HEADER_ROW_INDEX] ?? [];
  const colIndex: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    const key = cellToString(h);
    if (key) colIndex[key] = i;
  });

  const required = ["ID", "تاريخ الدخول", "الاسم", "الموبايل"];
  for (const col of required) {
    if (!(col in colIndex)) {
      throw new Error(`عمود "${col}" غير موجود في ورقة العملاء — تأكد إن الصف الرابع هو صف العناوين`);
    }
  }

  const get = (row: unknown[], col: string) => row[colIndex[col]];

  const rows: ParsedLeadRow[] = [];
  let skippedBlankRows = 0;

  for (let i = FIRST_DATA_ROW_INDEX; i < grid.length; i++) {
    const row = grid[i];
    if (!row) continue;
    const name = cellToString(get(row, "الاسم"));
    if (!name) { skippedBlankRows++; continue; }

    const reviewNotes: string[] = [];

    const sourceRaw = cellToString(get(row, "المصدر"));
    const source = sourceRaw && SOURCE_OPTIONS.includes(sourceRaw) ? sourceRaw : sourceRaw;
    if (sourceRaw && !SOURCE_OPTIONS.includes(sourceRaw)) reviewNotes.push(`مصدر غير معروف: "${sourceRaw}"`);

    const serviceRaw = cellToString(get(row, "الخدمة"));
    let service_interest: string | null = null;
    if (serviceRaw) {
      if (SERVICE_INTEREST_OPTIONS.includes(serviceRaw)) service_interest = serviceRaw;
      else reviewNotes.push(`الخدمة الأصلية من الشيت: "${serviceRaw}" — تحتاج تصنيف يدوي`);
    }

    const caseSizeRaw = cellToString(get(row, "حجم الحالة"));
    const case_size = caseSizeRaw && CASE_SIZE_OPTIONS.includes(caseSizeRaw) ? caseSizeRaw : null;
    if (caseSizeRaw && !case_size) reviewNotes.push(`حجم حالة غير معروف: "${caseSizeRaw}"`);

    const startTimingRaw = cellToString(get(row, "موعد البدء"));
    const start_timing = startTimingRaw && START_TIMING_OPTIONS.includes(startTimingRaw) ? startTimingRaw : null;
    if (startTimingRaw && !start_timing) reviewNotes.push(`موعد بدء غير معروف: "${startTimingRaw}"`);

    const branchLabel = cellToString(get(row, "الفرع"));
    const branch_slug = branchLabel ? BRANCH_SLUG_BY_LABEL[branchLabel] ?? null : null;
    if (branchLabel && !branch_slug) reviewNotes.push(`فرع غير معروف: "${branchLabel}"`);

    const lossReasonRaw = cellToString(get(row, "سبب الخسارة"));
    const loss_reason = lossReasonRaw && LOSS_REASON_OPTIONS.includes(lossReasonRaw) ? lossReasonRaw : null;
    if (lossReasonRaw && !loss_reason) reviewNotes.push(`سبب خسارة غير معروف: "${lossReasonRaw}"`);

    const mobileRaw = cellToString(get(row, "الموبايل"));
    const phone = normalizeEgyptianPhone(mobileRaw);
    if (mobileRaw && !phone.valid) reviewNotes.push("رقم الموبايل غير صالح — يحتاج مراجعة يدوية");

    const askedPrice = isYes(get(row, "سأل عن السعر/الخدمة"));
    const openedMessenger = isYes(get(row, "فتح ماسنجر"));

    const { score, classification, breakdown } = computeLeadScore({
      case_size, start_timing, asked_price: askedPrice, opened_messenger: openedMessenger, has_valid_phone: phone.valid,
    });
    const qualification_status = computeQualificationStatus({
      has_any_phone: Boolean(mobileRaw), has_valid_phone: phone.valid, asked_price: askedPrice,
    });

    const attemptsRaw = get(row, "عدد المحاولات");
    const contact_attempts = typeof attemptsRaw === "number" ? Math.max(0, Math.round(attemptsRaw)) : 0;

    const expectedValueRaw = get(row, "القيمة المتوقعة (ج)");
    const expected_value_egp = typeof expectedValueRaw === "number" ? expectedValueRaw : null;

    rows.push({
      rowNumber: i + 1,
      legacy_id: cellToString(get(row, "ID")),
      entry_date: excelDateToYmd(get(row, "تاريخ الدخول")),
      name,
      mobile_raw: mobileRaw,
      alt_phone: cellToString(get(row, "رقم بديل")),
      source,
      service_interest,
      case_size,
      start_timing,
      branch_slug,
      gender: cellToString(get(row, "النوع")),
      job_title: cellToString(get(row, "الوظيفة")),
      asked_price: askedPrice,
      opened_messenger: openedMessenger,
      conversation_summary: cellToString(get(row, "ملخص المحادثة")),
      contact_attempts,
      expected_value_egp,
      loss_reason,
      notes: cellToString(get(row, "ملاحظات")),
      mobile_normalized: phone.normalized,
      lead_score: score,
      score_breakdown: breakdown,
      classification,
      qualification_status,
      needs_review: reviewNotes.length > 0,
      review_notes: reviewNotes,
    });
  }

  return { rows, totalDataRows: rows.length, skippedBlankRows };
}
