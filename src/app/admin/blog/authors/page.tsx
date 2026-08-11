export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import AuthorsManager from "./AuthorsManager";

export default async function BlogAuthorsPage() {
  const supabase = supabaseServer();
  const [authorsRes, doctorsRes] = await Promise.all([
    supabase.from("blog_authors").select("*").order("name_ar"),
    supabase.from("doctors").select("id, name, specialty, image_url").eq("status", "active"),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">الكتّاب والمراجعون الطبيون</h1>
      <p className="text-slate-500 mb-8">إدارة هوية كتّاب المقالات والأطباء المراجعين طبيًا</p>
      <AuthorsManager initial={authorsRes.data ?? []} doctors={doctorsRes.data ?? []} />
    </div>
  );
}
