"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { DbService } from "@/types/admin";

const ICONS = [
  "Smile", "Zap", "Star", "Sparkles", "Shield", "Layers",
  "Droplets", "Heart", "Activity", "Aperture", "Award",
];

type FormData = {
  id: string;
  icon: string;
  title: string;
  description: string;
  short_cta: string;
  detail_description: string;
  status: "active" | "inactive";
  display_order: number;
};

interface ServiceFormProps {
  initial?: Partial<DbService>;
  isNew?: boolean;
}

export default function ServiceForm({ initial, isNew }: ServiceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    id: initial?.id ?? "",
    icon: initial?.icon ?? "Smile",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    short_cta: initial?.short_cta ?? "اعرف أكثر",
    detail_description: initial?.detail_description ?? "",
    status: initial?.status ?? "active",
    display_order: initial?.display_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isNew ? "/api/admin/services" : `/api/admin/services/${initial?.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "فشل الحفظ");
      }
      setSaved(true);
      setTimeout(() => {
        router.push("/admin/services");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isNew && (
            <Field label="معرّف الخدمة (slug) *" required hint="مثال: orthodontics (بالإنجليزية بدون مسافات)">
              <input
                type="text"
                value={form.id}
                onChange={(e) => handleField("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                className="input"
                placeholder="orthodontics"
                dir="ltr"
              />
            </Field>
          )}
          <Field label="عنوان الخدمة *" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleField("title", e.target.value)}
              required
              className="input"
              placeholder="تقويم الأسنان"
            />
          </Field>
          <Field label="الأيقونة">
            <select value={form.icon} onChange={(e) => handleField("icon", e.target.value)} className="input">
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
          <Field label="نص زر الخدمة">
            <input
              type="text"
              value={form.short_cta}
              onChange={(e) => handleField("short_cta", e.target.value)}
              className="input"
              placeholder="اعرف أكثر"
            />
          </Field>
          <Field label="الترتيب">
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => handleField("display_order", parseInt(e.target.value) || 0)}
              className="input"
              min={0}
            />
          </Field>
          <Field label="الحالة">
            <select value={form.status} onChange={(e) => handleField("status", e.target.value as "active" | "inactive")} className="input">
              <option value="active">نشطة (تظهر في الموقع)</option>
              <option value="inactive">مخفية</option>
            </select>
          </Field>
        </div>
        <Field label="وصف قصير">
          <textarea
            value={form.description}
            onChange={(e) => handleField("description", e.target.value)}
            rows={2}
            className="input resize-none"
            placeholder="وصف مختصر يظهر في بطاقة الخدمة..."
          />
        </Field>
        <Field label="وصف تفصيلي (لصفحة الخدمة)">
          <textarea
            value={form.detail_description}
            onChange={(e) => handleField("detail_description", e.target.value)}
            rows={6}
            className="input resize-none"
            placeholder="وصف شامل يظهر في صفحة الخدمة المستقلة..."
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          تم الحفظ بنجاح، جاري التحويل...
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isNew ? "إضافة الخدمة" : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/services")}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
