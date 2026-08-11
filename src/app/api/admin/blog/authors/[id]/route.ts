import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = supabaseServer();

  if (body.slug) {
    const { data: existing } = await supabase
      .from("blog_authors")
      .select("id")
      .eq("slug", body.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل، اختر رابطًا آخر" }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from("blog_authors")
    .update({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      role: body.role,
      specialty: body.specialty,
      credentials: body.credentials,
      bio: body.bio,
      image_url: body.image_url,
      image_alt: body.image_alt,
      profile_url: body.profile_url,
      linked_doctor_id: body.linked_doctor_id,
      status: body.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = supabaseServer();
  const { error } = await supabase.from("blog_authors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
