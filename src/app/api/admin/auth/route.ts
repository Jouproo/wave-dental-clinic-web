import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, setAdminCookie, clearAdminCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!password) {
    return NextResponse.json({ error: "أدخل كلمة المرور" }, { status: 400 });
  }

  // Try DB-based admin users first
  try {
    const supabase = supabaseServer();
    const { data: users, error } = await supabase
      .from("admin_users")
      .select("id, email, password_hash");

    if (!error && users && users.length > 0) {
      // DB mode: require email
      if (!email) {
        return NextResponse.json({ error: "أدخل البريد الإلكتروني" }, { status: 400 });
      }
      const user = users.find((u) => u.email === email.toLowerCase().trim());
      if (!user) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }
      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }
      const token = await createAdminToken();
      await setAdminCookie(token);
      return NextResponse.json({ ok: true });
    }
  } catch {
    // table may not exist yet — fall through to env-var fallback
  }

  // Env-var fallback (legacy / first-time setup)
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "لم يتم إعداد أي حساب إداري بعد. راجع إعدادات الخادم." },
      { status: 500 }
    );
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const token = await createAdminToken();
  await setAdminCookie(token);
  return NextResponse.json({ ok: true, legacy: true });
}

export async function DELETE() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
