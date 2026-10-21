export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { resolveScope, applyScope } from "@/lib/crm-scope";
import { Users, Flame, CheckCircle2, CalendarCheck, Stethoscope, Clock, AlertCircle } from "lucide-react";

export default async function CrmOverviewPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const supabase = supabaseServer();
  const scope = await resolveScope(session, "crm");
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const startOfTomorrow = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();

  /* eslint-disable @typescript-eslint/no-explicit-any -- Supabase's filter-builder generics don't compose cleanly through a reusable callback, and TS's inference through applyScope()'s generic blows up here; this stays server-internal to this page. */
  async function count(extra?: (q: any) => any): Promise<number> {
    const base: any = applyScope(supabase.from("leads").select("id", { count: "exact", head: true }).is("archived_at", null), scope);
    const q = extra ? extra(base) : base;
    const { count: c } = await q;
    return c ?? 0;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const [total, hot, qualified, examBooked, treatmentStarted, overdue, today] = await Promise.all([
    count(),
    count((q) => q.eq("classification", "Hot")),
    count((q) => q.eq("qualification_status", "qualified")),
    count((q) => q.eq("stage", "exam_booked")),
    count((q) => q.eq("stage", "treatment_started")),
    count((q) => q.lt("next_follow_up_at", startOfToday)),
    count((q) => q.gte("next_follow_up_at", startOfToday).lt("next_follow_up_at", startOfTomorrow)),
  ]);

  const cards = [
    { label: "إجمالي الليدز", value: total, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "🔥 Hot", value: hot, icon: Flame, color: "text-red-600 bg-red-50" },
    { label: "مؤهل", value: qualified, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "اتحجز كشف", value: examBooked, icon: CalendarCheck, color: "text-purple-600 bg-purple-50" },
    { label: "بدأ العلاج", value: treatmentStarted, icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
    { label: "متابعات متأخرة", value: overdue, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
    { label: "متابعات النهارده", value: today, icon: Clock, color: "text-sky-600 bg-sky-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">نظرة عامة — CRM</h1>
        <p className="text-slate-500 mt-1">
          {session.role === "admin" ? "كل العملاء المحتملين" : session.role === "sales_manager" ? "عملاء فريقك" : "عملاؤك"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-800">{c.value}</div>
            <div className="text-slate-500 text-sm mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
