"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Eye, FileText, Send, CheckCircle2, Archive, Newspaper } from "lucide-react";
import type { DbBlogPost, DbBlogCategory, DbBlogAuthor, BlogPostStatus } from "@/types/blog";

type Row = DbBlogPost & { category: DbBlogCategory | null; author: DbBlogAuthor | null };

const STATUS_STYLE: Record<BlogPostStatus, { label: string; cls: string }> = {
  draft: { label: "مسودة", cls: "bg-gray-100 text-gray-600" },
  in_review: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
  scheduled: { label: "مجدولة", cls: "bg-violet-100 text-violet-700" },
  published: { label: "منشورة", cls: "bg-green-100 text-green-700" },
  archived: { label: "مؤرشفة", cls: "bg-red-100 text-red-600" },
};

export default function PostsTable({ posts }: { posts: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setStatus(id: string, status: BlogPostStatus) {
    setBusyId(id);
    await fetch(`/api/admin/blog/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`حذف "${title}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setBusyId(id);
    await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-slate-400">
        <Newspaper className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p>لا توجد مقالات مطابقة. أضف أول مقال!</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">المقال</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">التصنيف</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الكاتب</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الحالة</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800 max-w-xs truncate">{p.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5" dir="ltr">/blog/{p.slug}</p>
                </td>
                <td className="px-5 py-4 text-slate-500">{p.category?.name ?? "—"}</td>
                <td className="px-5 py-4 text-slate-500">{p.author?.name_ar ?? "—"}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[p.status].cls}`}>
                    {STATUS_STYLE[p.status].label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <RowActions post={p} busy={busyId === p.id} onSetStatus={setStatus} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{p.title}</p>
                <p className="text-xs text-slate-400 mt-0.5" dir="ltr">/blog/{p.slug}</p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[p.status].cls}`}>
                {STATUS_STYLE[p.status].label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{p.category?.name ?? "بدون تصنيف"} · {p.author?.name_ar ?? "بدون كاتب"}</p>
            <RowActions post={p} busy={busyId === p.id} onSetStatus={setStatus} onDelete={handleDelete} />
          </div>
        ))}
      </div>
    </>
  );
}

function RowActions({
  post, busy, onSetStatus, onDelete,
}: {
  post: Row;
  busy: boolean;
  onSetStatus: (id: string, status: BlogPostStatus) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link href={`/admin/blog/${post.id}/edit`} title="تعديل" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
        <Pencil className="w-4 h-4" />
      </Link>
      <Link href={`/admin/blog/${post.id}/preview`} title="معاينة" target="_blank" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Eye className="w-4 h-4" />
      </Link>
      {post.status !== "published" && (
        <button disabled={busy} onClick={() => onSetStatus(post.id, "published")} title="نشر" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
          <Send className="w-4 h-4" />
        </button>
      )}
      {post.status === "published" && (
        <button disabled={busy} onClick={() => onSetStatus(post.id, "draft")} title="إلغاء النشر" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
          <FileText className="w-4 h-4" />
        </button>
      )}
      {post.status !== "archived" ? (
        <button disabled={busy} onClick={() => onSetStatus(post.id, "archived")} title="أرشفة" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Archive className="w-4 h-4" />
        </button>
      ) : (
        <button disabled={busy} onClick={() => onSetStatus(post.id, "draft")} title="إخراج من الأرشيف" className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
          <CheckCircle2 className="w-4 h-4" />
        </button>
      )}
      <button disabled={busy} onClick={() => onDelete(post.id, post.title)} title="حذف" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
