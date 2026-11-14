"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search, Loader2, Inbox, ChevronRight, ChevronLeft, AlertCircle, Archive, ArchiveRestore,
  UserPlus, GitBranch, Download, X, CalendarRange, FilterX, CheckSquare, ClipboardCheck,
  SlidersHorizontal, ChevronDown, MessageCircle, MessagesSquare,
} from "lucide-react";
import type { DbLead } from "@/types/admin";
import {
  STAGE_LABELS, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS, QUALIFICATION_LABELS, STAGE_COLORS,
  SOURCE_OPTIONS, ARCHIVE_REASON_OPTIONS, LOSS_REASON_OPTIONS, DATE_PRESET_LABELS,
  followUpUrgency, datePresetRange, leadAgeDays, type DatePreset,
} from "@/lib/crm-labels";
import { sanitizeChatUrl } from "@/lib/chat-links";

const PAGE_SIZE = 25;

interface LeadsResponse { data: DbLead[]; page: number; pageSize: number; total: number }
interface TeamUser { id: string; name: string }

export interface LeadsTableProps {
  canArchive: boolean;
  canAssign: boolean;
  canExport: boolean;
  canUpdate: boolean;
  initialParams: Record<string, string>;
}

interface Filters {
  view: "active" | "archived";
  q: string;
  preset: DatePreset;
  date_from: string;
  date_to: string;
  stage: string;
  classification: string;
  qualification_status: string;
  source: string;
  assigned_to: string; // user id, "__none__" = unassigned
  overdue_followups: boolean;
  needs_review: boolean;
  sort: string;
}

const EMPTY_FILTERS: Filters = {
  view: "active", q: "", preset: "", date_from: "", date_to: "", stage: "", classification: "",
  qualification_status: "", source: "", assigned_to: "", overdue_followups: false, needs_review: false, sort: "",
};

function filtersFromParams(p: Record<string, string>): Filters {
  return {
    ...EMPTY_FILTERS,
    view: p.view === "archived" ? "archived" : "active",
    q: p.q ?? "",
    preset: (p.preset as DatePreset) ?? "",
    date_from: p.date_from ?? "",
    date_to: p.date_to ?? "",
    stage: p.stage ?? "",
    classification: p.classification ?? "",
    qualification_status: p.qualification_status ?? "",
    source: p.source ?? "",
    assigned_to: p.unassigned === "1" ? "__none__" : p.assigned_to ?? "",
    overdue_followups: p.overdue_followups === "1",
    needs_review: p.needs_review === "1",
    sort: p.sort ?? "",
  };
}

/** The filter as the API understands it — shared by list, export and "apply to all matching". */
function apiFilter(f: Filters): Record<string, string> {
  const out: Record<string, string> = { view: f.view };
  if (f.q.trim()) out.q = f.q.trim();
  if (f.date_from) out.date_from = f.date_from;
  if (f.date_to) out.date_to = f.date_to;
  for (const k of ["stage", "classification", "qualification_status", "source"] as const) if (f[k]) out[k] = f[k];
  if (f.assigned_to === "__none__") out.unassigned = "1";
  else if (f.assigned_to) out.assigned_to = f.assigned_to;
  if (f.overdue_followups) out.overdue_followups = "1";
  if (f.needs_review) out.needs_review = "1";
  return out;
}

type BulkDialog = null | "archive" | "assign" | "stage";

export default function LeadsTable({ canArchive, canAssign, canExport, canUpdate, initialParams }: LeadsTableProps) {
  const [filters, setFiltersRaw] = useState<Filters>(() => filtersFromParams(initialParams));
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [team, setTeam] = useState<TeamUser[]>([]);

  // Selection: explicit ids on screen, or "everything matching the filter".
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [dialog, setDialog] = useState<BulkDialog>(null);
  const [busy, setBusy] = useState(false);
  // The advanced panel starts open only when the URL already carries one of its filters.
  const [panelOpen, setPanelOpen] = useState(() => {
    const f = filtersFromParams(initialParams);
    return Boolean(f.stage || f.classification || f.qualification_status || f.source || f.assigned_to || f.overdue_followups || f.needs_review);
  });

  const canBulk = canArchive || canAssign || canUpdate;

  function setFilters(patch: Partial<Filters>) {
    setFiltersRaw((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
    setAllMatching(false);
  }

  function applyPreset(preset: DatePreset) {
    const { from, to } = datePresetRange(preset);
    setFilters({ preset, date_from: from, date_to: to });
  }

  useEffect(() => {
    fetch("/api/admin/crm/meta").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.assignableUsers) setTeam(d.assignableUsers);
    }).catch(() => {});
  }, []);

  // Keep the URL in sync so a filtered view can be bookmarked / shared / survives refresh.
  useEffect(() => {
    const p = new URLSearchParams(apiFilter(filters));
    if (p.get("view") === "active") p.delete("view");
    if (filters.preset) p.set("preset", filters.preset);
    if (filters.sort) p.set("sort", filters.sort);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(apiFilter(filters));
      if (filters.sort) params.set("sort", filters.sort);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/admin/crm/leads?${params.toString()}`);
      if (!res.ok) throw new Error("فشل تحميل العملاء");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const pageIds = useMemo(() => result?.data.map((l) => l.id) ?? [], [result]);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectionCount = allMatching ? result?.total ?? 0 : selected.size;
  const userName = useMemo(() => new Map(team.map((u) => [u.id, u.name])), [team]);
  const activeFilterCount = Object.entries(apiFilter(filters)).filter(([k]) => k !== "view").length;
  const panelCount = [
    filters.stage, filters.classification, filters.qualification_status, filters.source, filters.assigned_to,
    filters.overdue_followups, filters.needs_review,
  ].filter(Boolean).length;

  /** One removable chip per active filter, so what's applied is always visible at a glance. */
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string; clear: Partial<Filters> }[] = [];
    const add = (key: string, label: string, value: string, clear: Partial<Filters>) => chips.push({ key, label, value, clear });
    if (filters.q.trim()) add("q", "بحث", filters.q.trim(), { q: "" });
    if (filters.date_from || filters.date_to) {
      const value = filters.preset
        ? DATE_PRESET_LABELS[filters.preset as Exclude<DatePreset, "">]
        : `${filters.date_from || "…"} ← ${filters.date_to || "…"}`;
      add("date", "التاريخ", value, { preset: "", date_from: "", date_to: "" });
    }
    if (filters.stage) add("stage", "المرحلة", STAGE_LABELS[filters.stage as keyof typeof STAGE_LABELS] ?? filters.stage, { stage: "" });
    if (filters.classification) add("cls", "التصنيف", CLASSIFICATION_LABELS[filters.classification as keyof typeof CLASSIFICATION_LABELS] ?? filters.classification, { classification: "" });
    if (filters.qualification_status) add("qual", "التأهيل", QUALIFICATION_LABELS[filters.qualification_status as keyof typeof QUALIFICATION_LABELS] ?? filters.qualification_status, { qualification_status: "" });
    if (filters.source) add("source", "المصدر", filters.source, { source: "" });
    if (filters.assigned_to) add("assignee", "المسؤول", filters.assigned_to === "__none__" ? "بدون مسؤول" : userName.get(filters.assigned_to) ?? "…", { assigned_to: "" });
    if (filters.overdue_followups) add("overdue", "المتابعة", "متأخرة", { overdue_followups: false });
    if (filters.needs_review) add("review", "الاستيراد", "يحتاج مراجعة", { needs_review: false });
    return chips;
  }, [filters, userName]);

  function togglePage() {
    setAllMatching(false);
    setSelected((s) => {
      const n = new Set(s);
      if (pageAllSelected) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });
  }
  function toggleOne(id: string) {
    setAllMatching(false);
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function clearSelection() { setSelected(new Set()); setAllMatching(false); }

  async function runBulk(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const target = allMatching ? { filter: apiFilter(filters) } : { ids: [...selected] };
      const res = await fetch("/api/admin/crm/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, ...target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل التنفيذ");
      const verb = { archive: "اتأرشف", restore: "اترجع من الأرشيف", assign: "اتوزع", stage: "اتغيرت مرحلته" }[payload.action as string];
      setNotice(`${data.affected} عميل ${verb}`);
      setDialog(null);
      clearSelection();
      load();
      setTimeout(() => setNotice(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams(apiFilter(filters));
    window.location.href = `/api/admin/crm/leads/export?${params.toString()}`;
  }

  const isArchive = filters.view === "archived";

  return (
    <div>
      {/* View tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {([["active", "العملاء النشطين", Inbox], ["archived", "الأرشيف", Archive]] as const).map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setFilters({ view: v })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              filters.view === v ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Filters — one compact toolbar + an optional panel, with removable chips for whatever is active */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={filters.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              placeholder="ابحث بالاسم أو الهاتف أو الكود..."
              className="input h-10 py-0 pr-9"
            />
          </div>

          {/* Date range on entry date: preset + from/to in one control */}
          <div className={`flex flex-wrap sm:flex-nowrap items-center w-full sm:w-auto max-w-full min-h-10 rounded-xl border px-2 transition-colors ${
            filters.date_from || filters.date_to ? "border-blue-300 bg-blue-50/40" : "border-slate-200 bg-white"
          }`}>
            <CalendarRange className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filters.preset}
              onChange={(e) => applyPreset(e.target.value as DatePreset)}
              className="h-9 min-w-0 flex-1 sm:flex-none bg-transparent text-sm text-slate-700 pr-1.5 pl-1 focus:outline-none cursor-pointer"
              aria-label="فترة تاريخ الدخول"
            >
              <option value="">كل التواريخ</option>
              {Object.entries(DATE_PRESET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {/* Phones: from/to drop to their own line under the preset; wider screens: one row with a divider */}
            <span className="basis-full h-px bg-slate-100 sm:hidden" aria-hidden />
            <span className="hidden sm:block w-px h-5 bg-slate-200 mx-1" aria-hidden />
            <input
              type="date" value={filters.date_from} max={filters.date_to || undefined} aria-label="من تاريخ"
              onChange={(e) => setFilters({ date_from: e.target.value, preset: "" })}
              className="h-9 min-w-0 flex-1 sm:flex-none sm:w-[8.5rem] bg-transparent text-sm text-slate-700 px-1 focus:outline-none"
            />
            <span className="text-slate-400 text-xs px-0.5" aria-hidden>←</span>
            <input
              type="date" value={filters.date_to} min={filters.date_from || undefined} aria-label="إلى تاريخ"
              onChange={(e) => setFilters({ date_to: e.target.value, preset: "" })}
              className="h-9 min-w-0 flex-1 sm:flex-none sm:w-[8.5rem] bg-transparent text-sm text-slate-700 px-1 focus:outline-none"
            />
          </div>

          <select value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} className="input h-10 py-0 flex-1 sm:flex-none sm:w-auto" aria-label="الترتيب">
            <option value="">الأحدث أولاً</option>
            <option value="entry_asc">الأقدم أولاً</option>
            <option value="score_desc">الأعلى Score</option>
            <option value="followup_asc">أقرب متابعة</option>
          </select>

          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-semibold transition-colors ${
              panelOpen || panelCount > 0 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلاتر
            {panelCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px] leading-5 text-center">{panelCount}</span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${panelOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {panelOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
              <FilterSelect label="المرحلة" value={filters.stage} onChange={(v) => setFilters({ stage: v })}
                options={Object.entries(STAGE_LABELS)} />
              <FilterSelect label="التصنيف" value={filters.classification} onChange={(v) => setFilters({ classification: v })}
                options={Object.entries(CLASSIFICATION_LABELS)} />
              <FilterSelect label="التأهيل" value={filters.qualification_status} onChange={(v) => setFilters({ qualification_status: v })}
                options={Object.entries(QUALIFICATION_LABELS)} />
              <FilterSelect label="المصدر" value={filters.source} onChange={(v) => setFilters({ source: v })}
                options={SOURCE_OPTIONS.map((s) => [s, s] as [string, string])} />
              {team.length > 0 && (
                <FilterSelect label="المسؤول" value={filters.assigned_to} onChange={(v) => setFilters({ assigned_to: v })}
                  options={[["__none__", "بدون مسؤول"], ...team.map((u) => [u.id, u.name] as [string, string])]} />
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <ToggleChip on={filters.overdue_followups} onClick={() => setFilters({ overdue_followups: !filters.overdue_followups })} icon={AlertCircle} color="amber">
                متابعات متأخرة
              </ToggleChip>
              <ToggleChip on={filters.needs_review} onClick={() => setFilters({ needs_review: !filters.needs_review })} icon={ClipboardCheck} color="purple">
                يحتاج مراجعة
              </ToggleChip>
            </div>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {activeChips.map((c) => (
              <span key={c.key} className="inline-flex items-center gap-1 h-7 pr-2.5 pl-1 rounded-full bg-slate-100 text-xs text-slate-700">
                <span className="text-slate-400">{c.label}:</span> {c.value}
                <button onClick={() => setFilters(c.clear)} className="p-0.5 rounded-full hover:bg-slate-200 text-slate-500" aria-label={`إزالة فلتر ${c.label}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <button onClick={() => setFilters({ ...EMPTY_FILTERS, view: filters.view })} className="flex items-center gap-1 h-7 px-2 text-xs text-slate-500 hover:text-red-600">
              <FilterX className="w-3.5 h-3.5" /> مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* Result bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
        <span className="text-slate-500">
          {result ? <><b className="text-slate-800">{result.total}</b> عميل {isArchive ? "في الأرشيف" : "نشط"}{activeFilterCount ? " مطابق للفلتر" : ""}</> : "…"}
        </span>
        {canExport && result && result.total > 0 && (
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-gray-50">
            <Download className="w-4 h-4" /> تصدير ({result.total}) CSV
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}
      {notice && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">{notice}</p>}

      {/* Bulk action bar */}
      {canBulk && selectionCount > 0 && (
        <div className="sticky top-2 z-20 bg-slate-800 text-white rounded-2xl px-4 py-3 mb-3 flex flex-wrap items-center gap-2 shadow-lg">
          <CheckSquare className="w-4 h-4" />
          <span className="text-sm font-semibold">تم تحديد {selectionCount}</span>
          {!allMatching && pageAllSelected && result && result.total > pageIds.length && (
            <button onClick={() => setAllMatching(true)} className="text-xs underline text-sky-300 hover:text-sky-200">
              حدد كل الـ {result.total} المطابقين للفلتر
            </button>
          )}
          {allMatching && <span className="text-xs text-sky-300">(كل العملاء المطابقين للفلتر)</span>}
          <div className="flex flex-wrap gap-2 mr-auto">
            {canArchive && !isArchive && (
              <BarButton icon={Archive} onClick={() => setDialog("archive")}>أرشفة</BarButton>
            )}
            {canArchive && isArchive && (
              <BarButton icon={ArchiveRestore} onClick={() => runBulk({ action: "restore" })} disabled={busy}>استرجاع للنشط</BarButton>
            )}
            {canAssign && !isArchive && (
              <BarButton icon={UserPlus} onClick={() => setDialog("assign")}>توزيع</BarButton>
            )}
            {canUpdate && !isArchive && (
              <BarButton icon={GitBranch} onClick={() => setDialog("stage")}>تغيير المرحلة</BarButton>
            )}
            <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-slate-700" aria-label="إلغاء التحديد"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && !result ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !result || result.data.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            {isArchive ? <Archive className="w-12 h-12 mx-auto mb-3 text-slate-200" /> : <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-200" />}
            <p>{isArchive ? "الأرشيف فاضي." : "لا يوجد عملاء محتملون مطابقون."}</p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {canBulk && (
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox" checked={pageAllSelected} onChange={togglePage} aria-label="تحديد الصفحة" className="w-4 h-4 accent-blue-600" />
                    </th>
                  )}
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">الاسم</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">الهاتف</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">تاريخ الدخول</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">الخدمة</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">التصنيف</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">المرحلة</th>
                  {team.length > 0 && <th className="text-right px-3 py-3 font-semibold text-slate-600">المسؤول</th>}
                  <th className="text-right px-3 py-3 font-semibold text-slate-600">{isArchive ? "الأرشفة" : "المتابعة القادمة"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map((lead) => {
                  const urgency = followUpUrgency(lead.next_follow_up_at);
                  const age = leadAgeDays(lead.entry_date);
                  const checked = allMatching || selected.has(lead.id);
                  return (
                    <tr key={lead.id} className={`transition-colors ${checked ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                      {canBulk && (
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={checked} onChange={() => toggleOne(lead.id)} aria-label={`تحديد ${lead.name}`} className="w-4 h-4 accent-blue-600" />
                        </td>
                      )}
                      <td className="px-3 py-3">
                        <Link href={`/admin/crm/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {lead.name}
                        </Link>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          {lead.lead_code}
                          {lead.needs_review && <span className="text-purple-600" title={lead.review_notes ?? ""}>· مراجعة</span>}
                          <ChatIcon url={lead.whatsapp_chat_url} label="شات الواتساب" icon={MessageCircle} className="text-green-600 hover:bg-green-50" />
                          <ChatIcon url={lead.meta_chat_url} label="الشات على Meta" icon={MessagesSquare} className="text-indigo-600 hover:bg-indigo-50" />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap" dir="ltr">{lead.mobile_raw || "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-slate-600 text-xs">{new Date(lead.entry_date + "T00:00:00").toLocaleDateString("ar-EG")}</div>
                        <div className={`text-[11px] ${age > 60 ? "text-red-500" : age > 30 ? "text-amber-600" : "text-slate-400"}`}>
                          {age === 0 ? "النهارده" : `من ${age} يوم`}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{lead.service_interest || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CLASSIFICATION_COLORS[lead.classification]}`}>
                          {CLASSIFICATION_LABELS[lead.classification]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>
                          {STAGE_LABELS[lead.stage]}
                        </span>
                      </td>
                      {team.length > 0 && (
                        <td className="px-3 py-3 text-xs text-slate-500">
                          {lead.assigned_to ? userName.get(lead.assigned_to) ?? "—" : <span className="text-slate-300">بدون</span>}
                        </td>
                      )}
                      <td className="px-3 py-3">
                        {isArchive ? (
                          <div className="text-xs">
                            <div className="text-slate-600">{lead.archive_reason ?? "—"}</div>
                            {lead.archived_at && <div className="text-slate-400">{new Date(lead.archived_at).toLocaleDateString("ar-EG")}</div>}
                          </div>
                        ) : lead.next_follow_up_at ? (
                          <span className={
                            urgency === "overdue" ? "text-red-600 font-semibold text-xs" :
                            urgency === "today" ? "text-amber-600 font-semibold text-xs" : "text-slate-500 text-xs"
                          }>
                            {new Date(lead.next_follow_up_at).toLocaleDateString("ar-EG")}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {result && result.total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>صفحة {page} من {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50" aria-label="الصفحة السابقة">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50" aria-label="الصفحة التالية">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {dialog === "archive" && (
        <ArchiveDialog count={selectionCount} busy={busy} onClose={() => setDialog(null)}
          onConfirm={(reason, other) => runBulk({ action: "archive", reason, reason_other: other })} />
      )}
      {dialog === "assign" && (
        <AssignDialog count={selectionCount} team={team} busy={busy} onClose={() => setDialog(null)}
          onConfirm={(assignees) => runBulk({ action: "assign", assignees })} />
      )}
      {dialog === "stage" && (
        <StageDialog count={selectionCount} busy={busy} onClose={() => setDialog(null)}
          onConfirm={(stage, loss_reason, loss_reason_other) => runBulk({ action: "stage", stage, loss_reason, loss_reason_other })} />
      )}
    </div>
  );
}

// ---------- small pieces ----------

/** One-click jump to an existing conversation, straight from the list (opens in a new tab). */
function ChatIcon({ url, label, icon: Icon, className }: { url?: string | null; label: string; icon: React.ElementType; className: string }) {
  const href = sanitizeChatUrl(url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label}
      className={`inline-flex p-0.5 rounded ${className}`}>
      <Icon className="w-3.5 h-3.5" />
    </a>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`input h-9 py-0 min-w-0 text-[13px] ${value ? "border-blue-300 bg-blue-50/40 text-blue-800 font-medium" : "text-slate-600"}`}
    >
      <option value="">{label}: الكل</option>
      {options.map(([k, v]) => <option key={k} value={k}>{label}: {v}</option>)}
    </select>
  );
}

function ToggleChip({ on, onClick, icon: Icon, color, children }: {
  on: boolean; onClick: () => void; icon: React.ElementType; color: "amber" | "purple"; children: React.ReactNode;
}) {
  const onCls = color === "amber" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700";
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-colors ${on ? onCls : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}

function BarButton({ icon: Icon, onClick, disabled, children }: { icon: React.ElementType; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-xs font-semibold">
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ArchiveDialog({ count, busy, onClose, onConfirm }: { count: number; busy: boolean; onClose: () => void; onConfirm: (reason: string, other: string) => void }) {
  const [reason, setReason] = useState(ARCHIVE_REASON_OPTIONS[0]);
  const [other, setOther] = useState("");
  return (
    <Dialog title={`أرشفة ${count} عميل`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-4">
        العملاء هيختفوا من القائمة النشطة والإحصائيات، لكن بياناتهم كلها محفوظة وتقدر ترجعهم في أي وقت من تبويب &quot;الأرشيف&quot;.
        ولو حد منهم رجع ملا فورم تاني، الاستيراد هيكتشفه.
      </p>
      <label className="block text-sm font-semibold text-slate-600 mb-1.5">سبب الأرشفة</label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input mb-3">
        {ARCHIVE_REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {reason === "أخرى" && <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="اكتب السبب" className="input mb-3" />}
      <div className="flex gap-2 justify-end mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-gray-100">إلغاء</button>
        <button onClick={() => onConfirm(reason, other)} disabled={busy || (reason === "أخرى" && !other.trim())}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} أرشفة
        </button>
      </div>
    </Dialog>
  );
}

function AssignDialog({ count, team, busy, onClose, onConfirm }: { count: number; team: TeamUser[]; busy: boolean; onClose: () => void; onConfirm: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <Dialog title={`توزيع ${count} عميل`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-3">اختار موظف واحد أو أكتر — لو أكتر من واحد، العملاء هيتوزعوا عليهم بالتساوي (بالدور).</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {team.map((u) => {
          const on = picked.includes(u.id);
          return (
            <button key={u.id} type="button" onClick={() => setPicked((p) => (on ? p.filter((x) => x !== u.id) : [...p, u.id]))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-gray-200 hover:border-blue-300"}`}>
              {u.name}
            </button>
          );
        })}
      </div>
      {picked.length > 1 && <p className="text-xs text-blue-600 mb-2">≈ {Math.ceil(count / picked.length)} عميل لكل موظف</p>}
      <div className="flex gap-2 justify-end mt-2">
        <button onClick={() => onConfirm([])} disabled={busy} className="px-4 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 ml-auto">إلغاء الإسناد</button>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-gray-100">إلغاء</button>
        <button onClick={() => onConfirm(picked)} disabled={busy || picked.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} توزيع
        </button>
      </div>
    </Dialog>
  );
}

function StageDialog({ count, busy, onClose, onConfirm }: {
  count: number; busy: boolean; onClose: () => void; onConfirm: (stage: string, lossReason?: string, lossOther?: string) => void;
}) {
  const [stage, setStage] = useState("contacted");
  const [loss, setLoss] = useState("");
  const [lossOther, setLossOther] = useState("");
  const invalid = stage === "lost" && (!loss || (loss === "أخرى" && !lossOther.trim()));
  return (
    <Dialog title={`تغيير مرحلة ${count} عميل`} onClose={onClose}>
      <select value={stage} onChange={(e) => setStage(e.target.value)} className="input mb-3">
        {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {stage === "lost" && (
        <>
          <select value={loss} onChange={(e) => setLoss(e.target.value)} className="input mb-3">
            <option value="">— سبب الخسارة —</option>
            {LOSS_REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {loss === "أخرى" && <input value={lossOther} onChange={(e) => setLossOther(e.target.value)} placeholder="توضيح" className="input mb-3" />}
        </>
      )}
      <p className="text-xs text-slate-400 mb-3">كل تغيير بيتسجل في سجل مراحل العميل.</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-gray-100">إلغاء</button>
        <button onClick={() => onConfirm(stage, loss || undefined, lossOther || undefined)} disabled={busy || invalid}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} تطبيق
        </button>
      </div>
    </Dialog>
  );
}
