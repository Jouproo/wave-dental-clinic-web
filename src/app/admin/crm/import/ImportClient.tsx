"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download, RefreshCw,
  Columns3, Settings2, Eye, X,
} from "lucide-react";
import { rowsToCsv } from "@/lib/csv-export";
import { CLASSIFICATION_COLORS } from "@/lib/crm-labels";
import { stageLabel } from "@/lib/crm-config";
import { useCrmConfig } from "../components/CrmConfigProvider";
import type { LeadStage } from "@/types/admin";

type ImportField = string;

interface ColumnInfo { index: number; header: string; samples: string[]; field: ImportField; detectedBy?: "header" | "content" }

interface PreviewRow {
  rowNumber: number;
  legacy_id: string | null;
  entry_date: string | null;
  name: string;
  mobile_raw: string | null;
  mobile_valid: boolean;
  source: string | null;
  service_interest: string | null;
  classification: "Hot" | "Warm" | "Cold";
  lead_score: number;
  stage: LeadStage;
  needs_review: boolean;
  review_notes: string[];
  status: "new" | "duplicate" | "duplicate_in_file";
  duplicateOfRow: number | null;
  existing: { lead_code: string; name: string; archived: boolean; matchedBy: "legacy_id" | "phone" } | null;
}

interface PreviewSummary {
  totalDataRows: number;
  skippedBlankRows: number;
  skippedNoContact: number;
  newCount: number;
  duplicateCount: number;
  archivedDuplicateCount: number;
  duplicateInFileCount: number;
  reviewCount: number;
  invalidPhoneCount: number;
  dateFrom: string | null;
  dateTo: string | null;
}

interface PreviewResponse {
  sheetName: string;
  sheetNames: string[];
  headerRowIndex: number;
  columns: ColumnInfo[];
  fieldLabels: Record<string, string>;
  unmappedRequired: string[];
  summary: PreviewSummary;
  rows: PreviewRow[];
  previewTruncated: boolean;
}

interface ExecuteSummary {
  totalDataRows: number;
  insertedCount: number;
  mergedCount: number;
  duplicateCount: number;
  reviewCount: number;
  errorCount: number;
}

interface ExecuteResultRow { rowNumber: number; legacy_id: string | null; name: string; outcome: string; notes: string }
interface TeamUser { id: string; name: string; email: string; role: string }

type RowFilter = "all" | "new" | "duplicate" | "review";

export default function ImportClient() {
  const cfg = useCrmConfig();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [report, setReport] = useState<{ summary: ExecuteSummary; results: ExecuteResultRow[] } | null>(null);
  const [error, setError] = useState("");

  // Options
  const [sheetName, setSheetName] = useState<string | undefined>();
  const [mapping, setMapping] = useState<Record<number, ImportField> | null>(null);
  const [mappingDirty, setMappingDirty] = useState(false);
  const [unmappedToNotes, setUnmappedToNotes] = useState(true);
  const [defaultSource, setDefaultSource] = useState("");
  const [campaign, setCampaign] = useState("");
  const [duplicatePolicy, setDuplicatePolicy] = useState<"skip" | "merge">("skip");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");

  useEffect(() => {
    fetch("/api/admin/crm/meta").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.assignableUsers) setTeam(d.assignableUsers);
    }).catch(() => {});
  }, []);

  function pickFile(f: File | null) {
    if (f && !/\.(xlsx|xls|csv)$/i.test(f.name)) { setError("الملف لازم يكون Excel (xlsx / xls) أو CSV"); return; }
    setFile(f);
    setPreview(null);
    setReport(null);
    setError("");
    setSheetName(undefined);
    setMapping(null);
    setMappingDirty(false);
  }

  function buildOptions(overrides?: { sheetName?: string; mapping?: Record<number, ImportField> | null }) {
    const sheet = overrides && "sheetName" in overrides ? overrides.sheetName : sheetName;
    const map = overrides && "mapping" in overrides ? overrides.mapping : mapping;
    return JSON.stringify({
      sheetName: sheet,
      mapping: map ?? undefined,
      unmappedToNotes,
      defaultSource: defaultSource || undefined,
      campaign: campaign || undefined,
      duplicatePolicy,
      assignees,
    });
  }

  async function analyze(overrides?: { sheetName?: string; mapping?: Record<number, ImportField> | null }) {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setReport(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("options", buildOptions(overrides));
      const res = await fetch("/api/admin/crm/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تحليل الملف");
      setPreview(data);
      setSheetName(data.sheetName);
      setMapping(Object.fromEntries((data.columns as ColumnInfo[]).map((c) => [c.index, c.field])));
      setMappingDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm() {
    if (!file || !preview) return;
    setImporting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("options", buildOptions());
      const res = await fetch("/api/admin/crm/import/execute", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تنفيذ الاستيراد");
      setReport(data);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setImporting(false);
    }
  }

  function setColumnField(index: number, field: ImportField) {
    setMapping((m) => ({ ...(m ?? {}), [index]: field }));
    setMappingDirty(true);
  }

  function downloadReport() {
    if (!report) return;
    const headers = ["الصف", "الكود القديم", "الاسم", "النتيجة", "ملاحظات"];
    const csv = rowsToCsv(headers, report.results.map((r) => [r.rowNumber, r.legacy_id, r.name, r.outcome, r.notes]));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const mappedCount = mapping ? Object.values(mapping).filter((f) => f !== "skip").length : 0;
  const usedFields = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of Object.values(mapping ?? {})) if (f !== "skip") counts[f] = (counts[f] ?? 0) + 1;
    return counts;
  }, [mapping]);

  const visibleRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.filter((r) =>
      rowFilter === "all" ? true :
      rowFilter === "new" ? r.status === "new" :
      rowFilter === "duplicate" ? r.status !== "new" :
      r.needs_review
    );
  }, [preview, rowFilter]);

  const importableCount = preview
    ? preview.summary.newCount + (duplicatePolicy === "merge" ? preview.summary.duplicateCount : 0)
    : 0;

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">استيراد عملاء من إكسل</h1>
      <p className="text-slate-500 mb-6 text-sm leading-relaxed">
        ارفع أي ملف Excel أو CSV فيه عملاء: شيت Wave CRM، أو تصدير Leads من فيسبوك/إنستجرام، أو أي شيت معمول يدوي.
        النظام بيتعرّف على الأعمدة لوحده، وتقدر تعدّل الربط قبل التنفيذ. مفيش أي حاجة بتتحفظ قبل ما تأكد.
      </p>

      {/* Step 1 — file */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
        className={`bg-white rounded-2xl border-2 border-dashed p-6 mb-6 transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { pickFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
          className="hidden"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-semibold"
          >
            <Upload className="w-4 h-4" /> اختر ملف
          </button>
          {file ? (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> {file.name}
              <span className="text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => pickFile(null)} className="p-1 text-slate-400 hover:text-red-500" aria-label="إزالة الملف"><X className="w-4 h-4" /></button>
            </span>
          ) : (
            <span className="text-sm text-slate-400">أو اسحب الملف هنا — xlsx / xls / csv</span>
          )}
        </div>

        {file && !preview && !report && (
          <button
            onClick={() => analyze()}
            disabled={analyzing}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
          >
            {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
            تحليل الملف
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{error}</p>}

      {preview && (
        <div className="space-y-6">
          {/* Step 2 — mapping */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Columns3 className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800">ربط الأعمدة</h2>
                <span className="text-xs text-slate-400">{mappedCount} عمود مربوط من {preview.columns.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {preview.sheetNames.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="text-slate-500">الورقة:</span>
                    <select
                      value={sheetName}
                      onChange={(e) => { setSheetName(e.target.value); setMapping(null); analyze({ sheetName: e.target.value, mapping: null }); }}
                      className="input w-auto py-1.5"
                    >
                      {preview.sheetNames.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
                <span className="text-xs text-slate-400">صف العناوين: {preview.headerRowIndex + 1}</span>
              </div>
            </header>

            {preview.unmappedRequired.length > 0 && (
              <p className="m-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {preview.unmappedRequired.join(" · ")}
              </p>
            )}

            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">العمود في الملف</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">أمثلة من البيانات</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600 w-56">يتسجل في</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.columns.map((c) => {
                    const field = mapping?.[c.index] ?? "skip";
                    const clash = field !== "skip" && field !== "notes" && (usedFields[field] ?? 0) > 1;
                    return (
                      <tr key={c.index} className={field === "skip" ? "bg-gray-50/50" : ""}>
                        <td className="px-4 py-2 font-medium text-slate-700">{c.header}</td>
                        <td className="px-4 py-2 text-xs text-slate-500 max-w-[320px]">
                          {c.samples.length ? c.samples.join(" · ") : <span className="text-slate-300">فاضي</span>}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={field}
                            onChange={(e) => setColumnField(c.index, e.target.value)}
                            className={`input py-1.5 text-sm ${field === "skip" ? "text-slate-400" : "text-slate-800 font-medium"} ${clash ? "border-amber-400" : ""}`}
                          >
                            {Object.entries(preview.fieldLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                          {c.detectedBy === "content" && field === c.field && (
                            <p className="text-[11px] text-blue-600 mt-0.5">✨ اتعرف عليه من البيانات اللي جوه العمود</p>
                          )}
                          {clash && <p className="text-[11px] text-amber-600 mt-0.5">الحقل ده مربوط بأكتر من عمود — هيتاخد أول قيمة مش فاضية</p>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {mappingDirty && (
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50 flex items-center justify-between gap-3">
                <span className="text-sm text-amber-700">غيّرت الربط — حدّث المعاينة عشان تشوف النتيجة.</span>
                <button onClick={() => analyze()} disabled={analyzing} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} تحديث المعاينة
                </button>
              </div>
            )}
          </section>

          {/* Step 3 — options */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">إعدادات الاستيراد</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">العملاء المكررين (موجودين بالفعل بنفس الرقم أو الكود)</label>
                <div className="space-y-1.5">
                  <label className="flex items-start gap-2">
                    <input type="radio" checked={duplicatePolicy === "skip"} onChange={() => setDuplicatePolicy("skip")} className="mt-1" />
                    <span>تجاهلهم <span className="text-slate-400">— الأكثر أمانًا</span></span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="radio" checked={duplicatePolicy === "merge"} onChange={() => setDuplicatePolicy("merge")} className="mt-1" />
                    <span>دمج: املا الخانات الفاضية بس + سجّل إنه رجع تاني، ولو في الأرشيف يرجع للقائمة النشطة <span className="text-slate-400">— مفيد لو نفس الشخص ملا الفورم تاني</span></span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">توزيع العملاء الجداد على</label>
                {team.length === 0 ? (
                  <p className="text-slate-400 text-xs">مفيش موظفين متاحين للتوزيع — هيتسجلوا بدون مسؤول.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {team.map((u) => {
                      const on = assignees.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setAssignees((a) => (on ? a.filter((x) => x !== u.id) : [...a, u.id]))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${on ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-gray-200 hover:border-blue-300"}`}
                        >
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {assignees.length > 1 ? `بالتساوي (بالدور) على ${assignees.length} موظفين.` : assignees.length === 1 ? "كلهم للموظف ده." : "بدون اختيار = بدون مسؤول (أو حسب عمود \"المسؤول\" لو موجود في الملف)."}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">المصدر الافتراضي (للصفوف اللي مفيهاش مصدر)</label>
                <input list="source-options" value={defaultSource} onChange={(e) => setDefaultSource(e.target.value)} placeholder="مثلاً: فيسبوك" className="input" />
                <datalist id="source-options">{cfg.sources.map((s) => <option key={s} value={s} />)}</datalist>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">اسم الحملة (لو مش موجود في الملف)</label>
                <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="مثلاً: زراعة نوفمبر 2026" className="input" />
              </div>

              <label className="flex items-start gap-2 sm:col-span-2">
                <input type="checkbox" checked={unmappedToNotes} onChange={(e) => setUnmappedToNotes(e.target.checked)} className="mt-1" />
                <span>
                  احفظ الأعمدة غير المربوطة في &quot;ملاحظات&quot; العميل
                  <span className="text-slate-400"> — عشان مفيش أي معلومة من الملف تضيع (مثلاً المدينة أو اسم الإعلان)</span>
                </span>
              </label>
            </div>
            {(defaultSource || campaign || unmappedToNotes !== true) && (
              <button onClick={() => analyze()} disabled={analyzing} className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> طبّق على المعاينة
              </button>
            )}
          </section>

          {/* Step 4 — summary + preview */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="عملاء في الملف" value={preview.summary.totalDataRows} />
              <StatCard label="جداد" value={preview.summary.newCount} color="text-green-600" />
              <StatCard label="موجودين بالفعل" value={preview.summary.duplicateCount} color="text-amber-600"
                hint={preview.summary.archivedDuplicateCount ? `${preview.summary.archivedDuplicateCount} منهم في الأرشيف` : undefined} />
              <StatCard label="مكرر داخل الملف" value={preview.summary.duplicateInFileCount} color="text-amber-600" />
              <StatCard label="يحتاجون مراجعة" value={preview.summary.reviewCount} color="text-purple-600" />
              <StatCard label="صفوف متجاهلة" value={preview.summary.skippedBlankRows + preview.summary.skippedNoContact} muted
                hint={preview.summary.skippedNoContact ? `${preview.summary.skippedNoContact} بدون اسم أو رقم` : "صفوف فاضية"} />
            </div>
            {preview.summary.dateFrom && (
              <p className="text-xs text-slate-500">
                تواريخ العملاء في الملف: من <b dir="ltr">{preview.summary.dateFrom}</b> إلى <b dir="ltr">{preview.summary.dateTo}</b>
                {preview.summary.invalidPhoneCount > 0 && <> · <span className="text-red-600">{preview.summary.invalidPhoneCount} رقم غير صالح</span></>}
              </p>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100">
                <Eye className="w-4 h-4 text-slate-400" />
                {([
                  ["all", "الكل"], ["new", "الجداد"], ["duplicate", "المكررين"], ["review", "يحتاجون مراجعة"],
                ] as [RowFilter, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setRowFilter(k)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${rowFilter === k ? "bg-slate-800 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"}`}
                  >
                    {label}
                  </button>
                ))}
                {preview.previewTruncated && <span className="text-xs text-slate-400 mr-auto">المعاينة بتعرض أول {preview.rows.length} صف — الاستيراد هيشمل الكل</span>}
              </div>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">صف</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">التاريخ</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">الاسم</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">الهاتف</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">المصدر</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">الخدمة</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">التصنيف</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visibleRows.map((r) => (
                      <tr key={r.rowNumber} className={r.status !== "new" ? "bg-amber-50/40" : ""}>
                        <td className="px-3 py-2 text-slate-400 text-xs">{r.rowNumber}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap" dir="ltr">{r.entry_date ?? "—"}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.name}
                          {r.stage !== "new" && <span className="block text-[11px] text-slate-400">{stageLabel(cfg, r.stage)}</span>}
                        </td>
                        <td className={`px-3 py-2 text-xs ${r.mobile_valid ? "text-slate-600" : "text-red-500"}`} dir="ltr">{r.mobile_raw || "—"}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{r.source ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{r.service_interest ?? "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${CLASSIFICATION_COLORS[r.classification]}`}>{r.classification} · {r.lead_score}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {r.status === "duplicate" && r.existing ? (
                            <span className="text-amber-700 font-medium">
                              موجود: {r.existing.lead_code}
                              <span className="block text-[11px] text-amber-600 font-normal">
                                {r.existing.matchedBy === "phone" ? "نفس الرقم" : "نفس الكود"}{r.existing.archived ? " · في الأرشيف" : ""}
                                {" · "}{duplicatePolicy === "merge" ? "هيتدمج" : "هيتجاهل"}
                              </span>
                            </span>
                          ) : r.status === "duplicate_in_file" ? (
                            <span className="text-amber-700 font-medium">مكرر مع صف {r.duplicateOfRow}</span>
                          ) : (
                            <span className="text-green-600 font-medium">جديد</span>
                          )}
                          {r.needs_review && (
                            <ul className="mt-0.5 text-[11px] text-purple-600 list-disc pr-4">
                              {r.review_notes.map((n, i) => <li key={i}>{n}</li>)}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                    {visibleRows.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">لا يوجد صفوف</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 sticky bottom-0 bg-gray-50/90 backdrop-blur py-3">
            <button
              onClick={handleConfirm}
              disabled={importing || mappingDirty || preview.unmappedRequired.length > 0 || importableCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              تأكيد الاستيراد ({preview.summary.newCount} جديد{duplicatePolicy === "merge" && preview.summary.duplicateCount ? ` + دمج ${preview.summary.duplicateCount}` : ""})
            </button>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {mappingDirty ? "حدّث المعاينة الأول بعد تعديل الربط" : "الـ Score والتصنيف بيتحسبوا من جديد حسب إعدادات النظام — مش من الشيت"}
            </p>
          </div>
        </div>
      )}

      {/* Final report */}
      {report && (
        <div className="space-y-6">
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${report.summary.errorCount ? "text-amber-700 bg-amber-50 border-amber-200" : "text-green-700 bg-green-50 border-green-200"}`}>
            {report.summary.errorCount ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-semibold text-sm">
              {report.summary.errorCount ? `تم الاستيراد مع ${report.summary.errorCount} خطأ — راجع التقرير` : "تم الاستيراد بنجاح"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="اتضافوا" value={report.summary.insertedCount} color="text-green-600" />
            <StatCard label="اتدمجوا مع موجودين" value={report.summary.mergedCount} color="text-blue-600" />
            <StatCard label="مكررين" value={report.summary.duplicateCount} muted />
            <StatCard label="يحتاجون مراجعة" value={report.summary.reviewCount} color="text-purple-600" />
            <StatCard label="أخطاء" value={report.summary.errorCount} color={report.summary.errorCount > 0 ? "text-red-600" : undefined} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm">
              <Download className="w-4 h-4" /> تحميل تقرير الاستيراد (CSV)
            </button>
            {report.summary.reviewCount > 0 && (
              <Link href="/admin/crm/leads?needs_review=1" className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-xl text-sm">
                راجع العملاء اللي محتاجين مراجعة
              </Link>
            )}
            <Link href="/admin/crm/leads" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm">
              روح لقائمة العملاء
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, muted, hint }: { label: string; value: number; color?: string; muted?: boolean; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-black ${muted ? "text-slate-400" : color ?? "text-slate-800"}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}
