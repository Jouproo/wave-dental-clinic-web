"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, MessageCircle, User, Flame, Loader2, CheckCircle2, ArrowRight,
  Calendar, Briefcase, MapPin, FileText,
} from "lucide-react";
import type { DbLead } from "@/types/admin";
import {
  STAGE_LABELS, CLASSIFICATION_LABELS, CLASSIFICATION_COLORS, QUALIFICATION_LABELS,
  PIPELINE_STAGES, SIDE_TRACK_STAGES, LOSS_REASON_OPTIONS,
} from "@/lib/crm-labels";

interface Branch { id: string; name: string }
interface AssignableUser { id: string; name: string; email: string }

export default function LeadDetail({
  lead, canAssign, branches, assignableUsers,
}: {
  lead: DbLead; canAssign: boolean; branches: Branch[]; assignableUsers: AssignableUser[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState(lead.stage);
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [nextFollowUp, setNextFollowUp] = useState(lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : "");
  const [lossReason, setLossReason] = useState(lead.loss_reason ?? "");
  const [lossReasonOther, setLossReasonOther] = useState(lead.loss_reason_other ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const branchName = branches.find((b) => b.id === lead.branch_id)?.name;

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/crm/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  function handleStageChange(newStage: string) {
    setStage(newStage as DbLead["stage"]);
    if (newStage === "lost") return; // wait for loss reason before saving
    save({ stage: newStage });
  }

  function confirmLoss() {
    if (!lossReason) { setError("اختر سبب الخسارة"); return; }
    if (lossReason === "أخرى" && !lossReasonOther.trim()) { setError("اكتب توضيحًا"); return; }
    save({ stage: "lost", loss_reason: lossReason, loss_reason_other: lossReasonOther });
  }

  const whatsappUrl = lead.mobile_normalized
    ? `https://wa.me/${lead.mobile_normalized.replace(/\D/g, "")}`
    : null;

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.push("/admin/crm/leads")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5">
        <ArrowRight className="w-4 h-4" /> رجوع لكل العملاء
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{lead.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">{lead.lead_code}{lead.legacy_id ? ` · ${lead.legacy_id}` : ""}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${CLASSIFICATION_COLORS[lead.classification]}`}>
                <Flame className="w-3.5 h-3.5" /> {CLASSIFICATION_LABELS[lead.classification]} · {lead.lead_score}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <InfoRow icon={User} label="التأهيل">{QUALIFICATION_LABELS[lead.qualification_status]}</InfoRow>
              {lead.service_interest && <InfoRow icon={Briefcase} label="الخدمة">{lead.service_interest}</InfoRow>}
              {branchName && <InfoRow icon={MapPin} label="الفرع">{branchName}</InfoRow>}
              {lead.source && <InfoRow icon={FileText} label="المصدر">{lead.source}</InfoRow>}
              {lead.case_size && <InfoRow icon={FileText} label="حجم الحالة">{lead.case_size}</InfoRow>}
              {lead.start_timing && <InfoRow icon={Calendar} label="موعد البدء">{lead.start_timing}</InfoRow>}
            </div>

            {lead.conversation_summary && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-slate-500 mb-1">ملخص المحادثة</p>
                <p className="text-slate-700 text-sm whitespace-pre-line">{lead.conversation_summary}</p>
              </div>
            )}

            {/* Contact actions — only enabled for a confirmed-valid phone */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              {lead.mobile_raw && (
                <a href={`tel:${lead.mobile_raw}`} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100">
                  <Phone className="w-4 h-4" /> اتصال
                </a>
              )}
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100">
                  <MessageCircle className="w-4 h-4" /> واتساب
                </a>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl self-center">لا يوجد رقم صالح لواتساب</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2">فتح واتساب أو الاتصال لا يُسجَّل كمحاولة تواصل تلقائيًا — سجّل نشاط التواصل في قسم المتابعات (قريبًا).</p>
          </div>

          {/* Score breakdown */}
          {Array.isArray(lead.score_breakdown) && lead.score_breakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-semibold text-slate-600 mb-3">تفاصيل الأولوية (Lead Score)</p>
              <ul className="space-y-1.5">
                {(lead.score_breakdown as { label: string; points: number }[]).map((b, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{b.label}</span>
                    <span className="font-semibold text-blue-600">+{b.points}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 font-bold">
                  <span>الإجمالي</span><span>{lead.lead_score}</span>
                </li>
              </ul>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">ملاحظات</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-none mb-3" />
            <button onClick={() => save({ notes })} disabled={saving} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm">
              حفظ الملاحظات
            </button>
          </div>
        </div>

        {/* Right: stage/assign/follow-up */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">المرحلة</p>
            <select value={stage} onChange={(e) => handleStageChange(e.target.value)} className="input mb-2">
              <optgroup label="مسار البيع">
                {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </optgroup>
              <optgroup label="حالات أخرى">
                {SIDE_TRACK_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </optgroup>
            </select>

            {stage === "lost" && (
              <div className="space-y-2 mt-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <select value={lossReason} onChange={(e) => setLossReason(e.target.value)} className="input">
                  <option value="">سبب الخسارة...</option>
                  {LOSS_REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {lossReason === "أخرى" && (
                  <input value={lossReasonOther} onChange={(e) => setLossReasonOther(e.target.value)} placeholder="وضّح السبب..." className="input" />
                )}
                <button onClick={confirmLoss} disabled={saving} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
                  تأكيد الخسارة
                </button>
              </div>
            )}
          </div>

          {canAssign && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-semibold text-slate-600 mb-3">المسؤول</p>
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); save({ assigned_to: e.target.value || null }); }}
                className="input"
              >
                <option value="">غير مُسند</option>
                {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-semibold text-slate-600 mb-3">المتابعة القادمة</p>
            <input
              type="datetime-local"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="input mb-2"
            />
            <button
              onClick={() => save({ next_follow_up_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null })}
              disabled={saving}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold"
            >
              حفظ موعد المتابعة
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      {saved && !error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4" /> تم الحفظ
        </div>
      )}
      {saving && <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</div>}
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-slate-700 font-medium">{children}</p>
      </div>
    </div>
  );
}
