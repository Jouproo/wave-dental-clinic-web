import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get("service_id");
  const supabase = supabaseServer();
  let query = supabase.from("gallery").select("*").order("display_order", { ascending: true });
  if (serviceId) query = query.eq("service_id", serviceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const body = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("gallery")
    .insert({
      service_id: body.service_id,
      before_image_url: body.before_image_url ?? null,
      after_image_url: body.after_image_url ?? null,
      caption: body.caption ?? "",
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
