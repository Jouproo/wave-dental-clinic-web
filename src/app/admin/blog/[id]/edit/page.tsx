export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import PostForm from "../../PostForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const [postRes, sourcesRes, faqsRes, relatedRes, categoriesRes, authorsRes, doctorsRes, servicesRes, postsRes] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).single(),
    supabase.from("blog_post_sources").select("title, url").eq("post_id", id).order("sort_order"),
    supabase.from("blog_post_faqs").select("question, answer").eq("post_id", id).order("sort_order"),
    supabase.from("blog_post_related").select("related_post_id").eq("post_id", id).order("sort_order"),
    supabase.from("blog_categories").select("*").eq("status", "active").order("sort_order"),
    supabase.from("blog_authors").select("*").eq("status", "active").order("name_ar"),
    supabase.from("doctors").select("*").eq("status", "active").order("display_order"),
    supabase.from("services").select("id, title").eq("status", "active"),
    supabase.from("blog_posts").select("id, title").eq("status", "published").neq("id", id),
  ]);

  if (postRes.error || !postRes.data) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">تعديل المقال</h1>
      <p className="text-slate-500 mb-8">{postRes.data.title}</p>
      <PostForm
        postId={id}
        initial={{
          ...postRes.data,
          sources: sourcesRes.data ?? [],
          faqs: faqsRes.data ?? [],
          related_post_ids: (relatedRes.data ?? []).map((r) => r.related_post_id),
        }}
        categories={categoriesRes.data ?? []}
        authors={authorsRes.data ?? []}
        doctors={doctorsRes.data ?? []}
        services={servicesRes.data?.length ? servicesRes.data : staticServices.map((s) => ({ id: s.id, title: s.title }))}
        otherPublishedPosts={postsRes.data ?? []}
      />
    </div>
  );
}
