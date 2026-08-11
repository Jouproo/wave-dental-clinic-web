import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { slugify } from "@/lib/blog-utils";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("blog_categories").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });
  }
  const supabase = supabaseServer();
  const slug = (body.slug?.trim() || slugify(body.name)) as string;

  const { data: existing } = await supabase.from("blog_categories").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل، اختر رابطًا آخر" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("blog_categories")
    .insert({
      name: body.name,
      slug,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      status: body.status ?? "active",
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
