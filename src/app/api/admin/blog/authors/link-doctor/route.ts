import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { slugify } from "@/lib/blog-utils";

/**
 * Find-or-create the blog_authors row linked to a given doctor, so the
 * post editor can offer registered doctors directly as author/reviewer
 * options without the admin having to pre-create a byline in
 * /admin/blog/authors first.
 */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const doctorId = body.doctor_id as string | undefined;
  if (!doctorId) {
    return NextResponse.json({ error: "doctor_id مطلوب" }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: existing } = await supabase
    .from("blog_authors")
    .select("*")
    .eq("linked_doctor_id", doctorId)
    .maybeSingle();
  if (existing) return NextResponse.json(existing);

  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", doctorId)
    .single();
  if (doctorError || !doctor) {
    return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });
  }

  const baseSlug = slugify(doctor.name);
  let slug = baseSlug;
  for (let i = 2; i <= 50; i++) {
    const { data: clash } = await supabase.from("blog_authors").select("id").eq("slug", slug).maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data, error } = await supabase
    .from("blog_authors")
    .insert({
      name_ar: doctor.name,
      slug,
      specialty: doctor.specialty,
      bio: doctor.bio,
      image_url: doctor.image_url,
      linked_doctor_id: doctor.id,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
