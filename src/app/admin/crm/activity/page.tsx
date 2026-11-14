export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { crmContext, loadStaff } from "@/lib/crm-stats";
import { fmtStamp, stageLabel, stageTone } from "@/lib/crm-config";
import { Badge } from "../components/ui";

const PAGE = 50;

interface Row {
  id: string; lead_id: string; from_stage: string | null; to_stage: string; changed_by: string | null; changed_at: string; reason: string | null;
  leads: { name: string; lead_code: string } | null;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string; who?: string; kind?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { scope, config } = await crmContext(session);
  const staff = await loadStaff();

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- builder generics */
  let q: any = supabaseServer().from("lead_stage_history")
    .select("id, lead_id, from_stage, to_stage, changed_by, changed_at, reason, leads!inner(name, lead_code, assigned_to)", { count: "exact" });
  if (scope.kind === "own") q = q.eq("leads.assigned_to", scope.userId);
  if (scope.kind === "team") q = q.in("leads.assigned_to", scope.userIds);
  if (sp.who) q = q.eq("changed_by", sp.who);
  if (sp.kind === "moves") q = q.not("from_stage", "is", null);
  if (sp.kind === "created") q = q.is("from_stage", null);
  const { data, count, error } = await q.order("changed_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const rows = (data ?? []) as Row[];
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.who ? { who: sp.who } : {}), ...(sp.kind ? { kind: sp.kind } : {}), page: String(p) })}`;

  return (
    <>
      <div className="crm-head">
        <div><h1>سجل النشاط</h1><p>كل تغيير مرحلة حصل للعملاء — مين غيّره وإمتى. {count != null && `${count.toLocaleString("en")} حدث`}</p></div>
        <form method="get" className="flex flex-wrap gap-2 items-center">
          <select name="kind" defaultValue={sp.kind ?? ""} className="input w-auto py-2">
            <option value="">كل الأحداث</option>
            <option value="moves">تغيير مرحلة بس</option>
            <option value="created">إضافة / استيراد بس</option>
          </select>
          {scope.kind !== "own" && (
            <select name="who" defaultValue={sp.who ?? ""} className="input w-auto py-2">
              <option value="">كل الفريق</option>
              {[...staff.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          <button className="crm-btn crm-btn-outline crm-btn-sm">تصفية</button>
        </form>
      </div>

      {error ? <p className="crm-alert err">تعذّر تحميل السجل: {error.message}</p> : rows.length === 0 ? (
        <div className="crm-empty"><b className="text-lg text-[var(--navy)]">مفيش نشاط</b></div>
      ) : (
        <section className="crm-card p-0 overflow-hidden">
          <ul className="crm-list">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3">
                <Link href={`/admin/crm/leads/${r.lead_id}`} className="min-w-0 flex-1 basis-56">
                  <b className="text-[var(--navy)] hover:underline">{r.leads?.name || "بدون اسم"}</b>{" "}
                  <small className="text-slate-400" dir="ltr">{r.leads?.lead_code}</small>
                  {r.reason && <small className="block text-slate-500 truncate">{r.reason}</small>}
                </Link>
                <span className="flex items-center gap-1.5">
                  {r.from_stage ? <Badge tone={stageTone(config, r.from_stage)}>{stageLabel(config, r.from_stage)}</Badge> : <Badge tone="slate" flat>جديد في النظام</Badge>}
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                  <Badge tone={stageTone(config, r.to_stage)}>{stageLabel(config, r.to_stage)}</Badge>
                </span>
                <span className="text-xs text-slate-500 whitespace-nowrap basis-40 text-left">
                  {r.changed_by ? staff.get(r.changed_by) ?? "—" : "النظام"} · {fmtStamp(r.changed_at, config.timezone)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-between items-center text-sm text-slate-500">
        <span>صفحة {page}</span>
        <span className="flex gap-2">
          {page > 1 && <Link className="crm-btn crm-btn-outline crm-btn-sm" href={qs(page - 1)}>الأحدث</Link>}
          {rows.length === PAGE && <Link className="crm-btn crm-btn-outline crm-btn-sm" href={qs(page + 1)}>الأقدم</Link>}
        </span>
      </div>
    </>
  );
}
