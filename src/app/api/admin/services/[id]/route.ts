import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("services")
    .update({
      icon: body.icon,
      title: body.title,
      description: body.description,
      short_cta: body.short_cta,
      detail_description: body.detail_description,
      status: body.status,
      display_order: body.display_order,
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
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
