"use client";

import { useRef, useState } from "react";
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download,
} from "lucide-react";
import { rowsToCsv } from "@/lib/csv-export";

interface PreviewRow {
  rowNumber: number;
  legacy_id: string | null;
  name: string;
  mobile_raw: string | null;
  classification: "Hot" | "Warm" | "Cold";
  lead_score: number;
  isDuplicate: boolean;
  needs_review: boolean;
  review_notes: string[];
}

interface PreviewSummary {
  totalDataRows: number;
  skippedBlankRows: number;
  newCount: number;
  duplicateCount: number;
  reviewCount: number;
}

interface ExecuteSummary {
  totalDataRows: number;
  insertedCount: number;
  duplicateCount: number;
  reviewCount: number;
  errorCount: number;
}

interface ExecuteResultRow {
  rowNumber: number;
  legacy_id: string | null;
  name: string;
  outcome: string;
  notes: string;
}

export default function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ summary: PreviewSummary; rows: PreviewRow[] } | null>(null);
  const [report, setReport] = useState<{ summary: ExecuteSummary; results: ExecuteResultRow[] } | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!file) return;
    setAnalyzing(true);
    setError("");
    setPreview(null);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/crm/import/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تحليل الملف");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setImporting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
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

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">استيراد عملاء من إكسل</h1>
      <p className="text-slate-500 mb-6">ارفع ملف Wave_Dental_CRM.xlsx — هيتم تحليله وعرض ملخص قبل أي تنفيذ فعلي، والاستيراد آمن لإعادة التشغيل (لن يكرر نفس العملاء).</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setReport(null); setError(""); }}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-semibold"
          >
            <Upload className="w-4 h-4" /> اختر ملف إكسل
          </button>
          {file && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> {file.name}
            </span>
          )}
        </div>

        {file && !preview && !report && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
          >
            {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
            تحليل الملف
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">{error}</p>}

      {/* Preview step */}
      {preview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="إجمالي الصفوف" value={preview.summary.totalDataRows} />
            <StatCard label="صفوف فاضية (معادلات)" value={preview.summary.skippedBlankRows} muted />
            <StatCard label="عملاء جدد" value={preview.summary.newCount} color="text-green-600" />
            <StatCard label="مكررين" value={preview.summary.duplicateCount} color="text-amber-600" />
            <StatCard label="يحتاجون مراجعة" value={preview.summary.reviewCount} color="text-purple-600" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-slate-600">
              معاينة أول {Math.min(20, preview.rows.length)} صف
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">الكود</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">الاسم</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">الهاتف</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">التصنيف</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.rows.slice(0, 20).map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="px-4 py-2 text-slate-500">{r.legacy_id}</td>
                      <td className="px-4 py-2 font-medium text-slate-800">{r.name}</td>
                      <td className="px-4 py-2 text-slate-500" dir="ltr">{r.mobile_raw || "—"}</td>
                      <td className="px-4 py-2 text-slate-500">{r.classification} ({r.lead_score})</td>
                      <td className="px-4 py-2">
                        {r.isDuplicate ? (
                          <span className="text-amber-600 text-xs font-medium">مكرر — سيتم تجاهله</span>
                        ) : r.needs_review ? (
                          <span className="text-purple-600 text-xs font-medium" title={r.review_notes.join(" · ")}>يحتاج مراجعة</span>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">جاهز</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-xl text-sm"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              تأكيد الاستيراد ({preview.summary.newCount} عميل جديد)
            </button>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              العملاء المكررين هيتم تجاهلهم تلقائيًا — لن يتم استبدال أي تعديل سابق
            </p>
          </div>
        </div>
      )}

      {/* Final report */}
      {report && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">تم الاستيراد بنجاح</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="تم استيرادهم" value={report.summary.insertedCount} color="text-green-600" />
            <StatCard label="مكررين (تم تجاهلهم)" value={report.summary.duplicateCount} muted />
            <StatCard label="يحتاجون مراجعة" value={report.summary.reviewCount} color="text-purple-600" />
            <StatCard label="أخطاء" value={report.summary.errorCount} color={report.summary.errorCount > 0 ? "text-red-600" : undefined} />
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm"
          >
            <Download className="w-4 h-4" /> تحميل تقرير الاستيراد (CSV)
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, muted }: { label: string; value: number; color?: string; muted?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-black ${muted ? "text-slate-400" : color ?? "text-slate-800"}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}
