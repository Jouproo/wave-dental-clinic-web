import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const { name, password } = await req.json();
  const updates: Record<string, string> = {};

  if (name?.trim()) updates.name = name.trim();
  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    }
    updates.password_hash = await hashPassword(password);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("admin_users")
    .update(updates)
    .eq("id", id)
    .select("id, email, name, role, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseServer();

  // Don't allow deleting the last admin
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: "لا يمكن حذف آخر مسؤول" }, { status: 400 });
  }

  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
