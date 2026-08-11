"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import type { DbBlogCategory } from "@/types/blog";

type FormState = {
  name: string;
  slug: string;
  description: string;
  status: "active" | "inactive";
};

const emptyForm: FormState = { name: "", slug: "", description: "", status: "active" };

export default function CategoriesManager({ initial }: { initial: DbBlogCategory[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(cat: DbBlogCategory) {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", status: cat.status });
    setError("");
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
    setError("");
  }

  function cancel() {
    setEditingId(null);
    setError("");
  }

  async function save() {
    if (!form.name.trim()) {
      setError("اسم التصنيف مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const url = isNew ? "/api/admin/blog/categories" : `/api/admin/blog/categories/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      if (isNew) {
        setItems((prev) => [...prev, data]);
      } else {
        setItems((prev) => prev.map((c) => (c.id === editingId ? data : c)));
      }
      setEditingId(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`حذف تصنيف "${name}"؟ المقالات المرتبطة به لن تُحذف، لكنها ستفقد تصنيفها.`)) return;
    await fetch(`/api/admin/blog/categories/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {items.length === 0 && editingId !== "new" && (
          <p className="p-10 text-center text-slate-400">لا توجد تصنيفات بعد. أضف أول تصنيف!</p>
        )}
        <ul className="divide-y divide-gray-50">
          {items.map((cat) =>
            editingId === cat.id ? (
              <li key={cat.id} className="p-4">
                <CategoryFormRow form={form} setForm={setForm} error={error} />
                <div className="flex gap-2 mt-3">
                  <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    حفظ
                  </button>
                  <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                    <X className="w-3.5 h-3.5" />
                    إلغاء
                  </button>
                </div>
              </li>
            ) : (
              <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                <div>
                  <p className="font-medium text-slate-800">{cat.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5" dir="ltr">/blog/category/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cat.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {cat.status === "active" ? "نشط" : "مخفي"}
                  </span>
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          )}
        </ul>

        {editingId === "new" && (
          <div className="p-4 border-t border-gray-100 bg-blue-50/30">
            <CategoryFormRow form={form} setForm={setForm} error={error} />
            <div className="flex gap-2 mt-3">
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                إضافة
              </button>
              <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                <X className="w-3.5 h-3.5" />
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {editingId !== "new" && (
        <button onClick={startNew} className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 font-medium text-sm w-full justify-center">
          <Plus className="w-5 h-5" />
          تصنيف جديد
        </button>
      )}
    </div>
  );
}

function CategoryFormRow({
  form,
  setForm,
  error,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  error: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">الاسم *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input"
          placeholder="زراعة الأسنان"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">الرابط (slug)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className="input"
          placeholder="سيُنشأ تلقائيًا من الاسم لو تُرك فارغًا"
          dir="ltr"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-500 mb-1">وصف مختصر</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="input"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">الحالة</label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))}
          className="input"
        >
          <option value="active">نشط (يظهر في المدونة)</option>
          <option value="inactive">مخفي</option>
        </select>
      </div>
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
