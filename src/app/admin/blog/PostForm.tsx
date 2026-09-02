"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { JSONContent } from "@tiptap/react";
import {
  Loader2, Upload, ImageIcon, Plus, Trash2, CheckCircle2, Eye, Send, Calendar, Archive,
} from "lucide-react";
import { slugify } from "@/lib/blog-utils";
import type { DbBlogCategory, DbBlogAuthor, DbBlogPost, BlogPostStatus } from "@/types/blog";
import type { DbDoctor } from "@/types/admin";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="min-h-[320px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />,
});

type SourceRow = { title: string; url: string };
type FaqRow = { question: string; answer: string };

type PostFormData = {
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  cover_image_alt: string;
  category_id: string;
  author_id: string;
  reviewer_id: string;
  featured: boolean;
  related_service_id: string;
  tags: string;
  seo_title: string;
  meta_description: string;
  canonical_override: string;
  og_image_url: string;
  focus_keyword: string;
  medical_disclaimer: string;
  scheduled_at: string;
};

const DEFAULT_DISCLAIMER =
  "المعلومات الواردة في هذا المقال لغرض التوعية ولا تُغني عن الكشف والتقييم الطبي، فكل خطة علاج تختلف من حالة لأخرى.";

interface PostFormProps {
  initial?: (DbBlogPost & {
    sources: SourceRow[];
    faqs: FaqRow[];
    related_post_ids: string[];
  }) | null;
  postId?: string;
  categories: DbBlogCategory[];
  authors: DbBlogAuthor[];
  doctors: DbDoctor[];
  services: { id: string; title: string }[];
  otherPublishedPosts: { id: string; title: string }[];
}

export default function PostForm({
  initial, postId, categories, authors, doctors, services, otherPublishedPosts,
}: PostFormProps) {
  const router = useRouter();
  const isNew = !postId;
  const slugManuallyEdited = useRef(!!initial);
  const bodyRef = useRef<{ html: string; json: JSONContent }>({
    html: initial?.body_html ?? "",
    json: (initial?.body_json as JSONContent) ?? { type: "doc", content: [] },
  });

  const [form, setForm] = useState<PostFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    cover_image_alt: initial?.cover_image_alt ?? "",
    category_id: initial?.category_id ?? "",
    author_id: initial?.author_id ?? "",
    reviewer_id: initial?.reviewer_id ?? "",
    featured: initial?.featured ?? false,
    related_service_id: initial?.related_service_id ?? "",
    tags: (initial?.tags ?? []).join(", "),
    seo_title: initial?.seo_title ?? "",
    meta_description: initial?.meta_description ?? "",
    canonical_override: initial?.canonical_override ?? "",
    og_image_url: initial?.og_image_url ?? "",
    focus_keyword: initial?.focus_keyword ?? "",
    medical_disclaimer: initial?.medical_disclaimer ?? DEFAULT_DISCLAIMER,
    scheduled_at: initial?.scheduled_at ? toLocalInputValue(initial.scheduled_at) : "",
  });
  const [sources, setSources] = useState<SourceRow[]>(initial?.sources?.length ? initial.sources : []);
  const [faqs, setFaqs] = useState<FaqRow[]>(initial?.faqs?.length ? initial.faqs : []);
  const [relatedIds, setRelatedIds] = useState<string[]>(initial?.related_post_ids ?? []);

  // Author/reviewer selects offer registered doctors directly; picking one
  // auto-provisions (or reuses) its blog_authors byline behind the scenes,
  // so the admin never has to pre-create one via /admin/blog/authors first.
  const [authorsList, setAuthorsList] = useState<DbBlogAuthor[]>(authors);
  const [resolvingPerson, setResolvingPerson] = useState<"author_id" | "reviewer_id" | null>(null);
  const otherAuthors = authorsList.filter((a) => !a.linked_doctor_id);

  function personSelectKey(id: string): string {
    if (!id) return "";
    const a = authorsList.find((x) => x.id === id);
    if (a?.linked_doctor_id) return `doctor:${a.linked_doctor_id}`;
    return a ? `author:${id}` : "";
  }

  async function handlePersonChange(field: "author_id" | "reviewer_id", key: string) {
    if (!key) { set(field, ""); return; }
    const [kind, id] = key.split(":");
    if (kind === "author") { set(field, id); return; }

    const already = authorsList.find((a) => a.linked_doctor_id === id);
    if (already) { set(field, already.id); return; }

    setResolvingPerson(field);
    try {
      const res = await fetch("/api/admin/blog/authors/link-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل ربط الطبيب");
      setAuthorsList((prev) => (prev.some((a) => a.id === data.id) ? prev : [...prev, data]));
      set(field, data.id);
    } catch {
      setError("تعذر إضافة الطبيب المحدد");
    } finally {
      setResolvingPerson(null);
    }
  }

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function set<K extends keyof PostFormData>(key: K, value: PostFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function handleTitleChange(value: string) {
    set("title", value);
    if (!slugManuallyEdited.current) {
      setForm((f) => ({ ...f, slug: slugify(value) }));
    }
  }

  function handleSlugChange(value: string) {
    slugManuallyEdited.current = true;
    set("slug", value);
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "blog/covers");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("فشل رفع الصورة");
      const { url } = await res.json();
      set("cover_image_url", url);
    } catch {
      setError("فشل رفع صورة الغلاف");
    } finally {
      setUploadingCover(false);
    }
  }

  async function persist(nextStatus: BlogPostStatus) {
    setError("");

    if (!form.title.trim()) {
      setError("عنوان المقال مطلوب");
      return;
    }
    if (nextStatus === "published" || nextStatus === "scheduled") {
      if (form.cover_image_url && !form.cover_image_alt.trim()) {
        setError("النص البديل لصورة الغلاف مطلوب قبل النشر");
        return;
      }
      if (nextStatus === "scheduled" && !form.scheduled_at) {
        setError("حدد موعد النشر المجدول");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        body_html: bodyRef.current.html,
        body_json: bodyRef.current.json,
        status: nextStatus,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        sources,
        faqs,
        related_post_ids: relatedIds,
        expected_updated_at: initial?.updated_at,
      };

      const url = isNew ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${postId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");

      setDirty(false);
      setSaved(statusLabel(nextStatus));
      setTimeout(() => setSaved(""), 2500);

      if (isNew) {
        router.replace(`/admin/blog/${data.id}/edit`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      {/* Core content */}
      <Section title="المحتوى الأساسي">
        <Field label="عنوان المقال *">
          <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="input" placeholder="كل ما تحتاج معرفته عن زراعة الأسنان" />
        </Field>
        <Field label="الرابط (slug) *" hint="يظهر في /blog/[الرابط]">
          <input value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} className="input" dir="ltr" />
        </Field>
        <Field label="مقتطف قصير">
          <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="input resize-none" placeholder="ملخص من سطر أو سطرين يظهر في بطاقة المقال" />
        </Field>

        <Field label="صورة الغلاف">
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 relative">
              {form.cover_image_url ? (
                <Image src={form.cover_image_url} alt="" fill className="object-cover" unoptimized />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={coverInputRef} type="file" accept="image/*" onChange={uploadCover} className="hidden" />
              <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} className="flex items-center gap-2 px-3 py-2 border border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-sm font-medium">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                رفع صورة الغلاف
              </button>
              <input value={form.cover_image_alt} onChange={(e) => set("cover_image_alt", e.target.value)} className="input" placeholder="نص بديل وصفي للصورة (مطلوب قبل النشر)" />
            </div>
          </div>
        </Field>

        <Field label="نص المقال">
          <RichTextEditor
            initialContent={(initial?.body_json as JSONContent) ?? initial?.body_html ?? ""}
            onChange={(payload) => { bodyRef.current = payload; setDirty(true); }}
          />
        </Field>
      </Section>

      {/* Taxonomy */}
      <Section title="التصنيف والربط">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="التصنيف">
            <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className="input">
              <option value="">— بدون تصنيف —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="الخدمة المرتبطة">
            <select value={form.related_service_id} onChange={(e) => set("related_service_id", e.target.value)} className="input">
              <option value="">— بدون —</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
          <Field label="الكاتب" hint={resolvingPerson === "author_id" ? "جارٍ الإضافة..." : undefined}>
            <select
              value={personSelectKey(form.author_id)}
              onChange={(e) => handlePersonChange("author_id", e.target.value)}
              disabled={resolvingPerson === "author_id"}
              className="input"
            >
              <option value="">— غير محدد —</option>
              {doctors.length > 0 && (
                <optgroup label="الأطباء المسجلون">
                  {doctors.map((d) => <option key={d.id} value={`doctor:${d.id}`}>{d.name} — {d.specialty}</option>)}
                </optgroup>
              )}
              {otherAuthors.length > 0 && (
                <optgroup label="كتّاب آخرون">
                  {otherAuthors.map((a) => <option key={a.id} value={`author:${a.id}`}>{a.name_ar}</option>)}
                </optgroup>
              )}
            </select>
          </Field>
          <Field label="المراجع الطبي" hint={resolvingPerson === "reviewer_id" ? "جارٍ الإضافة..." : undefined}>
            <select
              value={personSelectKey(form.reviewer_id)}
              onChange={(e) => handlePersonChange("reviewer_id", e.target.value)}
              disabled={resolvingPerson === "reviewer_id"}
              className="input"
            >
              <option value="">— بدون مراجعة طبية —</option>
              {doctors.length > 0 && (
                <optgroup label="الأطباء المسجلون">
                  {doctors.map((d) => <option key={d.id} value={`doctor:${d.id}`}>{d.name} — {d.specialty}</option>)}
                </optgroup>
              )}
              {otherAuthors.length > 0 && (
                <optgroup label="مراجعون آخرون">
                  {otherAuthors.map((a) => <option key={a.id} value={`author:${a.id}`}>{a.name_ar}</option>)}
                </optgroup>
              )}
            </select>
          </Field>
        </div>
        <Field label="وسوم داخلية (مفصولة بفاصلة)" hint="للتنظيم الداخلي فقط، لا تظهر للزوار">
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className="input" dir="rtl" placeholder="زراعة, تعقيم, 6 أكتوبر" />
        </Field>
        <label className="flex items-center gap-2.5 text-sm text-slate-600">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
          مقال مميز (يظهر في القسم البارز بالمدونة)
        </label>
      </Section>

      {/* Medical credibility */}
      <Section title="المصداقية الطبية">
        <Field label="تنويه طبي">
          <textarea value={form.medical_disclaimer} onChange={(e) => set("medical_disclaimer", e.target.value)} rows={2} className="input resize-none" />
        </Field>

        <RepeaterField label="المصادر والمراجع" addLabel="إضافة مصدر">
          {sources.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input value={s.title} onChange={(e) => setSources((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="input flex-1" placeholder="عنوان المصدر" />
              <input value={s.url} onChange={(e) => setSources((p) => p.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} className="input flex-1" placeholder="https://..." dir="ltr" />
              <button type="button" onClick={() => setSources((p) => p.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <AddButton onClick={() => setSources((p) => [...p, { title: "", url: "" }])} />
        </RepeaterField>

        <RepeaterField label="الأسئلة الشائعة" addLabel="إضافة سؤال">
          {faqs.map((f, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input value={f.question} onChange={(e) => setFaqs((p) => p.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} className="input flex-1" placeholder="السؤال" />
                <button type="button" onClick={() => setFaqs((p) => p.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={f.answer} onChange={(e) => setFaqs((p) => p.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} rows={2} className="input resize-none" placeholder="الإجابة" />
            </div>
          ))}
          <AddButton onClick={() => setFaqs((p) => [...p, { question: "", answer: "" }])} />
        </RepeaterField>

        {otherPublishedPosts.length > 0 && (
          <Field label="مقالات ذات صلة">
            <div className="flex flex-wrap gap-2">
              {otherPublishedPosts.map((p) => {
                const active = relatedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRelatedIds((prev) => active ? prev.filter((id) => id !== p.id) : [...prev, p.id])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      </Section>

      {/* SEO */}
      <Section title="تحسين محركات البحث (SEO)">
        <Field label="عنوان SEO" hint="افتراضيًا يُستخدم عنوان المقال إن تُرك فارغًا">
          <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="input" />
        </Field>
        <Field label={`وصف الميتا (${form.meta_description.length}/160)`}>
          <textarea value={form.meta_description} onChange={(e) => set("meta_description", e.target.value.slice(0, 160))} rows={2} className="input resize-none" />
        </Field>
        <Field label="الكلمة المفتاحية (لأغراض التحرير الداخلي فقط)">
          <input value={form.focus_keyword} onChange={(e) => set("focus_keyword", e.target.value)} className="input" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Canonical مخصص (نادرًا ما يُحتاج)">
            <input value={form.canonical_override} onChange={(e) => set("canonical_override", e.target.value)} className="input" dir="ltr" />
          </Field>
          <Field label="صورة Open Graph مخصصة">
            <input value={form.og_image_url} onChange={(e) => set("og_image_url", e.target.value)} className="input" dir="ltr" placeholder="افتراضيًا صورة الغلاف" />
          </Field>
        </div>
        <SeoPreview title={form.seo_title || form.title} description={form.meta_description || form.excerpt} slug={form.slug} />
      </Section>

      {/* Publishing */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-lg p-4 space-y-3">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {saved}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => persist("draft")} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ كمسودة
          </button>
          <button onClick={() => persist("in_review")} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold rounded-xl text-sm">
            <Send className="w-4 h-4" /> إرسال للمراجعة
          </button>
          {postId && (
            <a href={`/admin/blog/${postId}/preview`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">
              <Eye className="w-4 h-4" /> معاينة
            </a>
          )}
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set("scheduled_at", e.target.value)}
              className="input !py-2 text-sm"
            />
            <button onClick={() => persist("scheduled")} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-800 font-semibold rounded-xl text-sm whitespace-nowrap">
              <Calendar className="w-4 h-4" /> جدولة
            </button>
          </div>
          <button onClick={() => persist("published")} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} نشر الآن
          </button>
          {initial && initial.status !== "archived" && (
            <button onClick={() => persist("archived")} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-sm">
              <Archive className="w-4 h-4" /> أرشفة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function statusLabel(s: BlogPostStatus) {
  switch (s) {
    case "draft": return "تم الحفظ كمسودة";
    case "in_review": return "تم الإرسال للمراجعة";
    case "scheduled": return "تمت جدولة النشر";
    case "published": return "تم نشر المقال";
    case "archived": return "تمت أرشفة المقال";
  }
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function RepeaterField({ label, children }: { label: string; addLabel: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
      <Plus className="w-4 h-4" /> إضافة
    </button>
  );
}

function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <p className="text-xs text-slate-400 mb-2">معاينة نتيجة البحث</p>
      <p className="text-[#1a0dab] text-lg leading-snug truncate">{title || "عنوان المقال"}</p>
      <p className="text-[#006621] text-sm" dir="ltr">wavedentelclinic.com/blog/{slug || "article-slug"}</p>
      <p className="text-slate-600 text-sm mt-1 line-clamp-2">{description || "وصف الميتا سيظهر هنا…"}</p>
    </div>
  );
}
