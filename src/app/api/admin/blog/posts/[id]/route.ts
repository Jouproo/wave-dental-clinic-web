import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { buildPostFields, syncChildren } from "@/lib/blog-admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = supabaseServer();
  const [postRes, sourcesRes, faqsRes, relatedRes] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*, category:blog_categories!category_id(*), author:blog_authors!author_id(*), reviewer:blog_authors!reviewer_id(*)")
      .eq("id", id)
      .single(),
    supabase.from("blog_post_sources").select("*").eq("post_id", id).order("sort_order"),
    supabase.from("blog_post_faqs").select("*").eq("post_id", id).order("sort_order"),
    supabase.from("blog_post_related").select("related_post_id").eq("post_id", id).order("sort_order"),
  ]);

  if (postRes.error) return NextResponse.json({ error: postRes.error.message }, { status: 404 });

  return NextResponse.json({
    ...postRes.data,
    sources: sourcesRes.data ?? [],
    faqs: faqsRes.data ?? [],
    related_post_ids: (relatedRes.data ?? []).map((r) => r.related_post_id),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = supabaseServer();

  const { data: current, error: fetchError } = await supabase
    .from("blog_posts")
    .select("slug, status, published_at, updated_at")
    .eq("id", id)
    .single();
  if (fetchError || !current) {
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  }

  // Optimistic concurrency — if the client loaded an older version, refuse.
  if (body.expected_updated_at && body.expected_updated_at !== current.updated_at) {
    return NextResponse.json(
      { error: "تم تعديل هذا المقال من مكان آخر منذ فتحك له. أعد تحميل الصفحة قبل الحفظ." },
      { status: 409 }
    );
  }

  const fields = buildPostFields(body, current.slug);

  if (fields.slug && fields.slug !== current.slug) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", fields.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل، اختر رابطًا آخر" }, { status: 409 });
    }
  }

  const published_at =
    fields.status === "published" && !current.published_at ? new Date().toISOString() : undefined;

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({
      ...fields,
      ...(published_at ? { published_at } : {}),
      ...(body.updated_by ? { updated_by: body.updated_by } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncChildren(id, body);
  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = supabaseServer();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
