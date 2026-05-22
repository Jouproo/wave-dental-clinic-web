import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

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
    .from("services")
    .insert({
      id: body.id,
      icon: body.icon ?? "Smile",
      title: body.title,
      description: body.description ?? "",
      short_cta: body.short_cta ?? "اعرف أكثر",
      detail_description: body.detail_description ?? "",
      status: body.status ?? "active",
      display_order: body.display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
