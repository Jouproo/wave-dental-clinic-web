import type { LeadStage, LeadClassification, LeadQualificationStatus } from "@/types/admin";

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  exam_booked: "تم حجز كشف",
  exam_attended: "حضر الكشف",
  plan_presented: "اتعرضت خطة علاج",
  treatment_started: "بدأ العلاج",
  completed: "مكتمل",
  no_answer: "لم يرد",
  not_interested: "غير مهتم",
  unqualified: "غير مؤهل",
  lost: "خسارة",
};

/** The core pipeline progression, shown as the Kanban/funnel path. Everything else is a side-track status, filterable but kept out of the main funnel so the UI doesn't get crowded. */
export const PIPELINE_STAGES: LeadStage[] = [
  "new", "contacted", "qualified", "exam_booked", "exam_attended", "plan_presented", "treatment_started", "completed",
];
export const SIDE_TRACK_STAGES: LeadStage[] = ["no_answer", "not_interested", "unqualified", "lost"];

export const CLASSIFICATION_LABELS: Record<LeadClassification, string> = {
  Hot: "🔥 Hot", Warm: "Warm", Cold: "Cold",
};
export const CLASSIFICATION_COLORS: Record<LeadClassification, string> = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-amber-100 text-amber-700",
  Cold: "bg-blue-100 text-blue-700",
};

export const QUALIFICATION_LABELS: Record<LeadQualificationStatus, string> = {
  qualified: "✅ مؤهل",
  qualifies_by_call: "☎️ يتأهل بالمكالمة",
  needs_phone: "📩 محتاج رقم",
  invalid_phone: "❌ رقم غير صالح",
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: "bg-slate-100 text-slate-600",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-cyan-100 text-cyan-700",
  exam_booked: "bg-purple-100 text-purple-700",
  exam_attended: "bg-indigo-100 text-indigo-700",
  plan_presented: "bg-amber-100 text-amber-700",
  treatment_started: "bg-teal-100 text-teal-700",
  completed: "bg-green-100 text-green-700",
  no_answer: "bg-gray-100 text-gray-600",
  not_interested: "bg-gray-100 text-gray-600",
  unqualified: "bg-gray-100 text-gray-600",
  lost: "bg-red-100 text-red-700",
};

export const SOURCE_OPTIONS = [
  "Instant Form - زراعة سبتمبر", "فيسبوك", "ماسنجر", "واتساب", "إنستجرام", "تيك توك", "جوجل", "ترشيح", "زيارة مباشرة", "الموقع", "أخرى",
];

/** Why a lead was moved to the archive. Archiving is reversible; the reason keeps the archive explainable. */
export const ARCHIVE_REASON_OPTIONS = [
  "ليد قديم — انتهت صلاحيته",
  "لم يرد بعد عدة محاولات",
  "رقم خطأ / غير صالح",
  "مكرر",
  "غير مهتم",
  "تم التعامل معه خارج النظام",
  "أخرى",
];

export const SERVICE_INTEREST_OPTIONS = [
  "زراعة", "تقويم", "تركيبات/زيركون", "تبييض", "تنظيف", "حشو/عصب", "كشف أطفال", "نايت جارد", "غير محدد",
];

export const CASE_SIZE_OPTIONS = ["سن واحد", "أكتر من سن", "عدد كبير / فك كامل"];
export const START_TIMING_OPTIONS = ["في أقرب وقت", "خلال أسبوعين", "لاحقًا"];

export const LOSS_REASON_OPTIONS = [
  "السعر", "المكان بعيد", "راح عيادة تانية", "مش وقته", "مش مقتنع", "لم يرد نهائيًا", "رقم خطأ", "أخرى",
];

export function followUpUrgency(nextFollowUpAt: string | null): "overdue" | "today" | "upcoming" | "none" {
  if (!nextFollowUpAt) return "none";
  const due = new Date(nextFollowUpAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  if (due < startOfToday) return "overdue";
  if (due < startOfTomorrow) return "today";
  return "upcoming";
}

/** YYYY-MM-DD in the clinic's local calendar (not UTC — toISOString() would shift Egyptian late-night dates). */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type DatePreset =
  | "" | "today" | "last7" | "last30" | "this_month" | "last_month" | "older30" | "older60" | "older90";

export const DATE_PRESET_LABELS: Record<Exclude<DatePreset, "">, string> = {
  today: "النهارده",
  last7: "آخر 7 أيام",
  last30: "آخر 30 يوم",
  this_month: "الشهر الحالي",
  last_month: "الشهر اللي فات",
  older30: "أقدم من 30 يوم",
  older60: "أقدم من 60 يوم",
  older90: "أقدم من 90 يوم",
};

/** Resolves a quick preset to an inclusive entry_date range. */
export function datePresetRange(preset: DatePreset, now: Date = new Date()): { from: string; to: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n: number) => toYmd(new Date(today.getTime() - n * 86400000));
  switch (preset) {
    case "today": return { from: toYmd(today), to: toYmd(today) };
    case "last7": return { from: daysAgo(6), to: toYmd(today) };
    case "last30": return { from: daysAgo(29), to: toYmd(today) };
    case "this_month": return { from: toYmd(new Date(today.getFullYear(), today.getMonth(), 1)), to: toYmd(today) };
    case "last_month": return {
      from: toYmd(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: toYmd(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
    case "older30": return { from: "", to: daysAgo(31) };
    case "older60": return { from: "", to: daysAgo(61) };
    case "older90": return { from: "", to: daysAgo(91) };
    default: return { from: "", to: "" };
  }
}

/** Whole days since the lead entered the funnel. */
export function leadAgeDays(entryDate: string, now: Date = new Date()): number {
  const [y, m, d] = entryDate.split("-").map(Number);
  const entry = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - entry.getTime()) / 86400000));
}
