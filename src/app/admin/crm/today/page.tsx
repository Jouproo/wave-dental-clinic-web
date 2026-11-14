export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { crmContext, loadLeadRows, loadStaff, type LeadRow } from "@/lib/crm-stats";
import { CLOSED_STAGES, CLASSIFICATION_TONES, addDays, dayStart, fmtDay, fmtTime, relDay, stageLabel, stageTone, ymdInTz } from "@/lib/crm-config";
import { Badge, ContactActions, Kpi } from "../components/ui";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { who } = await searchParams;
  const { scope, config, today } = await crmContext(session);
  const tz = config.timezone;
  const [rows, staff] = await Promise.all([loadLeadRows(scope), loadStaff()]);

  const t0 = dayStart(today, tz).getTime();
  const t1 = dayStart(addDays(today, 1), tz).getTime();
  const t2 = dayStart(addDays(today, 2), tz).getTime();
  const t8 = dayStart(addDays(today, 8), tz).getTime();
  const manager = scope.kind !== "own";

  let open = rows.filter((r) => !r.archived_at && !CLOSED_STAGES.includes(r.stage));
  const assignees = manager ? [...new Set(open.map((r) => r.assigned_to ?? ""))] : [];
  if (manager && who) open = open.filter((r) => (who === "none" ? !r.assigned_to : r.assigned_to === who));

  const at = (r: LeadRow) => Date.parse(r.next_follow_up_at!);
  const withDue = open.filter((r) => r.next_follow_up_at).sort((a, b) => at(a) - at(b));
  const groups = [
    { key: "overdue", title: "متأخرة", tone: "red", items: withDue.filter((r) => at(r) < t0) },
    { key: "today", title: "النهارده", tone: "blue", items: withDue.filter((r) => at(r) >= t0 && at(r) < t1) },
    { key: "tomorrow", title: "بكرة", tone: "sky", items: withDue.filter((r) => at(r) >= t1 && at(r) < t2) },
    { key: "week", title: "الأسبوع الجاي", tone: "slate", items: withDue.filter((r) => at(r) >= t2 && at(r) < t8) },
  ];
  const noDate = open.filter((r) => !r.next_follow_up_at).length;

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>متابعات اليوم</h1>
          <p>العملاء المفتوحين اللي ليهم موعد متابعة · النهارده {fmtDay(today, today)}</p>
        </div>
        {manager && (
          <form method="get" className="flex gap-2 items-center">
            <select name="who" defaultValue={who ?? ""} className="input w-auto py-2">
              <option value="">كل الفريق</option>
              <option value="none">بدون مسؤول</option>
              {assignees.filter(Boolean).map((id) => <option key={id} value={id}>{staff.get(id) ?? "—"}</option>)}
            </select>
            <button className="crm-btn crm-btn-outline crm-btn-sm">عرض</button>
          </form>
        )}
      </div>

      <div className="kpis">
        {groups.map((g) => (
          <Kpi key={g.key} label={g.title} value={g.items.length} variant={g.key === "overdue" && g.items.length ? "alert" : g.key === "today" ? "focus" : undefined} href={`#${g.key}`} />
        ))}
      </div>

      {groups.map((g) => g.items.length > 0 && (
        <section key={g.key} id={g.key} className="crm-card">
          <div className="card-head"><h2><Badge tone={g.tone}>{g.title}</Badge> <span className="text-slate-400 font-bold text-sm">({g.items.length})</span></h2></div>
          <ul className="crm-list">
            {g.items.map((r) => {
              const ymd = ymdInTz(r.next_follow_up_at!, tz);
              return (
                <li key={r.id} className="fu-row">
                  <Link href={`/admin/crm/leads/${r.id}`}>
                    <span className="who">
                      <b>{r.name || "بدون اسم"}</b>
                      <small>
                        <span dir="ltr">{r.lead_code}</span>
                        {r.service_interest ? ` · ${r.service_interest}` : ""}
                        {manager ? ` · ${r.assigned_to ? staff.get(r.assigned_to) ?? "—" : "بدون مسؤول"}` : ""}
                        {r.contact_attempts ? ` · ${r.contact_attempts} محاولة` : ""}
                        {r.last_call_result ? ` · آخر نتيجة: ${r.last_call_result}` : ""}
                      </small>
                    </span>
                    <span className="hidden sm:flex gap-1.5">
                      <Badge tone={stageTone(config, r.stage)}>{stageLabel(config, r.stage)}</Badge>
                      <Badge tone={CLASSIFICATION_TONES[r.classification]} flat>{r.classification}</Badge>
                    </span>
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap text-left">
                      {g.key === "today" ? fmtTime(r.next_follow_up_at!, tz) : `${fmtDay(ymd, today)} · ${relDay(ymd, today)}`}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                  <ContactActions phone={r.mobile_normalized || r.mobile_raw} waPhone={r.whatsapp_normalized || r.mobile_normalized} chatUrl={r.whatsapp_chat_url || r.meta_chat_url} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {groups.every((g) => g.items.length === 0) && (
        <div className="crm-empty"><b className="text-lg text-[var(--navy)]">مفيش متابعات مجدولة 🎉</b><span>حدد «موعد المتابعة الجاية» من صفحة العميل عشان يظهر هنا.</span></div>
      )}

      {noDate > 0 && (
        <p className="def">
          فيه <b>{noDate.toLocaleString("en")}</b> عميل مفتوح من غير موعد متابعة — مش هيظهروا هنا لحد ما يتحدد لهم موعد.
        </p>
      )}
    </>
  );
}
