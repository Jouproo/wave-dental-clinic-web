import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("clinic_settings")
    .update({
      phone: body.phone,
      whatsapp: body.whatsapp,
      address: body.address,
      working_hours: body.working_hours,
      google_maps_embed_url: body.google_maps_embed_url,
      google_maps_direction_url: body.google_maps_direction_url,
      facebook_url: body.facebook_url,
      instagram_url: body.instagram_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
