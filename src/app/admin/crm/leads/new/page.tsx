"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  SOURCE_OPTIONS, SERVICE_INTEREST_OPTIONS, CASE_SIZE_OPTIONS, START_TIMING_OPTIONS,
} from "@/lib/crm-labels";

interface Branch { id: string; name: string }

export default function NewLeadPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({
    name: "", mobile_raw: "", source: "", service_interest: "",
    case_size: "", start_timing: "", branch_id: "",
    asked_price: false, opened_messenger: false, conversation_summary: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/crm/meta").then((r) => r.json()).then((d) => setBranches(d.branches ?? []));
  }, []);

  function field<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branch_id: form.branch_id || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setSaved(true);
      setTimeout(() => router.push(`/admin/crm/leads/${data.id}`), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">إضافة عميل محتمل</h1>
      <p className="text-slate-500 mb-6">الاسم مطلوب فقط — باقي البيانات اختيارية ويمكن إكمالها لاحقًا</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="الاسم *">
            <input required value={form.name} onChange={(e) => field("name", e.target.value)} className="input" />
          </Field>
          <Field label="رقم الموبايل">
            <input value={form.mobile_raw} onChange={(e) => field("mobile_raw", e.target.value)} dir="ltr" className="input" placeholder="01xxxxxxxxx" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="المصدر">
            <select value={form.source} onChange={(e) => field("source", e.target.value)} className="input">
              <option value="">اختر...</option>
              {SOURCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="الخدمة">
            <select value={form.service_interest} onChange={(e) => field("service_interest", e.target.value)} className="input">
              <option value="">اختر...</option>
              {SERVICE_INTEREST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="حجم الحالة">
            <select value={form.case_size} onChange={(e) => field("case_size", e.target.value)} className="input">
              <option value="">غير محدد</option>
              {CASE_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="موعد البدء">
            <select value={form.start_timing} onChange={(e) => field("start_timing", e.target.value)} className="input">
              <option value="">غير محدد</option>
              {START_TIMING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="الفرع">
            <select value={form.branch_id} onChange={(e) => field("branch_id", e.target.value)} className="input">
              <option value="">افتراضي</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.asked_price} onChange={(e) => field("asked_price", e.target.checked)} className="accent-blue-600" />
            سأل عن السعر/الخدمة
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.opened_messenger} onChange={(e) => field("opened_messenger", e.target.checked)} className="accent-blue-600" />
            فتح ماسنجر بعد الفورم
          </label>
        </div>

        <Field label="ملخص المحادثة">
          <textarea value={form.conversation_summary} onChange={(e) => field("conversation_summary", e.target.value)} rows={2} className="input resize-none" />
        </Field>
        <Field label="ملاحظات">
          <textarea value={form.notes} onChange={(e) => field("notes", e.target.value)} rows={2} className="input resize-none" />
        </Field>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4" /> تم الحفظ، جاري التحويل...
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ
          </button>
          <button type="button" onClick={() => router.push("/admin/crm/leads")} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
