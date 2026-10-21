export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { getLeadForSession } from "@/lib/crm-leads";
import { supabaseServer } from "@/lib/supabase";
import LeadDetail from "./LeadDetail";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !sessionHasPermission(session, "crm.read")) redirect("/admin/login");

  const lead = await getLeadForSession(id, session);
  if (!lead) notFound();

  const supabase = supabaseServer();
  const [branchesRes, usersRes] = await Promise.all([
    supabase.from("branches").select("id, name").eq("is_active", true),
    sessionHasPermission(session, "crm.assign")
      ? supabase.from("admin_users").select("id, name, email").eq("status", "active")
      : Promise.resolve({ data: [] as { id: string; name: string; email: string }[] }),
  ]);

  return (
    <LeadDetail
      lead={lead}
      canAssign={sessionHasPermission(session, "crm.assign")}
      branches={branchesRes.data ?? []}
      assignableUsers={usersRes.data ?? []}
    />
  );
}
