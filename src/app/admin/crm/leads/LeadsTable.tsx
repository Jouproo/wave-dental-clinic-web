"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, Inbox, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import type { DbLead } from "@/types/admin";
import {
  STAGE_LABELS, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS,
  QUALIFICATION_LABELS, STAGE_COLORS, followUpUrgency,
} from "@/lib/crm-labels";

const PAGE_SIZE = 25;

interface LeadsResponse {
  data: DbLead[];
  page: number;
  pageSize: number;
  total: number;
}

export default function LeadsTable() {
  const [search, setSearchRaw] = useState("");
  const [stage, setStageRaw] = useState("");
  const [classification, setClassificationRaw] = useState("");
  const [qualification, setQualificationRaw] = useState("");
  const [overdueOnly, setOverdueOnlyRaw] = useState(false);
  const [page, setPage] = useState(1);

  // Any filter change restarts pagination at page 1 — done inline in each
  // setter (not a separate effect watching all of them) so there's one
  // user action triggers its state updates directly, not a cascading extra render.
  function setSearch(v: string) { setSearchRaw(v); setPage(1); }
  function setStage(v: string) { setStageRaw(v); setPage(1); }
  function setClassification(v: string) { setClassificationRaw(v); setPage(1); }
  function setQualification(v: string) { setQualificationRaw(v); setPage(1); }
  function toggleOverdueOnly() { setOverdueOnlyRaw((prev) => !prev); setPage(1); }

  const [result, setResult] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (stage) params.set("stage", stage);
      if (classification) params.set("classification", classification);
      if (qualification) params.set("qualification_status", qualification);
      if (overdueOnly) params.set("overdue_followups", "1");
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
  }, [search, stage, classification, qualification, overdueOnly, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو الكود..."
            className="input pr-9"
          />
        </div>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="input w-auto min-w-[140px]">
          <option value="">كل المراحل</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={classification} onChange={(e) => setClassification(e.target.value)} className="input w-auto min-w-[120px]">
          <option value="">كل التصنيفات</option>
          {Object.entries(CLASSIFICATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={qualification} onChange={(e) => setQualification(e.target.value)} className="input w-auto min-w-[160px]">
          <option value="">كل حالات التأهيل</option>
          {Object.entries(QUALIFICATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button
          onClick={toggleOverdueOnly}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            overdueOnly ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          متابعات متأخرة
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !result || result.data.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p>لا يوجد عملاء محتملون مطابقون.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الهاتف</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">الخدمة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">التصنيف</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">التأهيل</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">المرحلة</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">المتابعة القادمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map((lead) => {
                  const urgency = followUpUrgency(lead.next_follow_up_at);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/crm/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-blue-600">
                          {lead.name}
                        </Link>
                        <div className="text-xs text-slate-400">{lead.lead_code}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500" dir="ltr">{lead.mobile_raw || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{lead.service_interest || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CLASSIFICATION_COLORS[lead.classification]}`}>
                          {CLASSIFICATION_LABELS[lead.classification]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{QUALIFICATION_LABELS[lead.qualification_status]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[lead.stage]}`}>
                          {STAGE_LABELS[lead.stage]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lead.next_follow_up_at ? (
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
          <span>{result.total} عميل محتمل — صفحة {page} من {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
