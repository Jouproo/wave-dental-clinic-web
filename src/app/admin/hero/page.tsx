"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Save, Loader2 } from "lucide-react";
import Image from "next/image";

export default function HeroAdminPage() {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/hero")
      .then((r) => r.json())
      .then((d) => setCurrentUrl(d.background_image_url ?? null));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      let imageUrl = currentUrl;

      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        fd.append("folder", "hero");
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("فشل رفع الصورة");
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      const res = await fetch("/api/admin/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background_image_url: imageUrl }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");

      setCurrentUrl(imageUrl);
      setPreviewUrl(null);
      setPendingFile(null);
      setMessage("تم الحفظ بنجاح ✓");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    await fetch("/api/admin/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ background_image_url: null }),
    });
    setCurrentUrl(null);
    setPreviewUrl(null);
    setPendingFile(null);
    setSaving(false);
    setMessage("تم الحذف ✓");
  }

  const displayUrl = previewUrl ?? currentUrl;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">إعدادات الهيرو</h1>
      <p className="text-slate-500 mb-8">تحكم في صورة الخلفية للبطاقة الرئيسية في قسم الهيرو</p>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-sm font-medium text-slate-600 mb-3">معاينة الصورة الحالية</p>
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-sky-50 flex items-center justify-center relative">
          {displayUrl ? (
            <Image src={displayUrl} alt="Hero background" fill className="object-cover" unoptimized />
          ) : (
            <div className="text-center text-slate-400">
              <span className="text-5xl block mb-2">🦷</span>
              <p className="text-sm">لا توجد صورة (يُستخدم التصميم الافتراضي)</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-sm font-medium text-slate-600 mb-3">رفع صورة جديدة</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          اختر صورة
        </button>
        {pendingFile && (
          <p className="mt-2 text-xs text-slate-500">تم اختيار: {pendingFile.name}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
        {currentUrl && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            إزالة الصورة
          </button>
        )}
      </div>

      {message && (
        <p className={`mt-4 text-sm font-medium ${message.includes("فشل") || message.includes("خطأ") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
