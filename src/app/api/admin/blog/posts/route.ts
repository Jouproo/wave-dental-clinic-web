import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { buildPostFields, syncChildren } from "@/lib/blog-admin";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const supabase = supabaseServer();
  const sp = req.nextUrl.searchParams;
  const page = parseInt(sp.get("page") ?? "1", 10) || 1;
  const perPage = parseInt(sp.get("per_page") ?? "20", 10) || 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const sortBy = sp.get("sort") ?? "created_at";
  const sortDir = sp.get("dir") === "asc";

  let query = supabase
    .from("blog_posts")
    .select("*, category:blog_categories!category_id(*), author:blog_authors!author_id(*)", { count: "exact" })
    .order(sortBy, { ascending: sortDir })
    .range(from, to);

  const status = sp.get("status");
  if (status) query = query.eq("status", status);
  const category = sp.get("category_id");
  if (category) query = query.eq("category_id", category);
  const author = sp.get("author_id");
  if (author) query = query.eq("author_id", author);
  const search = sp.get("search");
  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "عنوان المقال مطلوب" }, { status: 400 });
  }
  const supabase = supabaseServer();
  const fields = buildPostFields(body);

  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", fields.slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل، اختر رابطًا آخر" }, { status: 409 });
  }

  const published_at = fields.status === "published" ? new Date().toISOString() : null;

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({ ...fields, published_at })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncChildren(post.id, body);
  return NextResponse.json(post, { status: 201 });
}
