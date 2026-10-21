import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

const VALID_ROLES = ["admin", "sales_manager", "sales_agent"];
const VALID_STATUSES = ["active", "disabled"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const { name, password, role, status, manager_id, allowed_branch_ids } = await req.json();
  const updates: Record<string, unknown> = {};

  if (name?.trim()) updates.name = name.trim();
  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    }
    updates.password_hash = await hashPassword(password);
  }
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
    updates.role = role;
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    updates.status = status;
  }
  if (manager_id !== undefined) updates.manager_id = manager_id || null;
  if (allowed_branch_ids !== undefined) updates.allowed_branch_ids = Array.isArray(allowed_branch_ids) ? allowed_branch_ids : [];

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
  }

  const supabase = supabaseServer();

  // Don't allow demoting/disabling the last active admin.
  if (role !== undefined || status !== undefined) {
    const { data: target } = await supabase.from("admin_users").select("role, status").eq("id", id).single();
    const becomingNonAdmin = role !== undefined && role !== "admin" && target?.role === "admin";
    const becomingDisabled = status !== undefined && status === "disabled" && target?.status === "active";
    if (becomingNonAdmin || becomingDisabled) {
      const { count } = await supabase
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("status", "active");
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: "لا يمكن تعديل آخر حساب أدمن نشط" }, { status: 400 });
      }
    }
  }

  const { data, error } = await supabase
    .from("admin_users")
    .update(updates)
    .eq("id", id)
    .select("id, email, name, role, status, allowed_branch_ids, extra_permissions, manager_id, scope_override, created_at")
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

  const { data: target } = await supabase.from("admin_users").select("role").eq("id", id).single();

  if (target?.role === "admin") {
    const { count } = await supabase
      .from("admin_users")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "لا يمكن حذف آخر حساب أدمن" }, { status: 400 });
    }
  }

  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
