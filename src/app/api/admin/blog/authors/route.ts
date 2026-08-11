import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { slugify } from "@/lib/blog-utils";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("blog_authors").select("*").order("name_ar");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name_ar?.trim()) {
    return NextResponse.json({ error: "اسم الكاتب مطلوب" }, { status: 400 });
  }
  const supabase = supabaseServer();
  const slug = (body.slug?.trim() || slugify(body.name_ar)) as string;

  const { data: existing } = await supabase.from("blog_authors").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل، اختر رابطًا آخر" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("blog_authors")
    .insert({
      name_ar: body.name_ar,
      name_en: body.name_en ?? null,
      slug,
      role: body.role ?? null,
      specialty: body.specialty ?? null,
      credentials: body.credentials ?? null,
      bio: body.bio ?? null,
      image_url: body.image_url ?? null,
      image_alt: body.image_alt ?? null,
      profile_url: body.profile_url ?? null,
      linked_doctor_id: body.linked_doctor_id ?? null,
      status: body.status ?? "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
