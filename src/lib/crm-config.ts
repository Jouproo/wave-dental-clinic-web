/**
 * CRM settings that staff can edit from /admin/crm/settings (stored in
 * crm_settings.config). Client-safe: no server imports here, so both server
 * pages and client components read labels/colors through the same helpers.
 */
import type { LeadStage } from "@/types/admin";
import { STAGE_LABELS, SOURCE_OPTIONS, ARCHIVE_REASON_OPTIONS, PIPELINE_STAGES, SIDE_TRACK_STAGES } from "@/lib/crm-labels";

/** Color names → `.tn-<name>` classes in globals.css (badges, bar fills). */
export const TONES = ["slate", "blue", "sky", "cyan", "teal", "green", "emerald", "amber", "orange", "red", "rose", "pink", "violet", "indigo", "navy"] as const;
export type Tone = (typeof TONES)[number];

export const TONE_LABELS: Record<Tone, string> = {
  slate: "رمادي", blue: "أزرق", sky: "سماوي", cyan: "فيروزي", teal: "زيتي", green: "أخضر", emerald: "زمردي",
  amber: "كهرماني", orange: "برتقالي", red: "أحمر", rose: "وردي غامق", pink: "وردي", violet: "بنفسجي", indigo: "نيلي", navy: "كحلي",
};

export const ALL_STAGES: LeadStage[] = [...PIPELINE_STAGES, ...SIDE_TRACK_STAGES];

/** Stage outcome — fixed per stage because reports and "overdue" depend on it. */
export const WON_STAGES: LeadStage[] = ["treatment_started", "completed"];
export const CLOSED_STAGES: LeadStage[] = ["completed", "not_interested", "unqualified", "lost"];

export interface StageConfig { label: string; color: Tone }

export interface CrmConfig {
  stages: Record<LeadStage, StageConfig>;
  sources: string[];
  archive_reasons: string[];
  timezone: string;
  stale_days: number;
}

const DEFAULT_STAGE_COLORS: Record<LeadStage, Tone> = {
  new: "slate", contacted: "blue", qualified: "cyan", exam_booked: "violet", exam_attended: "indigo",
  plan_presented: "amber", treatment_started: "teal", completed: "green",
  no_answer: "orange", not_interested: "slate", unqualified: "slate", lost: "red",
};

export const DEFAULT_CRM_CONFIG: CrmConfig = {
  stages: Object.fromEntries(ALL_STAGES.map((s) => [s, { label: STAGE_LABELS[s], color: DEFAULT_STAGE_COLORS[s] }])) as Record<LeadStage, StageConfig>,
  sources: SOURCE_OPTIONS,
  archive_reasons: ARCHIVE_REASON_OPTIONS,
  timezone: "Africa/Cairo",
  stale_days: 30,
};

const isTone = (v: unknown): v is Tone => typeof v === "string" && (TONES as readonly string[]).includes(v);
const cleanList = (v: unknown, fallback: string[]) => {
  if (!Array.isArray(v)) return fallback;
  const out = [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean))].slice(0, 100);
  return out.length ? out : fallback;
};
const validTz = (tz: unknown): tz is string => {
  if (typeof tz !== "string" || !tz) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
};

/** Merges whatever is stored over the defaults, dropping anything malformed. Used for reading AND for validating a save. */
export function normalizeCrmConfig(raw: unknown): CrmConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const st = (r.stages && typeof r.stages === "object" ? r.stages : {}) as Record<string, Partial<StageConfig>>;
  const stages = { ...DEFAULT_CRM_CONFIG.stages };
  for (const s of ALL_STAGES) {
    const v = st[s];
    if (!v) continue;
    stages[s] = {
      label: typeof v.label === "string" && v.label.trim() ? v.label.trim().slice(0, 40) : stages[s].label,
      color: isTone(v.color) ? v.color : stages[s].color,
    };
  }
  const stale = Number(r.stale_days);
  return {
    stages,
    sources: cleanList(r.sources, DEFAULT_CRM_CONFIG.sources),
    archive_reasons: cleanList(r.archive_reasons, DEFAULT_CRM_CONFIG.archive_reasons),
    timezone: validTz(r.timezone) ? r.timezone : DEFAULT_CRM_CONFIG.timezone,
    stale_days: Number.isFinite(stale) && stale >= 1 && stale <= 365 ? Math.round(stale) : DEFAULT_CRM_CONFIG.stale_days,
  };
}

export const stageLabel = (cfg: CrmConfig, s: string) => cfg.stages[s as LeadStage]?.label ?? s;
export const stageTone = (cfg: CrmConfig, s: string): Tone => cfg.stages[s as LeadStage]?.color ?? "slate";

export const CLASSIFICATION_TONES: Record<string, Tone> = { Hot: "red", Warm: "amber", Cold: "sky" };
export const QUALIFICATION_TONES: Record<string, Tone> = { qualified: "green", qualifies_by_call: "blue", needs_phone: "amber", invalid_phone: "red" };

// ---------------- dates in the clinic's time zone ----------------

/** "YYYY-MM-DD" for an instant, in the given zone. */
export function ymdInTz(at: Date | string, tz: string): string {
  const d = typeof at === "string" ? new Date(at) : at;
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function tzOffsetMs(at: Date, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at).map((x) => [x.type, x.value])
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - at.getTime();
}

/** The instant a calendar day starts in the given zone (so "today" means the clinic's today, not the server's UTC day). */
export function dayStart(ymd: string, tz: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - tzOffsetMs(new Date(guess), tz));
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

const fmtShort = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "short", timeZone: "UTC" });
const fmtLong = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-11-14" → "14 نوفمبر" (with the year when it isn't this year). */
export function fmtDay(ymd: string | null | undefined, today?: string): string {
  if (!ymd) return "";
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return ymd;
  return (today && ymd.slice(0, 4) === today.slice(0, 4) ? fmtShort : fmtLong).format(d);
}

export function relDay(ymd: string, today: string): string {
  const diff = daysBetween(today, ymd);
  if (diff === 0) return "النهارده";
  if (diff === -1) return "امبارح";
  if (diff === 1) return "بكرة";
  return diff < 0 ? `من ${-diff} يوم` : `بعد ${diff} يوم`;
}

export function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(new Date(iso));
}

export function fmtStamp(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(iso));
}
