"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, UserCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import type { DbDoctor } from "@/types/admin";

type FormData = {
  name: string;
  specialty: string;
  bio: string;
  experience: string;
  whatsapp: string;
  status: "active" | "inactive";
  display_order: number;
  image_url: string | null;
};

interface DoctorFormProps {
  initial?: Partial<DbDoctor>;
  doctorId?: string;
}

export default function DoctorForm({ initial, doctorId }: DoctorFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormData>({
    name: initial?.name ?? "",
    specialty: initial?.specialty ?? "",
    bio: initial?.bio ?? "",
    experience: initial?.experience ?? "",
    whatsapp: initial?.whatsapp ?? "",
    status: initial?.status ?? "active",
    display_order: initial?.display_order ?? 0,
    image_url: initial?.image_url ?? null,
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let imageUrl = form.image_url;
      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        fd.append("folder", "doctors");
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("فشل رفع الصورة");
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const payload = { ...form, image_url: imageUrl };
      const url = doctorId ? `/api/admin/doctors/${doctorId}` : "/api/admin/doctors";
      const method = doctorId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "فشل الحفظ");
      }
      setSaved(true);
      setTimeout(() => {
        router.push("/admin/doctors");
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewUrl ?? form.image_url;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Image */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-medium text-slate-600 mb-4">صورة الطبيب</p>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center flex-shrink-0">
            {displayImage ? (
              <Image src={displayImage} alt="doctor" width={80} height={80} className="object-cover w-full h-full" unoptimized />
            ) : (
              <UserCircle className="w-10 h-10 text-blue-300" />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              رفع صورة
            </button>
            {pendingFile && <p className="text-xs text-slate-400 mt-1">{pendingFile.name}</p>}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="اسم الطبيب *" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              required
              className="input"
              placeholder="د. محمد أحمد"
            />
          </Field>
          <Field label="التخصص *" required>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => handleField("specialty", e.target.value)}
              required
              className="input"
              placeholder="طب وجراحة الأسنان"
            />
          </Field>
          <Field label="سنوات الخبرة">
            <input
              type="text"
              value={form.experience}
              onChange={(e) => handleField("experience", e.target.value)}
              className="input"
              placeholder="+10 سنوات"
            />
          </Field>
          <Field label="رقم واتساب">
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => handleField("whatsapp", e.target.value)}
              className="input"
              placeholder="+201234567890"
              dir="ltr"
            />
          </Field>
        </div>
        <Field label="نبذة عن الطبيب">
          <textarea
            value={form.bio}
            onChange={(e) => handleField("bio", e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="نبذة قصيرة عن خبرة الطبيب..."
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="الحالة">
            <select
              value={form.status}
              onChange={(e) => handleField("status", e.target.value as "active" | "inactive")}
              className="input"
            >
              <option value="active">نشط (يظهر في الموقع)</option>
              <option value="inactive">مخفي</option>
            </select>
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
        </div>
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
          {doctorId ? "حفظ التعديلات" : "إضافة الطبيب"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/doctors")}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
