import * as XLSX from "xlsx";
import { normalizeEgyptianPhone, cleanPhoneInput } from "@/lib/phone";
import {
  computeLeadScore, computeQualificationStatus,
  type ScoringWeights, type ClassificationThresholds,
} from "@/lib/lead-scoring";
import {
  SOURCE_OPTIONS, SERVICE_INTEREST_OPTIONS, CASE_SIZE_OPTIONS, START_TIMING_OPTIONS,
  LOSS_REASON_OPTIONS, STAGE_LABELS,
} from "@/lib/crm-labels";
import type { LeadStage } from "@/types/admin";
import { sanitizeChatUrl, classifyChatUrl } from "@/lib/chat-links";

// ============================================================
// Smart spreadsheet import.
//
// Works on any reasonable leads sheet — the clinic's own Wave_Dental_CRM.xlsx,
// a Meta Lead Ads export, a CSV from another CRM, or a hand-made sheet:
//   1. picks the sheet + header row that look most like a leads table,
//   2. auto-maps columns to CRM fields via Arabic/English aliases,
//   3. lets the user override that mapping in the UI,
//   4. normalizes messy values (dates in any common format, phones that
//      lost their leading zero, "زراعة اسنان" → زراعة, "ايوه" → yes …),
//   5. flags anything it couldn't understand for review instead of guessing.
// Parsing never touches the database; dedup lookups are a separate step.
// ============================================================

export type ImportField =
  | "skip" | "legacy_id" | "entry_date" | "name" | "first_name" | "last_name"
  | "mobile" | "whatsapp" | "alt_phone" | "email" | "source" | "campaign" | "service"
  | "case_size" | "start_timing" | "branch" | "gender" | "job_title" | "asked_price"
  | "opened_messenger" | "conversation_summary" | "contact_attempts" | "expected_value"
  | "loss_reason" | "notes" | "stage" | "assignee" | "next_follow_up" | "last_call_result"
  | "last_contact" | "next_exam" | "whatsapp_chat_url" | "meta_chat_url";

interface FieldDef { key: Exclude<ImportField, "skip">; label: string; aliases: string[]; multi?: boolean }

export const IMPORT_FIELDS: FieldDef[] = [
  { key: "name", label: "الاسم", aliases: ["الاسم", "اسم العميل", "الاسم بالكامل", "الاسم كامل", "اسم", "العميل", "اسم المريض", "name", "full name", "fullname", "customer", "customer name", "client", "client name", "patient", "patient name", "lead name"] },
  { key: "first_name", label: "الاسم الأول", aliases: ["الاسم الاول", "first name", "firstname", "given name"] },
  { key: "last_name", label: "اسم العائلة", aliases: ["اسم العائله", "الاسم الاخير", "last name", "lastname", "surname", "family name"] },
  { key: "mobile", label: "الموبايل", aliases: ["الموبايل", "موبايل", "رقم الموبايل", "الهاتف", "هاتف", "رقم الهاتف", "التليفون", "تليفون", "رقم التليفون", "الرقم", "رقم", "phone", "phone number", "phonenumber", "mobile", "mobile number", "mobile phone", "tel", "telephone", "cell", "contact number"] },
  { key: "whatsapp", label: "واتساب", aliases: ["واتساب", "واتس", "واتس اب", "رقم الواتساب", "رقم الواتس", "whatsapp", "whatsapp number", "wa"] },
  { key: "alt_phone", label: "رقم بديل", aliases: ["رقم بديل", "رقم اخر", "هاتف اخر", "رقم تاني", "رقم 2", "هاتف 2", "alt phone", "alternate phone", "other phone", "phone 2", "phone2", "secondary phone"] },
  { key: "email", label: "الإيميل (للملاحظات)", aliases: ["الايميل", "البريد", "البريد الالكتروني", "ايميل", "email", "e mail", "mail"] },
  { key: "entry_date", label: "تاريخ الدخول", aliases: ["تاريخ الدخول", "التاريخ", "تاريخ", "تاريخ التسجيل", "تاريخ الاضافه", "تاريخ التواصل", "date", "entry date", "created time", "created", "created at", "created date", "lead date", "submitted", "submission date", "timestamp"] },
  { key: "legacy_id", label: "الكود القديم (ID)", aliases: ["id", "الكود", "كود", "كود العميل", "رقم العميل", "lead id", "leadid", "lead code", "external id"] },
  { key: "source", label: "المصدر", aliases: ["المصدر", "مصدر", "مصدر العميل", "القناه", "المنصه", "source", "lead source", "channel", "platform"] },
  { key: "campaign", label: "الحملة / الإعلان", aliases: ["الحمله", "حمله", "اسم الحمله", "الاعلان", "اسم الاعلان", "الفورم", "campaign", "campaign name", "ad name", "adset name", "ad set name", "form name", "form", "utm campaign"] },
  { key: "service", label: "الخدمة", aliases: ["الخدمه", "خدمه", "الخدمه المطلوبه", "نوع الخدمه", "العلاج", "نوع العلاج", "المطلوب", "الاهتمام", "service", "services", "treatment", "interest", "interested in", "procedure"] },
  { key: "case_size", label: "حجم الحالة", aliases: ["حجم الحاله", "عدد الاسنان", "عدد الزرعات", "عدد الزراعات", "الاسنان المفقوده", "عدد الاسنان المفقوده", "case size", "number of teeth", "teeth", "implants needed", "number of implants", "implants", "missing teeth", "teeth count"] },
  { key: "start_timing", label: "موعد البدء", aliases: ["موعد البدء", "موعد البدايه", "امتي تحب تبدا", "امتى تبدا", "التوقيت", "start timing", "when to start", "start date", "timing"] },
  { key: "branch", label: "الفرع", aliases: ["الفرع", "فرع", "branch", "location", "clinic"] },
  { key: "gender", label: "النوع", aliases: ["النوع", "الجنس", "gender", "sex"] },
  { key: "job_title", label: "الوظيفة", aliases: ["الوظيفه", "المهنه", "الشغل", "job", "job title", "occupation", "profession"] },
  { key: "asked_price", label: "سأل عن السعر", aliases: ["سال عن السعر/الخدمه", "سال عن السعر", "سال عن السعر او الخدمه", "asked price", "asked about price"] },
  { key: "opened_messenger", label: "فتح ماسنجر", aliases: ["فتح ماسنجر", "opened messenger", "messenger opened"] },
  { key: "conversation_summary", label: "ملخص المحادثة", aliases: ["ملخص المحادثه", "المحادثه", "ملخص", "تفاصيل", "تفاصيل الحاله", "conversation", "conversation summary", "summary", "details", "message", "رساله", "الرساله"] },
  { key: "contact_attempts", label: "عدد المحاولات", aliases: ["عدد المحاولات", "المحاولات", "attempts", "contact attempts", "calls"] },
  { key: "expected_value", label: "القيمة المتوقعة", aliases: ["القيمه المتوقعه (ج)", "القيمه المتوقعه", "القيمه", "المبلغ", "الميزانيه", "expected value", "deal value", "value", "amount", "budget"] },
  { key: "loss_reason", label: "سبب الخسارة", aliases: ["سبب الخساره", "سبب الرفض", "loss reason", "lost reason"] },
  { key: "stage", label: "المرحلة", aliases: ["المرحله", "مرحله", "حاله العميل", "الحاله", "stage", "status", "lead status", "pipeline stage"] },
  { key: "assignee", label: "المسؤول", aliases: ["المسؤول", "مسؤول", "الموظف", "السيلز", "المندوب", "assigned to", "assignee", "owner", "agent", "sales rep"] },
  { key: "next_follow_up", label: "المتابعة القادمة", aliases: ["المتابعه القادمه", "موعد المتابعه", "تاريخ المتابعه", "next follow up", "follow up", "follow up date"] },
  { key: "last_contact", label: "آخر تواصل", aliases: ["اخر تواصل", "تاريخ اخر تواصل", "اخر مكالمه", "last contact", "last contacted"] },
  { key: "next_exam", label: "موعد الكشف", aliases: ["موعد الكشف", "ميعاد الكشف", "تاريخ الكشف", "exam date", "appointment", "appointment date"] },
  { key: "last_call_result", label: "نتيجة آخر مكالمة", aliases: ["نتيجه المكالمه", "نتيجه اخر مكالمه", "اخر نتيجه", "call result", "last call result"] },
  { key: "whatsapp_chat_url", label: "لينك شات الواتساب", aliases: ["لينك الواتساب", "لينك الواتس", "رابط الواتساب", "رابط الواتس", "لينك شات الواتساب", "لينك شات الواتس", "رابط شات الواتساب", "شات الواتساب", "شات الواتس", "محادثه الواتساب", "محادثه الواتس", "whatsapp link", "whatsapp chat", "whatsapp chat link", "whatsapp url", "wa link", "wa chat"] },
  { key: "meta_chat_url", label: "لينك الشات على Meta", aliases: ["لينك الشات", "رابط الشات", "رابط المحادثه", "لينك المحادثه", "لينك ميتا", "رابط ميتا", "لينك الماسنجر", "رابط الماسنجر", "شات الماسنجر", "لينك الانبوكس", "لينك البيزنس سويت", "بيزنس سويت", "ميتا بيزنس", "meta link", "meta chat", "meta chat link", "meta inbox", "inbox link", "business suite", "business suite link", "messenger link", "chat link", "conversation link", "instagram chat"] },
  { key: "notes", label: "ملاحظات", multi: true, aliases: ["ملاحظات", "ملاحظه", "تعليق", "تعليقات", "notes", "note", "comments", "comment", "remarks"] },
];

/** Columns the clinic's own sheet computes with formulas — recomputed server-side, never imported. */
const IGNORED_HEADERS = ["score", "التصنيف", "مؤهل", "مؤهل؟", "classification", "الاولويه", "lead score", "qualified", "priority", "lead priority", "temperature", "حراره العميل"];

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = Object.fromEntries([
  ["skip", "— تجاهل —"],
  ...IMPORT_FIELDS.map((f) => [f.key, f.label]),
]) as Record<ImportField, string>;

// ---------- text normalization ----------

/** Folds Arabic spelling variants, case, punctuation and spacing so "الخدمة المطلوبة" ≡ "الخدمه المطلوبه" ≡ "Service_Name". */
export function normKey(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // harakat + tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

const ALIAS_INDEX: { field: FieldDef["key"]; alias: string }[] = IMPORT_FIELDS.flatMap((f) =>
  f.aliases.map((a) => ({ field: f.key, alias: normKey(a) }))
);
const IGNORED_SET = new Set(IGNORED_HEADERS.map(normKey));

function exactFieldFor(header: string): FieldDef["key"] | null {
  const k = normKey(header);
  if (!k) return null;
  return ALIAS_INDEX.find((a) => a.alias === k)?.field ?? null;
}

function fuzzyFieldFor(header: string): FieldDef["key"] | null {
  const k = normKey(header);
  if (k.length < 2) return null;
  let best: { field: FieldDef["key"]; len: number } | null = null;
  for (const a of ALIAS_INDEX) {
    if (a.alias.length < 3) continue;
    if (k.includes(a.alias) && (!best || a.alias.length > best.len)) best = { field: a.field, len: a.alias.length };
  }
  return best?.field ?? null;
}

function cellToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/ /g, " ").trim();
  return s === "" ? null : s;
}

// ---------- workbook reading ----------

export function readWorkbook(buffer: Buffer, filename: string): XLSX.WorkBook {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
    // Decode as UTF-8 ourselves (with BOM stripped) — letting SheetJS guess
    // the codepage garbles Arabic in CSVs exported from Excel/Google Sheets.
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    // raw: keep every cell as text, so 01012345678 isn't turned into the number 1012345678.
    return XLSX.read(text, { type: "string", raw: true });
  }
  return XLSX.read(buffer, { type: "buffer", cellDates: false });
}

function sheetGrid(wb: XLSX.WorkBook, sheetName: string): unknown[][] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true, blankrows: true });
}

/**
 * Hyperlinks hidden behind display text ("فتح الشات" → https://…), keyed by
 * grid position. Covers both Excel link cells and =HYPERLINK("url","text").
 */
function sheetLinks(wb: XLSX.WorkBook, sheetName: string): Map<string, string> {
  const sheet = wb.Sheets[sheetName];
  const links = new Map<string, string>();
  if (!sheet || !sheet["!ref"]) return links;
  const origin = XLSX.utils.decode_range(sheet["!ref"]).s;
  for (const addr of Object.keys(sheet)) {
    if (addr.startsWith("!")) continue;
    const cell = sheet[addr] as XLSX.CellObject;
    let target = cell.l?.Target ?? null;
    if (!target && typeof cell.f === "string") {
      const m = cell.f.match(/^HYPERLINK\(\s*"([^"]+)"/i);
      if (m) target = m[1];
    }
    if (!target) continue;
    const { r, c } = XLSX.utils.decode_cell(addr);
    links.set(`${r - origin.r},${c - origin.c}`, target);
  }
  return links;
}

/** Score a candidate header row: how many cells are recognisable column names. */
function headerRowScore(row: unknown[]): { score: number; hasKey: boolean } {
  let score = 0;
  let hasKey = false;
  for (const cell of row ?? []) {
    const s = cellToString(cell);
    if (!s || s.length > 60) continue;
    const f = exactFieldFor(s);
    if (f) { score += 2; if (f === "name" || f === "mobile" || f === "first_name") hasKey = true; }
    else if (fuzzyFieldFor(s)) score += 1;
  }
  return { score, hasKey };
}

function detectHeaderRow(grid: unknown[][]): { index: number; score: number } {
  let best = { index: 0, score: -1 };
  for (let i = 0; i < Math.min(grid.length, 25); i++) {
    const { score, hasKey } = headerRowScore(grid[i]);
    const s = hasKey ? score + 3 : score;
    if (s > best.score) best = { index: i, score: s };
  }
  return best;
}

export interface SheetChoice { sheetName: string; headerRowIndex: number }

/** Picks the sheet + header row that best look like a leads table. */
export function detectSheet(wb: XLSX.WorkBook, preferred?: string): SheetChoice {
  if (preferred && wb.Sheets[preferred]) {
    return { sheetName: preferred, headerRowIndex: detectHeaderRow(sheetGrid(wb, preferred)).index };
  }
  let best: SheetChoice & { score: number } = { sheetName: wb.SheetNames[0], headerRowIndex: 0, score: -1 };
  for (const name of wb.SheetNames) {
    const grid = sheetGrid(wb, name);
    const { index, score } = detectHeaderRow(grid);
    // Prefer sheets that actually have data under the header.
    const dataRows = grid.slice(index + 1).filter((r) => r?.some((c) => cellToString(c))).length;
    const total = score * 10 + Math.min(dataRows, 50);
    if (total > best.score) best = { sheetName: name, headerRowIndex: index, score: total };
  }
  return { sheetName: best.sheetName, headerRowIndex: best.headerRowIndex };
}

export type ColumnMapping = Record<number, ImportField>;

/** Auto-maps header cells to fields. Exact alias matches win over fuzzy ones; each single-value field is used once. */
export function autoMapColumns(headers: (string | null)[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<ImportField>();
  const multi = new Set(IMPORT_FIELDS.filter((f) => f.multi).map((f) => f.key));

  const take = (i: number, f: ImportField) => {
    if (used.has(f) && !multi.has(f as FieldDef["key"])) {
      // A second phone column becomes the alternate number rather than being lost.
      if ((f === "mobile" || f === "whatsapp") && !used.has("alt_phone")) { mapping[i] = "alt_phone"; used.add("alt_phone"); return; }
      mapping[i] = "skip";
      return;
    }
    mapping[i] = f;
    used.add(f);
  };

  // Exact matches first, best alias first: for "campaign", a campaign_name
  // column beats ad_name even if ad_name comes earlier in the sheet.
  const exact: { i: number; field: FieldDef["key"]; rank: number }[] = [];
  headers.forEach((h, i) => {
    if (!h) return;
    if (IGNORED_SET.has(normKey(h))) { mapping[i] = "skip"; return; }
    const k = normKey(h);
    const def = IMPORT_FIELDS.find((f) => f.aliases.some((a) => normKey(a) === k));
    if (def) exact.push({ i, field: def.key, rank: def.aliases.findIndex((a) => normKey(a) === k) });
  });
  exact.sort((x, y) => x.rank - y.rank || x.i - y.i).forEach(({ i, field }) => take(i, field));
  headers.forEach((h, i) => {
    if (!h || i in mapping) return;
    const f = fuzzyFieldFor(h);
    take(i, f ?? "skip");
  });
  return mapping;
}

// ---------- value normalizers ----------

const AR_DIGITS: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
const asciiDigits = (s: string) => s.replace(/[٠-٩]/g, (c) => AR_DIGITS[c]);

function ymd(y: number, m: number, d: number): string | null {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return null; // e.g. 31/02
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Excel serial, ISO, d/m/y (Egyptian default), m/d/y when unambiguous, Meta's "2026-09-12T14:33:00+0200". */
export function parseDateCell(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !isNaN(v.getTime())) return ymd(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number") {
    if (v < 20000 || v > 80000) return null; // not a plausible Excel date serial
    const d = XLSX.SSF.parse_date_code(v);
    return d ? ymd(d.y, d.m, d.d) : null;
  }
  const s = asciiDigits(String(v).trim());
  if (/^\d{5}(\.\d+)?$/.test(s)) return parseDateCell(Number(s));
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return ymd(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let a = +m[1], b = +m[2];
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (b > 12 && a <= 12) [a, b] = [b, a]; // clearly m/d/y
    return ymd(y, b, a);
  }
  const t = Date.parse(s);
  if (!isNaN(t)) { const d = new Date(t); return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  return null;
}

function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && isFinite(v)) return v;
  const s = cellToString(v);
  if (!s) return null;
  const cleaned = asciiDigits(s).replace(/[٬,\s]/g, "").replace(/٫/g, ".").match(/-?\d+(\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : null;
}

const YES = new Set(["نعم", "اه", "ايوه", "ايوا", "اكيد", "yes", "y", "true", "1", "✓", "✔", "x", "صح"].map(normKey));
const NO = new Set(["لا", "no", "n", "false", "0", "لأ"].map(normKey));
function parseYesNo(v: unknown): boolean | null {
  if (v === true || v === false) return v;
  const k = normKey(v);
  if (!k) return null;
  if (YES.has(k)) return true;
  if (NO.has(k)) return false;
  return null;
}

/** Keyword rules → the fixed option lists the DB constraints allow. Order matters (more specific first). */
const SERVICE_RULES: [RegExp, string][] = [
  [/زراع|زرع|implant/, "زراعة"],
  [/تقويم|ortho|brace|aligner|invisalign/, "تقويم"],
  [/تركيب|زيركون|زركون|كراون|طربوش|فينير|ابتسامه|هوليود|crown|veneer|zircon|bridge|كوبري|طقم|prosth|smile/, "تركيبات/زيركون"],
  [/تبيض|تبييض|whiten|bleach/, "تبييض"],
  [/تنظيف|clean|scal|جير/, "تنظيف"],
  [/حشو|عصب|root|canal|fill|تسوس/, "حشو/عصب"],
  [/اطفال|طفل|child|kid|pedo/, "كشف أطفال"],
  [/جارد|guard|bruxism|صرير/, "نايت جارد"],
  [/غيرمحدد|كشف|استشاره|consult|checkup|general/, "غير محدد"],
];
const CASE_SIZE_RULES: [RegExp, string][] = [
  [/فك|كامل|^كل|طقم|full|whole|many|كتير|كبير/, "عدد كبير / فك كامل"],
  [/اكتر|اكثر|سنتين|اسنان|اتنين|تلات|multiple|more|several|^[2-9]$/, "أكتر من سن"],
  [/واحد|سنه?$|^سن|single|one|^1$/, "سن واحد"],
];
const START_TIMING_RULES: [RegExp, string][] = [
  [/اقرب|فورا|حالا|النهارده|بكره|الاسبوعده|asap|now|immediately|soon|urgent/, "في أقرب وقت"],
  [/اسبوع|اسبوعين|week/, "خلال أسبوعين"],
  [/لاحق|بعدين|شهر|مشدلوقتي|later|month|notsure|مشعارف/, "لاحقًا"],
];
const SOURCE_RULES: [RegExp, string][] = [
  [/ماسنجر|messenger/, "ماسنجر"],
  [/واتس|whatsapp|^wa$/, "واتساب"],
  [/انستا|انستج|instagram|^ig$|insta/, "إنستجرام"],
  [/تيك|tiktok/, "تيك توك"],
  [/ترشيح|referr|صديق|معرفه/, "ترشيح"],
  [/زياره|walkin|مباشر|حضور/, "زيارة مباشرة"],
  [/الموقع|website|site|web/, "الموقع"],
  [/فيس|facebook|^fb|meta|leadform|instantform/, "فيسبوك"],
  [/جوجل|google|adwords/, "جوجل"],
];

function matchRules(v: string, options: string[], rules: [RegExp, string][]): string | null {
  const exact = options.find((o) => normKey(o) === normKey(v));
  if (exact) return exact;
  const k = normKey(v);
  for (const [re, out] of rules) if (re.test(k)) return out;
  return null;
}

const STAGE_BY_KEY: Record<string, LeadStage> = (() => {
  const m: Record<string, LeadStage> = {};
  for (const [k, label] of Object.entries(STAGE_LABELS)) { m[normKey(k)] = k as LeadStage; m[normKey(label)] = k as LeadStage; }
  Object.assign(m, {
    [normKey("لم يتم التواصل")]: "new", [normKey("تواصل")]: "contacted", [normKey("حجز")]: "exam_booked",
    [normKey("حضر")]: "exam_attended", [normKey("لا يرد")]: "no_answer", [normKey("مغلق")]: "no_answer",
    [normKey("رفض")]: "not_interested", [normKey("مش مهتم")]: "not_interested", [normKey("بدأ")]: "treatment_started",
  });
  return m;
})();

function splitPhones(v: unknown): string[] {
  if (v === null || v === undefined) return [];
  const s = typeof v === "number" ? String(Math.round(v)) : String(v);
  return s.split(/[\/,;|\n،]| و | - (?=\+?\d)/).map((x) => x.trim()).filter(Boolean);
}

// ---------- parsing ----------

export interface ImportContext {
  weights?: ScoringWeights;
  thresholds?: ClassificationThresholds;
  branches: { id: string; name: string; slug: string }[];
  users: { id: string; name: string; email: string }[];
}

export interface ImportOptions {
  sheetName?: string;
  headerRowIndex?: number;
  mapping?: ColumnMapping;
  unmappedToNotes?: boolean; // default true
  defaultSource?: string;
  campaign?: string;
}

export interface ParsedLeadRow {
  rowNumber: number; // 1-based sheet row, for error reporting
  legacy_id: string | null;
  entry_date: string | null; // YYYY-MM-DD
  name: string;
  mobile_raw: string | null;
  whatsapp_raw: string | null;
  alt_phone: string | null;
  source: string | null;
  campaign_raw: string | null;
  service_interest: string | null;
  case_size: string | null;
  start_timing: string | null;
  branch_id: string | null;
  gender: string | null;
  job_title: string | null;
  asked_price: boolean;
  opened_messenger: boolean;
  conversation_summary: string | null;
  contact_attempts: number;
  expected_value_egp: number | null;
  loss_reason: string | null;
  stage: LeadStage;
  assigned_to: string | null;
  next_follow_up_at: string | null;
  last_contact_at: string | null;
  next_exam_at: string | null;
  last_call_result: string | null;
  notes: string | null;
  whatsapp_chat_url: string | null;
  meta_chat_url: string | null;

  // Computed server-side — never trusts a sheet's own Score/التصنيف/مؤهل؟ columns.
  mobile_normalized: string | null;
  whatsapp_normalized: string | null;
  lead_score: number;
  score_breakdown: unknown;
  classification: "Hot" | "Warm" | "Cold";
  qualification_status: "qualified" | "qualifies_by_call" | "needs_phone" | "invalid_phone";

  needs_review: boolean;
  review_notes: string[];
  /** Set when an earlier row in the same file is the same person (same phone or ID). */
  duplicateOfRow: number | null;
}

export interface ColumnInfo {
  index: number;
  header: string;
  samples: string[];
  field: ImportField;
  /** "content" = mapped because of the values inside the column, not its header — shown as a hint in the UI. */
  detectedBy?: "header" | "content";
}

export interface ParseResult {
  sheetName: string;
  sheetNames: string[];
  headerRowIndex: number;
  columns: ColumnInfo[];
  rows: ParsedLeadRow[];
  totalDataRows: number;      // rows that became leads
  skippedBlankRows: number;   // fully empty / formula-padding rows
  skippedNoContact: number;   // had data but neither a name nor a phone
  unmappedRequired: string[]; // e.g. no name AND no phone column mapped
}

export function parseLeadsWorkbook(wb: XLSX.WorkBook, ctx: ImportContext, opts: ImportOptions = {}): ParseResult {
  if (wb.SheetNames.length === 0) throw new Error("الملف لا يحتوي على أي ورقة");
  const detected = detectSheet(wb, opts.sheetName);
  const sheetName = detected.sheetName;
  const grid = sheetGrid(wb, sheetName);
  const links = sheetLinks(wb, sheetName);
  /** A cell's real URL: the hyperlink target if there is one, else its text — only if it's a safe web link. */
  const cellUrl = (r: number, i: number): string | null =>
    sanitizeChatUrl(links.get(`${r},${i}`) ?? cellToString(grid[r]?.[i]));
  const headerRowIndex = opts.headerRowIndex !== undefined && opts.headerRowIndex >= 0 && opts.headerRowIndex < grid.length
    ? opts.headerRowIndex
    : detected.headerRowIndex;

  const headerRow = grid[headerRowIndex] ?? [];
  const width = Math.max(headerRow.length, ...grid.slice(headerRowIndex + 1, headerRowIndex + 50).map((r) => r?.length ?? 0));
  const headers: (string | null)[] = Array.from({ length: width }, (_, i) => cellToString(headerRow[i]));
  const userMapped = Boolean(opts.mapping && Object.keys(opts.mapping).length);
  const mapping: ColumnMapping = userMapped ? opts.mapping! : autoMapColumns(headers);
  const contentDetected = new Set<number>();

  // Content-based detection: a column that is mostly links is a chat-link
  // column whatever its header says (e.g. a "واتساب" column holding wa.me links),
  // routed by the links' domain. Never overrides a mapping the user chose.
  if (!userMapped) {
    const taken = new Set(Object.values(mapping));
    for (let i = 0; i < headers.length; i++) {
      const kinds: Record<string, number> = {};
      let filled = 0;
      for (let r = headerRowIndex + 1; r < grid.length && filled < 30; r++) {
        if (!cellToString(grid[r]?.[i]) && !links.has(`${r},${i}`)) continue;
        filled++;
        const url = cellUrl(r, i);
        const kind = url ? classifyChatUrl(url) : null;
        if (kind) kinds[kind] = (kinds[kind] ?? 0) + 1;
      }
      for (const [kind, n] of Object.entries(kinds)) {
        const field: ImportField = kind === "whatsapp" ? "whatsapp_chat_url" : "meta_chat_url";
        if (filled > 0 && n / filled >= 0.5 && (mapping[i] === field || !taken.has(field))) {
          if (mapping[i] !== field) contentDetected.add(i);
          mapping[i] = field;
          taken.add(field);
        }
      }
    }

    // Sanity check on header matches for phone fields: "Phone Verified" contains
    // "phone" but holds yes/no — a phone column must actually hold numbers.
    for (let i = 0; i < headers.length; i++) {
      if (!["mobile", "whatsapp", "alt_phone"].includes(mapping[i] ?? "")) continue;
      const vals: string[] = [];
      for (let r = headerRowIndex + 1; r < grid.length && vals.length < 30; r++) {
        const v = grid[r]?.[i];
        const str = typeof v === "number" ? String(Math.round(v)) : cellToString(v);
        if (str) vals.push(str);
      }
      const phoneLike = vals.filter((v) => (asciiDigits(v).match(/\d/g) ?? []).length >= 7).length;
      if (vals.length >= 2 && phoneLike / vals.length < 0.5) {
        taken.delete(mapping[i]);
        mapping[i] = "skip";
      }
    }

    // Categorical columns recognised by their values: a column full of
    // "سن واحد / أكتر من سن / فك كامل" is the case size whatever it's called.
    // Only fills columns the header pass left unmapped, only fields nobody
    // has claimed yet, and only when most values are short and match.
    const branchKeys = ctx.branches.flatMap((b) => [normKey(b.name), normKey(b.slug)]).filter(Boolean);
    const exactIn = (opts: string[]) => { const set = new Set(opts.map(normKey)); return (v: string) => set.has(normKey(v)); };
    const detectors: { field: ImportField; test: (v: string) => boolean }[] = [
      { field: "case_size", test: (v) => matchRules(v, CASE_SIZE_OPTIONS, CASE_SIZE_RULES) !== null },
      { field: "start_timing", test: (v) => matchRules(v, START_TIMING_OPTIONS, START_TIMING_RULES) !== null },
      { field: "service", test: (v) => matchRules(v, SERVICE_INTEREST_OPTIONS, SERVICE_RULES) !== null },
      { field: "stage", test: (v) => normKey(v) in STAGE_BY_KEY },
      { field: "loss_reason", test: exactIn(LOSS_REASON_OPTIONS) },
      { field: "gender", test: (v) => /^(ذكر|انثي|male|female|m|f|راجل|ست|سيده)$/.test(normKey(v)) },
      { field: "branch", test: (v) => { const k = normKey(v); return branchKeys.some((b) => k === b || (k.length >= 3 && (k.includes(b) || b.includes(k)))); } },
      { field: "source", test: (v) => matchRules(v, SOURCE_OPTIONS, SOURCE_RULES) !== null },
      // Only written dates ("12/09/2026", "2026-09-12T…") — a bare number could be money or a count.
      { field: "entry_date", test: (v) => /\d[-/.]\d/.test(v) && parseDateCell(v) !== null },
    ];
    for (let i = 0; i < headers.length; i++) {
      if ((mapping[i] ?? "skip") !== "skip") continue;
      if (headers[i] && IGNORED_SET.has(normKey(headers[i]))) continue;
      const values: unknown[] = [];
      for (let r = headerRowIndex + 1; r < grid.length && values.length < 40; r++) {
        const raw = grid[r]?.[i];
        if (cellToString(raw)) values.push(raw);
      }
      if (values.length < 2) continue;
      // Free text (notes, summaries) is long; categorical values are short. Dates may be numeric serials.
      const shortValues = values.filter((v) => typeof v === "number" || String(v).trim().length <= 30);
      if (shortValues.length / values.length < 0.8) continue;
      let best: { field: ImportField; ratio: number } | null = null;
      for (const d of detectors) {
        if (taken.has(d.field)) continue;
        // Text values only, and never bare digits ("2", "3" are counts, not "أكتر من سن").
        const hits = values.filter((v) => typeof v === "string" && !/^\s*\d+\s*$/.test(v) && d.test(v)).length;
        const ratio = hits / values.length;
        if (ratio >= 0.6 && (!best || ratio > best.ratio)) best = { field: d.field, ratio };
      }
      if (best) {
        mapping[i] = best.field;
        taken.add(best.field);
        contentDetected.add(i);
      }
    }
  }

  const columns: ColumnInfo[] = headers.map((h, i) => {
    const samples: string[] = [];
    for (let r = headerRowIndex + 1; r < grid.length && samples.length < 3; r++) {
      const s = links.get(`${r},${i}`) ?? cellToString(grid[r]?.[i]);
      if (s) samples.push(s.length > 40 ? s.slice(0, 40) + "…" : s);
    }
    const field = mapping[i] ?? "skip";
    return {
      index: i, header: h ?? `عمود ${XLSX.utils.encode_col(i)}`, samples, field,
      detectedBy: field === "skip" ? undefined : contentDetected.has(i) ? ("content" as const) : ("header" as const),
    };
  }).filter((c) => headers[c.index] || c.samples.length > 0);

  const colsFor = (f: ImportField) => columns.filter((c) => c.field === f).map((c) => c.index);
  const has = (f: ImportField) => colsFor(f).length > 0;
  const unmappedRequired: string[] = [];
  if (!has("name") && !has("first_name") && !has("mobile") && !has("whatsapp")) {
    unmappedRequired.push("لازم تحدد عمود الاسم أو عمود الموبايل على الأقل");
  }

  const branchByKey = new Map<string, string>();
  for (const b of ctx.branches) { branchByKey.set(normKey(b.name), b.id); branchByKey.set(normKey(b.slug), b.id); }
  const userByKey = new Map<string, string>();
  for (const u of ctx.users) { userByKey.set(normKey(u.name), u.id); if (u.email) userByKey.set(normKey(u.email), u.id); }

  const unmappedToNotes = opts.unmappedToNotes !== false;
  const rows: ParsedLeadRow[] = [];
  let skippedBlankRows = 0;
  let skippedNoContact = 0;
  const seenPhone = new Map<string, number>();
  const seenLegacy = new Map<string, number>();

  for (let r = headerRowIndex + 1; r < grid.length; r++) {
    const row = grid[r] ?? [];
    if (unmappedRequired.length) break;
    const first = (f: ImportField): unknown => {
      for (const i of colsFor(f)) { const v = row[i]; if (cellToString(v)) return v; }
      return null;
    };
    const str = (f: ImportField) => cellToString(first(f));

    if (!row.some((c) => cellToString(c))) { skippedBlankRows++; continue; }

    const review: string[] = [];

    // --- chat links (hyperlink target or plain text; only safe http(s) links are kept) ---
    const chatLink = (f: ImportField): string | null => {
      for (const i of colsFor(f)) {
        const raw = links.get(`${r},${i}`) ?? cellToString(row[i]);
        if (!raw) continue;
        const url = sanitizeChatUrl(raw);
        if (url) return url;
        review.push(`لينك غير صالح في عمود "${headers[i] ?? ""}" — اتجاهل`);
      }
      return null;
    };
    const whatsapp_chat_url = chatLink("whatsapp_chat_url");
    const meta_chat_url = chatLink("meta_chat_url");
    // wa.me/2010… and api.whatsapp.com/send?phone=… carry the number itself.
    let waLinkPhone: string | null = null;
    if (whatsapp_chat_url) {
      const u = new URL(whatsapp_chat_url);
      waLinkPhone = (u.hostname.endsWith("wa.me") ? u.pathname.slice(1) : u.searchParams.get("phone")) || null;
      if (waLinkPhone && !/^\+?\d{10,15}$/.test(waLinkPhone)) waLinkPhone = null;
    }

    // --- phones (a cell may hold several numbers: "010… / 011…") ---
    const phoneCandidates = [
      ...[...colsFor("mobile"), ...colsFor("whatsapp"), ...colsFor("alt_phone")].flatMap((i) => splitPhones(row[i])),
      ...(waLinkPhone ? [waLinkPhone] : []),
    ];
    const mobileCells = colsFor("mobile").flatMap((i) => splitPhones(row[i]));
    const valid = phoneCandidates.map((p) => ({ raw: p, n: normalizeEgyptianPhone(p) }));
    const primary = valid.find((p) => mobileCells.includes(p.raw) && p.n.valid) ?? valid.find((p) => p.n.valid) ?? (mobileCells[0] ? valid.find((p) => p.raw === mobileCells[0]) : valid[0]);
    const phone = primary?.n ?? normalizeEgyptianPhone(null);
    // Store a valid number in clean local form (01XXXXXXXXX) whatever the file had ("p:+20…", "1012345678", "+20 10 …").
    const mobile_raw = primary ? (phone.valid && phone.normalized ? "0" + phone.normalized.slice(3) : cleanPhoneInput(primary.raw)) : null;
    const others = valid.filter((p) => p !== primary && (!p.n.valid || p.n.normalized !== phone.normalized));
    const waCell = splitPhones(first("whatsapp"))[0] ?? null;
    const wa = waCell ? normalizeEgyptianPhone(waCell) : null;
    const alt_phone = others.filter((p) => p.raw !== waCell).map((p) => cleanPhoneInput(p.raw)).join(" / ") || null;
    if (mobile_raw && !phone.valid) review.push("رقم الموبايل غير صالح — يحتاج مراجعة يدوية");

    // --- name ---
    let name = str("name");
    if (!name) {
      const fn = str("first_name"), ln = str("last_name");
      name = [fn, ln].filter(Boolean).join(" ") || null;
    }
    // Nothing to identify or reach the person by → not a lead (usually formula padding or a half-typed row).
    if (!name && !phone.valid) { skippedNoContact++; continue; }
    if (!name) { name = `بدون اسم (${mobile_raw})`; review.push("الاسم غير موجود في الملف"); }

    // --- dates ---
    const entryRaw = first("entry_date");
    const entry_date = parseDateCell(entryRaw);
    if (cellToString(entryRaw) && !entry_date) review.push(`تاريخ غير مفهوم: "${cellToString(entryRaw)}" — تم استخدام تاريخ الاستيراد`);
    const fuRaw = first("next_follow_up");
    const fuDate = parseDateCell(fuRaw);
    const next_follow_up_at = fuDate ? new Date(`${fuDate}T10:00:00+02:00`).toISOString() : null;
    const lcDate = parseDateCell(first("last_contact"));
    const last_contact_at = lcDate ? new Date(`${lcDate}T12:00:00+02:00`).toISOString() : null;
    const exDate = parseDateCell(first("next_exam"));
    const next_exam_at = exDate ? new Date(`${exDate}T12:00:00+02:00`).toISOString() : null;

    // --- categorical fields ---
    const sourceRaw = str("source");
    const source = sourceRaw ? (matchRules(sourceRaw, SOURCE_OPTIONS, SOURCE_RULES) ?? sourceRaw) : (opts.defaultSource || null);

    const serviceRaw = str("service");
    let service_interest: string | null = null;
    if (serviceRaw) {
      service_interest = matchRules(serviceRaw, SERVICE_INTEREST_OPTIONS, SERVICE_RULES);
      if (!service_interest) review.push(`الخدمة "${serviceRaw}" — تحتاج تصنيف يدوي`);
    }

    const caseSizeRaw = str("case_size");
    const case_size = caseSizeRaw ? matchRules(caseSizeRaw, CASE_SIZE_OPTIONS, CASE_SIZE_RULES) : null;
    if (caseSizeRaw && !case_size) review.push(`حجم حالة غير مفهوم: "${caseSizeRaw}"`);

    const timingRaw = str("start_timing");
    const start_timing = timingRaw ? matchRules(timingRaw, START_TIMING_OPTIONS, START_TIMING_RULES) : null;
    if (timingRaw && !start_timing) review.push(`موعد بدء غير مفهوم: "${timingRaw}"`);

    const branchRaw = str("branch");
    let branch_id: string | null = null;
    if (branchRaw) {
      const k = normKey(branchRaw);
      branch_id = branchByKey.get(k) ?? [...branchByKey.entries()].find(([bk]) => bk && (k.includes(bk) || bk.includes(k)))?.[1] ?? null;
      if (!branch_id) review.push(`فرع غير معروف: "${branchRaw}"`);
    }

    const lossRaw = str("loss_reason");
    const loss_reason = lossRaw ? LOSS_REASON_OPTIONS.find((o) => normKey(o) === normKey(lossRaw)) ?? "أخرى" : null;

    const stageRaw = str("stage");
    let stage: LeadStage = "new";
    if (stageRaw) {
      const s = STAGE_BY_KEY[normKey(stageRaw)];
      if (s) stage = s; else review.push(`مرحلة غير معروفة: "${stageRaw}" — اتسجل كـ "جديد"`);
    }

    const assigneeRaw = str("assignee");
    let assigned_to: string | null = null;
    if (assigneeRaw) {
      assigned_to = userByKey.get(normKey(assigneeRaw)) ?? null;
      if (!assigned_to) review.push(`المسؤول "${assigneeRaw}" مش موجود في فريق النظام`);
    }

    const genderRaw = str("gender");
    const gk = normKey(genderRaw);
    const gender = !genderRaw ? null : /^(ذكر|male|m|راجل)$/.test(gk) ? "ذكر" : /^(انثي|انثى|female|f|ست|سيده)$/.test(gk) ? "أنثى" : genderRaw;

    const askedPrice = parseYesNo(first("asked_price")) ?? false;
    const openedMessenger = parseYesNo(first("opened_messenger")) ?? false;

    // --- notes: mapped notes columns + email + everything unmapped (nothing in the file is silently lost) ---
    const noteParts: string[] = [];
    for (const i of colsFor("notes")) { const s = cellToString(row[i]); if (s) noteParts.push(s); }
    const email = str("email");
    if (email) noteParts.push(`الإيميل: ${email}`);
    if (lossRaw && loss_reason === "أخرى" && normKey(lossRaw) !== normKey("أخرى")) noteParts.push(`سبب الخسارة: ${lossRaw}`);
    if (unmappedToNotes) {
      for (const c of columns) {
        if (c.field !== "skip" || IGNORED_SET.has(normKey(c.header))) continue;
        const s = cellToString(row[c.index]);
        if (s) noteParts.push(`${c.header}: ${s}`);
      }
    }

    const legacy_id = str("legacy_id");
    const campaign_raw = str("campaign") ?? (opts.campaign || null);
    // No service column but the campaign says it ("Dental Implants | Leads | Sep") → infer it.
    // Only a specific service counts; a vague match ("غير محدد") is not worth guessing.
    if (!service_interest && !serviceRaw && campaign_raw) {
      const inferred = matchRules(campaign_raw, SERVICE_INTEREST_OPTIONS, SERVICE_RULES);
      if (inferred && inferred !== "غير محدد") service_interest = inferred;
    }

    const { score, classification, breakdown } = computeLeadScore(
      { case_size, start_timing, asked_price: askedPrice, opened_messenger: openedMessenger, has_valid_phone: phone.valid },
      ctx.weights, ctx.thresholds
    );
    const qualification_status = computeQualificationStatus({
      has_any_phone: Boolean(mobile_raw), has_valid_phone: phone.valid, asked_price: askedPrice,
    });

    // --- duplicate inside the same file ---
    let duplicateOfRow: number | null = null;
    if (phone.normalized && seenPhone.has(phone.normalized)) duplicateOfRow = seenPhone.get(phone.normalized)!;
    else if (legacy_id && seenLegacy.has(legacy_id)) duplicateOfRow = seenLegacy.get(legacy_id)!;
    if (phone.normalized && !seenPhone.has(phone.normalized)) seenPhone.set(phone.normalized, r + 1);
    if (legacy_id && !seenLegacy.has(legacy_id)) seenLegacy.set(legacy_id, r + 1);

    const attempts = parseNumber(first("contact_attempts"));

    rows.push({
      rowNumber: r + 1,
      legacy_id,
      entry_date,
      name,
      mobile_raw,
      whatsapp_raw: waCell ? cleanPhoneInput(waCell) : null,
      alt_phone,
      source,
      campaign_raw,
      service_interest,
      case_size,
      start_timing,
      branch_id,
      gender,
      job_title: str("job_title"),
      asked_price: askedPrice,
      opened_messenger: openedMessenger,
      conversation_summary: str("conversation_summary"),
      contact_attempts: attempts !== null ? Math.max(0, Math.round(attempts)) : 0,
      expected_value_egp: parseNumber(first("expected_value")),
      loss_reason,
      stage,
      assigned_to,
      next_follow_up_at,
      last_contact_at,
      next_exam_at,
      last_call_result: str("last_call_result"),
      notes: noteParts.length ? noteParts.join("\n") : null,
      whatsapp_chat_url,
      meta_chat_url,
      mobile_normalized: phone.normalized,
      whatsapp_normalized: wa?.normalized ?? null,
      lead_score: score,
      score_breakdown: breakdown,
      classification,
      qualification_status,
      needs_review: review.length > 0,
      review_notes: review,
      duplicateOfRow,
    });
  }

  return {
    sheetName,
    sheetNames: wb.SheetNames,
    headerRowIndex,
    columns,
    rows,
    totalDataRows: rows.length,
    skippedBlankRows,
    skippedNoContact,
    unmappedRequired,
  };
}

/** Parses the multipart body shared by the preview and execute routes. */
export function parseImportOptions(raw: FormDataEntryValue | null): ImportOptions & { assignees: string[]; duplicatePolicy: "skip" | "merge" } {
  let o: Record<string, unknown> = {};
  if (typeof raw === "string" && raw) {
    try { o = JSON.parse(raw); } catch { /* fall back to defaults */ }
  }
  const mapping: ColumnMapping = {};
  if (o.mapping && typeof o.mapping === "object") {
    const valid = new Set<string>(["skip", ...IMPORT_FIELDS.map((f) => f.key)]);
    for (const [k, v] of Object.entries(o.mapping as Record<string, unknown>)) {
      if (/^\d+$/.test(k) && typeof v === "string" && valid.has(v)) mapping[Number(k)] = v as ImportField;
    }
  }
  return {
    sheetName: typeof o.sheetName === "string" ? o.sheetName : undefined,
    headerRowIndex: typeof o.headerRowIndex === "number" ? o.headerRowIndex : undefined,
    mapping: Object.keys(mapping).length ? mapping : undefined,
    unmappedToNotes: o.unmappedToNotes !== false,
    defaultSource: typeof o.defaultSource === "string" ? o.defaultSource.trim() : undefined,
    campaign: typeof o.campaign === "string" ? o.campaign.trim() : undefined,
    assignees: Array.isArray(o.assignees) ? o.assignees.filter((x): x is string => typeof x === "string" && x.length > 0) : [],
    duplicatePolicy: o.duplicatePolicy === "merge" ? "merge" : "skip",
  };
}
