export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { supabaseServer } from "@/lib/supabase";
import PostsTable from "./PostsTable";
import type { BlogPostStatus } from "@/types/blog";

const STATUS_TABS: { value: BlogPostStatus | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "draft", label: "مسودة" },
  { value: "in_review", label: "قيد المراجعة" },
  { value: "scheduled", label: "مجدولة" },
  { value: "published", label: "منشورة" },
  { value: "archived", label: "مؤرشفة" },
];

export default async function BlogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const supabase = supabaseServer();
  const page = parseInt(sp.page ?? "1", 10) || 1;
  const perPage = 15;

  const [countsRes, categoriesRes] = await Promise.all([
    supabase.from("blog_posts").select("status"),
    supabase.from("blog_categories").select("id, name").order("sort_order"),
  ]);

  const counts: Record<string, number> = { all: countsRes.data?.length ?? 0 };
  for (const row of countsRes.data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  let query = supabase
    .from("blog_posts")
    .select("*, category:blog_categories!category_id(*), author:blog_authors!author_id(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (sp.status && sp.status !== "all") query = query.eq("status", sp.status);
  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.search) query = query.or(`title.ilike.%${sp.search}%,slug.ilike.%${sp.search}%`);

  const { data: posts, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المقالات</h1>
          <p className="text-slate-500 mt-1">إدارة مقالات مدونة العيادة</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/blog/categories" className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 font-medium rounded-xl text-sm">
            التصنيفات
          </Link>
          <Link href="/admin/blog/authors" className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 font-medium rounded-xl text-sm">
            الكتّاب والمراجعون
          </Link>
          <Link href="/admin/blog/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm">
            <Plus className="w-4 h-4" /> مقال جديد
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((tab) => {
          const active = (sp.status ?? "all") === tab.value;
          const href = tab.value === "all" ? "/admin/blog" : `/admin/blog?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
              }`}
            >
              {tab.label} <span className="opacity-70">({counts[tab.value] ?? 0})</span>
            </Link>
          );
        })}
      </div>

      {/* Search + category filter */}
      <form className="flex flex-wrap gap-2 mb-5" action="/admin/blog">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input
          type="text"
          name="search"
          defaultValue={sp.search}
          placeholder="ابحث بالعنوان أو الرابط..."
          className="input max-w-xs"
        />
        <select name="category" defaultValue={sp.category ?? ""} className="input max-w-[200px]">
          <option value="">كل التصنيفات</option>
          {(categoriesRes.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">
          بحث
        </button>
      </form>

      <PostsTable posts={posts ?? []} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{ pathname: "/admin/blog", query: { ...sp, page: p } }}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium ${
                p === page ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-slate-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
