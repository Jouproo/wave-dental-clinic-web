export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import CategoriesManager from "./CategoriesManager";

export default async function BlogCategoriesPage() {
  const supabase = supabaseServer();
  const { data } = await supabase.from("blog_categories").select("*").order("sort_order");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">تصنيفات المدونة</h1>
      <p className="text-slate-500 mb-8">إدارة تصنيفات مقالات المدونة</p>
      <CategoriesManager initial={data ?? []} />
    </div>
  );
}
