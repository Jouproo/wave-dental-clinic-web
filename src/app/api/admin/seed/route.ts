import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { doctors } from "@/data/doctors";
import { services } from "@/data/services";

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const supabase = supabaseServer();

  // Seed doctors (skip if already exist)
  const { count: docCount } = await supabase
    .from("doctors")
    .select("*", { count: "exact", head: true });

  if (docCount === 0) {
    const doctorRows = doctors.map((d, i) => ({
      name: d.name,
      specialty: d.specialty,
      bio: d.bio,
      image_url: null,
      experience: d.experience,
      whatsapp: "",
      status: "active" as const,
      display_order: i,
    }));
    await supabase.from("doctors").insert(doctorRows);
  }

  // Seed services (skip if already exist)
  const { count: svcCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true });

  if (svcCount === 0) {
    const serviceRows = services.map((s, i) => ({
      id: s.id,
      icon: s.icon,
      title: s.title,
      description: s.description,
      short_cta: s.shortCta,
      detail_description: "",
      status: "active" as const,
      display_order: i,
    }));
    await supabase.from("services").insert(serviceRows);
  }

  return NextResponse.json({ ok: true, message: "تم البذر بنجاح" });
}
