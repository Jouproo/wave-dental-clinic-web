"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import type { DbGallery } from "@/types/admin";

interface GalleryManagerProps {
  serviceId: string;
  initialItems: DbGallery[];
}

export default function GalleryManager({ serviceId, initialItems }: GalleryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [adding, setAdding] = useState(false);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File) => void,
    setPreview: (url: string) => void
  ) {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("فشل رفع الصورة");
    const { url } = await res.json();
    return url;
  }

  async function handleAddPair() {
    if (!beforeFile && !afterFile) {
      setError("الرجاء رفع صورة قبل أو بعد على الأقل");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const [beforeUrl, afterUrl] = await Promise.all([
        beforeFile ? uploadFile(beforeFile, `gallery/${serviceId}/before`) : Promise.resolve(null),
        afterFile ? uploadFile(afterFile, `gallery/${serviceId}/after`) : Promise.resolve(null),
      ]);

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          before_image_url: beforeUrl,
          after_image_url: afterUrl,
          caption,
          display_order: items.length,
        }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      const newItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setBeforeFile(null);
      setAfterFile(null);
      setBeforePreview(null);
      setAfterPreview(null);
      setCaption("");
      setAdding(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Existing pairs */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="relative aspect-square bg-gray-100">
                  {item.before_image_url ? (
                    <Image src={item.before_image_url} alt="قبل" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">لا توجد صورة</div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">قبل</span>
                </div>
                <div className="relative aspect-square bg-gray-100">
                  {item.after_image_url ? (
                    <Image src={item.after_image_url} alt="بعد" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs">لا توجد صورة</div>
                  )}
                  <span className="absolute top-2 right-2 bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded-full">بعد</span>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-slate-600">{item.caption || "—"}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new pair */}
      {adding ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-700">إضافة زوج صور جديد</h3>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadBox
              label="صورة قبل"
              preview={beforePreview}
              fileRef={beforeRef}
              onChange={(e) => handleFileSelect(e, setBeforeFile, setBeforePreview)}
            />
            <ImageUploadBox
              label="صورة بعد"
              preview={afterPreview}
              fileRef={afterRef}
              onChange={(e) => handleFileSelect(e, setAfterFile, setAfterPreview)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">تعليق (اختياري)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input"
              placeholder="مثال: هوليوود سمايل - حالة واقعية"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleAddPair}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ الزوج
            </button>
            <button
              onClick={() => { setAdding(false); setError(""); }}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-2xl hover:bg-blue-50 transition-colors font-medium text-sm w-full justify-center"
        >
          <Plus className="w-5 h-5" />
          إضافة زوج صور قبل وبعد
        </button>
      )}
    </div>
  );
}

function ImageUploadBox({
  label,
  preview,
  fileRef,
  onChange,
}: {
  label: string;
  preview: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      <div
        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 overflow-hidden relative cursor-pointer hover:border-blue-300 transition-colors flex items-center justify-center bg-gray-50"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <Image src={preview} alt={label} fill className="object-cover" unoptimized />
        ) : (
          <div className="text-center text-slate-400">
            <Upload className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">اضغط للرفع</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </div>
  );
}
