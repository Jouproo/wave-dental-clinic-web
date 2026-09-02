export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import PostForm from "../PostForm";

export default async function NewBlogPostPage() {
  const supabase = supabaseServer();
  const [categoriesRes, authorsRes, doctorsRes, servicesRes, postsRes] = await Promise.all([
    supabase.from("blog_categories").select("*").eq("status", "active").order("sort_order"),
    supabase.from("blog_authors").select("*").eq("status", "active").order("name_ar"),
    supabase.from("doctors").select("*").eq("status", "active").order("display_order"),
    supabase.from("services").select("id, title").eq("status", "active"),
    supabase.from("blog_posts").select("id, title").eq("status", "published"),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">مقال جديد</h1>
      <p className="text-slate-500 mb-8">إنشاء مقال مدونة جديد</p>
      <PostForm
        categories={categoriesRes.data ?? []}
        authors={authorsRes.data ?? []}
        doctors={doctorsRes.data ?? []}
        services={servicesRes.data?.length ? servicesRes.data : staticServices.map((s) => ({ id: s.id, title: s.title }))}
        otherPublishedPosts={postsRes.data ?? []}
      />
    </div>
  );
}
