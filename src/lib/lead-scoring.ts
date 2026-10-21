export interface ScoringWeights {
  case_size: Record<string, number>;
  start_timing: Record<string, number>;
  asked_price: number;
  opened_messenger: number;
  valid_phone: number;
}

export interface ClassificationThresholds {
  hot_min: number;
  warm_min: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  case_size: { "سن واحد": 10, "أكتر من سن": 20, "عدد كبير / فك كامل": 30 },
  start_timing: { "في أقرب وقت": 30, "خلال أسبوعين": 20, "لاحقًا": 5 },
  asked_price: 25,
  opened_messenger: 5,
  valid_phone: 10,
};

export const DEFAULT_CLASSIFICATION_THRESHOLDS: ClassificationThresholds = {
  hot_min: 70,
  warm_min: 45,
};

export type Classification = "Hot" | "Warm" | "Cold";
export type QualificationStatus = "qualified" | "qualifies_by_call" | "needs_phone" | "invalid_phone";

export interface ScoreInput {
  case_size: string | null;
  start_timing: string | null;
  asked_price: boolean;
  opened_messenger: boolean;
  has_valid_phone: boolean;
}

export interface ScoreBreakdownEntry {
  rule: string;
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  classification: Classification;
  breakdown: ScoreBreakdownEntry[];
}

/** Server-computed — never trust a client-submitted score. Unspecified case_size/start_timing score 0, per spec. */
export function computeLeadScore(
  input: ScoreInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  thresholds: ClassificationThresholds = DEFAULT_CLASSIFICATION_THRESHOLDS
): ScoreResult {
  const breakdown: ScoreBreakdownEntry[] = [];

  const caseSizePoints = input.case_size ? weights.case_size[input.case_size] ?? 0 : 0;
  if (input.case_size) {
    breakdown.push({ rule: "case_size", label: `حجم الحالة: ${input.case_size}`, points: caseSizePoints });
  }

  const startTimingPoints = input.start_timing ? weights.start_timing[input.start_timing] ?? 0 : 0;
  if (input.start_timing) {
    breakdown.push({ rule: "start_timing", label: `موعد البدء: ${input.start_timing}`, points: startTimingPoints });
  }

  const askedPricePoints = input.asked_price ? weights.asked_price : 0;
  if (input.asked_price) {
    breakdown.push({ rule: "asked_price", label: "سأل عن السعر/الخدمة", points: askedPricePoints });
  }

  const messengerPoints = input.opened_messenger ? weights.opened_messenger : 0;
  if (input.opened_messenger) {
    breakdown.push({ rule: "opened_messenger", label: "فتح ماسنجر بعد الفورم", points: messengerPoints });
  }

  const validPhonePoints = input.has_valid_phone ? weights.valid_phone : 0;
  if (input.has_valid_phone) {
    breakdown.push({ rule: "valid_phone", label: "رقم صالح", points: validPhonePoints });
  }

  const score = caseSizePoints + startTimingPoints + askedPricePoints + messengerPoints + validPhonePoints;

  let classification: Classification = "Cold";
  if (score >= thresholds.hot_min) classification = "Hot";
  else if (score >= thresholds.warm_min) classification = "Warm";

  return { score, classification, breakdown };
}

export interface QualificationInput {
  has_valid_phone: boolean;
  has_any_phone: boolean;
  asked_price: boolean;
}

/** Qualification is computed and stored separately from `stage` — it never auto-advances the manually-controlled stage. */
export function computeQualificationStatus(input: QualificationInput): QualificationStatus {
  if (!input.has_any_phone) return "needs_phone";
  if (!input.has_valid_phone) return "invalid_phone";
  return input.asked_price ? "qualified" : "qualifies_by_call";
}

export const QUALIFICATION_LABELS: Record<QualificationStatus, string> = {
  qualified: "✅ مؤهل",
  qualifies_by_call: "☎️ يتأهل بالمكالمة",
  needs_phone: "📩 محتاج رقم",
  invalid_phone: "❌ رقم غير صالح",
};
