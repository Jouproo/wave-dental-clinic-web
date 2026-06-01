import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { email, name, password } = await req.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: "البريد الإلكتروني والاسم وكلمة المرور مطلوبة" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("admin_users")
    .insert({ email: email.toLowerCase().trim(), name: name.trim(), password_hash: passwordHash })
    .select("id, email, name, role, created_at")
    .single();

  if (error) {
    const msg = error.message.includes("duplicate") ? "هذا البريد الإلكتروني مسجل مسبقًا" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
