import { NextResponse } from "next/server";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

/** Lookup data the CRM UI needs for dropdowns — branches, assignable team members, services. */
export async function GET() {
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.read")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const supabase = supabaseServer();

  const [branchesRes, servicesRes] = await Promise.all([
    supabase.from("branches").select("id, name, slug, is_active").eq("is_active", true).order("name"),
    supabase.from("services").select("id, title").eq("status", "active").order("display_order"),
  ]);

  let assignableUsers: { id: string; name: string; email: string; role: string }[] = [];
  if (session.role === "admin") {
    const { data } = await supabase.from("admin_users").select("id, name, email, role").eq("status", "active").order("name");
    assignableUsers = data ?? [];
  } else if (session.role === "sales_manager") {
    const { data } = await supabase
      .from("admin_users")
      .select("id, name, email, role")
      .eq("status", "active")
      .or(`id.eq.${session.userId},manager_id.eq.${session.userId}`)
      .order("name");
    assignableUsers = data ?? [];
  }
  // sales_agent gets no assignable-users list — they can't reassign leads.

  return NextResponse.json({
    branches: branchesRes.data ?? [],
    services: servicesRes.data ?? [],
    assignableUsers,
  });
}
