"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, X, Check, Upload, UserCircle } from "lucide-react";
import Image from "next/image";
import type { DbBlogAuthor } from "@/types/blog";

type Doctor = { id: string; name: string; specialty: string; image_url: string | null };

type FormState = {
  name_ar: string;
  name_en: string;
  slug: string;
  role: string;
  specialty: string;
  credentials: string;
  bio: string;
  image_url: string;
  linked_doctor_id: string;
  status: "active" | "inactive";
};

const emptyForm: FormState = {
  name_ar: "", name_en: "", slug: "", role: "", specialty: "",
  credentials: "", bio: "", image_url: "", linked_doctor_id: "", status: "active",
};

export default function AuthorsManager({ initial, doctors }: { initial: DbBlogAuthor[]; doctors: Doctor[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function startEdit(a: DbBlogAuthor) {
    setEditingId(a.id);
    setForm({
      name_ar: a.name_ar, name_en: a.name_en ?? "", slug: a.slug, role: a.role ?? "",
      specialty: a.specialty ?? "", credentials: a.credentials ?? "", bio: a.bio ?? "",
      image_url: a.image_url ?? "", linked_doctor_id: a.linked_doctor_id ?? "", status: a.status,
    });
    setError("");
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
    setError("");
  }

  function applyDoctorLink(doctorId: string) {
    const doc = doctors.find((d) => d.id === doctorId);
    setForm((f) => ({
      ...f,
      linked_doctor_id: doctorId,
      name_ar: doctorId ? doc?.name ?? f.name_ar : f.name_ar,
      specialty: doctorId ? doc?.specialty ?? f.specialty : f.specialty,
      image_url: doctorId ? doc?.image_url ?? f.image_url : f.image_url,
    }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog/authors");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("فشل رفع الصورة");
      const { url } = await res.json();
      setForm((f) => ({ ...f, image_url: url }));
    } catch {
      setError("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form.name_ar.trim()) {
      setError("اسم الكاتب مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/admin/blog/authors" : `/api/admin/blog/authors/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, linked_doctor_id: form.linked_doctor_id || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setItems((prev) => (isNew ? [...prev, data] : prev.map((a) => (a.id === editingId ? data : a))));
      setEditingId(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`حذف "${name}"؟ المقالات المرتبطة به ستفقد بيانات الكاتب/المراجع.`)) return;
    await fetch(`/api/admin/blog/authors/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  const formPanel = (
    <div className="p-5 space-y-4">
      {doctors.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">ربط بطبيب موجود (اختياري)</label>
          <select value={form.linked_doctor_id} onChange={(e) => applyDoctorLink(e.target.value)} className="input">
            <option value="">— بدون ربط —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">اختيار طبيب هيملأ الاسم والتخصص والصورة تلقائيًا، وتقدر تعدّلهم بعدين.</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center flex-shrink-0">
          {form.image_url ? (
            <Image src={form.image_url} alt="" width={64} height={64} className="object-cover w-full h-full" unoptimized />
          ) : (
            <UserCircle className="w-8 h-8 text-blue-300" />
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-medium">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          رفع صورة
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">الاسم بالعربي *</label>
          <input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} className="input" placeholder="د. أحمد أبو النصر" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">الاسم بالإنجليزي</label>
          <input value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} className="input" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">الدور</label>
          <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input" placeholder="كاتب / مراجع طبي" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">التخصص</label>
          <input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">المؤهلات</label>
          <input value={form.credentials} onChange={(e) => setForm((f) => ({ ...f, credentials: e.target.value }))} className="input" placeholder="بكالوريوس طب وجراحة الفم والأسنان، زمالة..." />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">نبذة قصيرة</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={2} className="input resize-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">الرابط (slug)</label>
          <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="input" dir="ltr" placeholder="يُنشأ تلقائيًا لو فارغ" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">الحالة</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))} className="input">
            <option value="active">نشط</option>
            <option value="inactive">مخفي</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          حفظ
        </button>
        <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
          <X className="w-3.5 h-3.5" />
          إلغاء
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 && editingId !== "new" && (
          <p className="p-10 text-center text-slate-400">لا يوجد كتّاب/مراجعون بعد. أضف أول واحد!</p>
        )}
        <ul className="divide-y divide-gray-50">
          {items.map((a) =>
            editingId === a.id ? (
              <li key={a.id}>{formPanel}</li>
            ) : (
              <li key={a.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center">
                    {a.image_url ? (
                      <Image src={a.image_url} alt={a.name_ar} width={36} height={36} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <UserCircle className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{a.name_ar}</p>
                    <p className="text-xs text-slate-400">{a.role || a.specialty || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {a.status === "active" ? "نشط" : "مخفي"}
                  </span>
                  <button onClick={() => startEdit(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id, a.name_ar)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
        {editingId === "new" && <div className="border-t border-gray-100 bg-blue-50/30">{formPanel}</div>}
      </div>

      {editingId !== "new" && (
        <button onClick={startNew} className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 font-medium text-sm w-full justify-center">
          <Plus className="w-5 h-5" />
          كاتب/مراجع جديد
        </button>
      )}
    </div>
  );
}
