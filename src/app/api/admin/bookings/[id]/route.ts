import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("booking_requests").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.status === "string") update.status = body.status;
  if (typeof body.diagnosis_notes === "string") update.diagnosis_notes = body.diagnosis_notes;
  if (typeof body.diagnosed_by === "string" || body.diagnosed_by === null) update.diagnosed_by = body.diagnosed_by;
  if (body.mark_diagnosed) {
    update.status = "diagnosed";
    update.diagnosed_at = new Date().toISOString();
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("booking_requests")
    .update(update)
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

  // Clean up any uploaded X-rays from the private bucket along with the row.
  const { data: row } = await supabase.from("booking_requests").select("xray_paths").eq("id", id).single();
  if (row?.xray_paths?.length) {
    await supabase.storage.from("patient-uploads").remove(row.xray_paths);
  }

  const { error } = await supabase.from("booking_requests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
