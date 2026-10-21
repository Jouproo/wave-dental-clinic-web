"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, Calendar, Clock, MessageSquare, FileText, Loader2,
  CheckCircle2, ShieldCheck, Stethoscope, Send, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { DbBookingRequest, DbDoctor, BookingStatus } from "@/types/admin";
import { makeWhatsAppUrl } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: "new", label: "جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "in_review", label: "قيد المراجعة" },
  { value: "diagnosed", label: "تم التشخيص" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

interface BookingDetailProps {
  booking: DbBookingRequest;
  doctors: DbDoctor[];
  serviceTitle: string | null;
  xrays: { path: string; url: string }[];
}

export default function BookingDetail({ booking, doctors, serviceTitle, xrays }: BookingDetailProps) {
  const router = useRouter();
  const isDiagnosis = booking.request_type === "implant_diagnosis";

  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [diagnosisNotes, setDiagnosisNotes] = useState(booking.diagnosis_notes ?? "");
  const [diagnosedBy, setDiagnosedBy] = useState(booking.diagnosed_by ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function saveStatus() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "فشل الحفظ");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function saveDiagnosis() {
    if (!diagnosisNotes.trim()) {
      setError("من فضلك اكتب التشخيص قبل الحفظ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis_notes: diagnosisNotes.trim(),
          diagnosed_by: diagnosedBy || null,
          mark_diagnosed: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "فشل الحفظ");
      setStatus("diagnosed");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  const whatsappSendUrl = makeWhatsAppUrl(
    booking.phone,
    `مرحبًا ${booking.name}، معاك ${clinicConfig.clinicName} 🦷\n\nنتيجة التقييم الأولي لحالتك:\n${diagnosisNotes.trim()}\n\nللاستفسار أو حجز الكشف التفصيلي، احنا تحت أمرك.`
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 w-fit">
        <ArrowRight className="w-4 h-4" />
        رجوع لكل الطلبات
      </Link>

      {/* Patient info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-slate-800">{booking.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDiagnosis ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          }`}>
            {isDiagnosis ? "تشخيص زراعة مجاني" : "حجز موعد"}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <InfoRow icon={Phone} label="الهاتف"><span dir="ltr">{booking.phone}</span></InfoRow>
          {booking.age && <InfoRow icon={User} label="العمر">{booking.age} سنة</InfoRow>}
          {serviceTitle && <InfoRow icon={Stethoscope} label="الخدمة">{serviceTitle}</InfoRow>}
          {booking.preferred_date && <InfoRow icon={Calendar} label="التاريخ المفضل">{booking.preferred_date}</InfoRow>}
          {booking.preferred_time && <InfoRow icon={Clock} label="الوقت المفضل">{booking.preferred_time}</InfoRow>}
          {isDiagnosis && (
            <InfoRow icon={ShieldCheck} label="الموافقة على المعالجة الطبية">
              {booking.consent_given ? "موافق ✓" : "غير موافق"}
            </InfoRow>
          )}
        </div>

        {booking.message && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> ملاحظات المريض
            </p>
            <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">{booking.message}</p>
          </div>
        )}

        <div className="mt-3 pt-3 text-xs text-slate-400">
          تم الإرسال في {new Date(booking.created_at).toLocaleString("ar-EG")}
        </div>
      </div>

      {/* X-rays */}
      {xrays.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-4">
            <FileText className="w-4 h-4" /> الأشعة المرفوعة ({xrays.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {xrays.map((x) => (
              <a
                key={x.path}
                href={x.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 hover:border-blue-300 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, one-time token, not optimizable/cacheable by next/image */}
                <img src={x.url} alt="أشعة المريض" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">روابط العرض مؤقتة وتنتهي صلاحيتها خلال ساعة لحماية خصوصية المريض.</p>
        </div>
      )}

      {/* Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold text-slate-600 mb-3">حالة الطلب</p>
        <div className="flex flex-wrap items-center gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className="input max-w-[220px]">
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={saveStatus}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ الحالة
          </button>
        </div>
      </div>

      {/* Diagnosis (implant_diagnosis only) */}
      {isDiagnosis && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-semibold text-slate-600 mb-3">تشخيص الطبيب</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">الطبيب المسؤول</label>
              <select value={diagnosedBy} onChange={(e) => setDiagnosedBy(e.target.value)} className="input">
                <option value="">اختر الطبيب...</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">نص التشخيص</label>
              <textarea
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                rows={5}
                className="input resize-none"
                placeholder="اكتب التقييم الأولي لحالة المريض بناءً على البيانات والأشعة المرفوعة..."
              />
            </div>
            <button
              onClick={saveDiagnosis}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-xl text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ التشخيص
            </button>

            {booking.diagnosis_notes || diagnosisNotes.trim() ? (
              <a
                href={whatsappSendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-3 rounded-xl transition-colors text-sm border border-green-200"
              >
                <Send className="w-4 h-4" />
                إرسال النتيجة للمريض عبر واتساب
              </a>
            ) : null}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          تم الحفظ بنجاح
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-slate-700 font-medium">{children}</p>
      </div>
    </div>
  );
}
