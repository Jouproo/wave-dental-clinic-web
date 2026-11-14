export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Plus, Upload } from "lucide-react";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { crmContext, loadLeadRows, loadStageMoves, countBy, type LeadRow } from "@/lib/crm-stats";
import { ALL_STAGES, CLOSED_STAGES, WON_STAGES, CLASSIFICATION_TONES, addDays, dayStart, fmtDay, fmtTime, stageLabel, stageTone, ymdInTz } from "@/lib/crm-config";
import { CLASSIFICATION_LABELS } from "@/lib/crm-labels";
import { Badge, Bars, ContactActions, Kpi, leadsHref } from "./components/ui";

export default async function CrmDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { scope, config, today } = await crmContext(session);
  const tz = config.timezone;

  let rows: LeadRow[];
  try {
    rows = await loadLeadRows(scope);
  } catch (e) {
    return <p className="crm-alert err">تعذّر تحميل بيانات CRM: {(e as Error).message}</p>;
  }

  const todayStart = dayStart(today, tz).getTime();
  const tomorrowStart = dayStart(addDays(today, 1), tz).getTime();
  const from30 = addDays(today, -29);
  const active = rows.filter((r) => !r.archived_at);
  const open = active.filter((r) => !CLOSED_STAGES.includes(r.stage));
  const due = (r: LeadRow) => (r.next_follow_up_at ? Date.parse(r.next_follow_up_at) : null);
  const overdue = open.filter((r) => { const d = due(r); return d != null && d < todayStart; });
  const dueToday = open.filter((r) => { const d = due(r); return d != null && d >= todayStart && d < tomorrowStart; });
  const unassigned = active.filter((r) => !r.assigned_to);
  const review = active.filter((r) => r.needs_review);
  const new30 = rows.filter((r) => r.entry_date >= from30 && r.entry_date <= today);
  const staleTo = addDays(today, -config.stale_days);
  const stale = active.filter((r) => r.stage === "new" && r.entry_date <= staleTo);
  const archived = rows.length - active.length;

  const moves = await loadStageMoves(scope, dayStart(from30, tz).toISOString(), new Date(tomorrowStart).toISOString());
  const moved = (stage: string) => new Set(moves.filter((m) => m.to_stage === stage).map((m) => m.lead_id)).size;

  const cohortWon = new30.filter((r) => WON_STAGES.includes(r.stage)).length;
  const conv = new30.length ? Math.round((cohortWon / new30.length) * 1000) / 10 : null;

  const tasks = [...overdue, ...dueToday].sort((a, b) => (due(a) ?? 0) - (due(b) ?? 0)).slice(0, 8);
  const byStage = countBy(active, (r) => r.stage, ALL_STAGES);
  const byClass = countBy(active, (r) => r.classification, ["Hot", "Warm", "Cold"]);
  const bySource = countBy(active, (r) => r.source).sort((a, b) => b.count - a.count);
  const canImport = sessionHasPermission(session, "crm.import");
  const isLead = scope.kind === "all";

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>لوحة CRM</h1>
          <p>{isLead ? "كل العملاء" : "عملاؤك المسندون إليك"} · النهارده {fmtDay(today, today)} ({tz})</p>
        </div>
        <div className="flex gap-2">
          {canImport && <Link className="crm-btn crm-btn-outline" href="/admin/crm/import"><Upload className="w-4 h-4" /> استيراد</Link>}
          <Link className="crm-btn crm-btn-blue" href="/admin/crm/leads/new"><Plus className="w-4 h-4" /> عميل</Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="crm-empty">
          <b className="text-lg text-[var(--navy)]">لا يوجد عملاء بعد</b>
          <span>{canImport ? "ابدأ باستيراد ملف Excel أو أضف عميلًا يدويًا." : "لم يُسند إليك أي عميل بعد."}</span>
          {canImport && <Link className="crm-btn crm-btn-blue crm-btn-sm" href="/admin/crm/import"><Upload className="w-4 h-4" /> استيراد ملف العملاء</Link>}
        </div>
      ) : (
        <>
          <div className="kpis">
            <Kpi label="متابعات النهارده" value={dueToday.length} hint="موعدها النهارده" href="/admin/crm/today" variant="focus" />
            <Kpi label="متأخرة" value={overdue.length} hint="فات موعدها (غير المغلقين فقط)" href="/admin/crm/today" variant={overdue.length ? "alert" : undefined} />
            <Kpi label="بدون مسؤول" value={unassigned.length} hint="عملاء نشطين مش متوزعين" href={leadsHref({ unassigned: "1" })} variant={unassigned.length ? "warn" : undefined} />
            <Kpi label="تحتاج مراجعة" value={review.length} hint="نقص بيانات من الاستيراد" href={leadsHref({ needs_review: "1" })} variant={review.length ? "warn" : undefined} />
            <Kpi label="إجمالي العملاء" value={active.length} hint={archived ? `+ ${archived} في الأرشيف` : undefined} href={leadsHref()} />
            <Kpi label="جدد آخر 30 يوم" value={new30.length} hint="حسب تاريخ الدخول" href={leadsHref({ date_from: from30, date_to: today })} />
            <Kpi label={stageLabel(config, "exam_booked")} value={byStage.find((s) => s.key === "exam_booked")?.count ?? 0} hint={`${moved("exam_booked")} حجز اتسجل خلال 30 يوم`} href={leadsHref({ stage: "exam_booked" })} />
            <Kpi label={stageLabel(config, "treatment_started")} value={byStage.find((s) => s.key === "treatment_started")?.count ?? 0} hint={`${moved("treatment_started")} اتسجلوا خلال 30 يوم`} href={leadsHref({ stage: "treatment_started" })} variant="good" />
          </div>

          <div className="crm-two">
            <section className="crm-card">
              <div className="card-head"><h2>متابعات مستحقة</h2><Link className="card-link" href="/admin/crm/today">كل المتابعات</Link></div>
              {tasks.length === 0 ? <p className="text-sm text-slate-500">مفيش متابعات مستحقة النهارده 🎉</p> : (
                <ul className="crm-list">
                  {tasks.map((t) => {
                    const late = (due(t) ?? 0) < todayStart;
                    const dueYmd = ymdInTz(t.next_follow_up_at!, tz);
                    return (
                      <li key={t.id} className="fu-row">
                        <Link href={`/admin/crm/leads/${t.id}`}>
                          <span className="who">
                            <b>{t.name || "بدون اسم"}</b>
                            <small><span dir="ltr">{t.lead_code}</span> · {stageLabel(config, t.stage)}{t.last_call_result ? ` · ${t.last_call_result}` : ""}</small>
                          </span>
                          <Badge tone={late ? "red" : "blue"}>{late ? `متأخرة · ${fmtDay(dueYmd, today)}` : `النهارده ${fmtTime(t.next_follow_up_at!, tz)}`}</Badge>
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </Link>
                        <ContactActions phone={t.mobile_normalized || t.mobile_raw} waPhone={t.whatsapp_normalized || t.mobile_normalized} chatUrl={t.whatsapp_chat_url || t.meta_chat_url} compact />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="crm-card">
              <div className="card-head"><h2>توزيع العملاء على المراحل</h2><Link className="card-link" href="/admin/crm/reports">التقارير</Link></div>
              <Bars items={byStage.map((b) => ({ label: stageLabel(config, b.key), count: b.count, tone: stageTone(config, b.key), href: leadsHref({ stage: b.key }) }))} />
              <p className="def">الوضع الحالي للعملاء النشطين (من غير الأرشيف).</p>
            </section>
          </div>

          <div className="crm-two">
            <section className="crm-card">
              <h2>التصنيف</h2>
              <Bars total={active.length} items={byClass.map((b) => ({ label: CLASSIFICATION_LABELS[b.key as "Hot"] ?? b.key, count: b.count, tone: CLASSIFICATION_TONES[b.key], href: leadsHref({ classification: b.key }) }))} />
            </section>
            <section className="crm-card">
              <h2>المصادر</h2>
              <Bars total={active.length} items={bySource.slice(0, 8).map((b) => ({ label: b.key || "غير محدد", count: b.count, tone: "navy", href: b.key ? leadsHref({ source: b.key }) : undefined }))} />
            </section>
          </div>

          <div className="crm-two">
            <section className="crm-card">
              <div className="card-head"><h2>معدل التحويل (آخر 30 يوم)</h2><Link className="card-link" href="/admin/crm/reports">تفاصيل</Link></div>
              <p className="text-3xl font-extrabold text-[var(--navy)]">{conv == null ? "—" : `${conv}%`}</p>
              <p className="def">
                من العملاء اللي دخلوا من {fmtDay(from30, today)} لـ {fmtDay(today, today)} (المقام = {new30.length})، كام واحد مرحلته دلوقتي
                «{stageLabel(config, "treatment_started")}» أو «{stageLabel(config, "completed")}» (البسط = {cohortWon}).
              </p>
            </section>
            <section className="crm-card">
              <h2>عملاء محتاجين قرار</h2>
              <Bars items={[
                { label: `جديد من +${config.stale_days} يوم`, count: stale.length, tone: "orange", href: leadsHref({ stage: "new", date_to: staleTo, sort: "entry_asc" }) },
                { label: stageLabel(config, "no_answer"), count: byStage.find((s) => s.key === "no_answer")?.count ?? 0, tone: stageTone(config, "no_answer"), href: leadsHref({ stage: "no_answer" }) },
                { label: "في الأرشيف", count: archived, tone: "slate", href: leadsHref({ view: "archived" }) },
              ]} />
              <p className="def">العملاء الجداد اللي محدش كلمهم من أكتر من {config.stale_days} يوم: قرر حملة إعادة تواصل أو أرشفة. المدة دي بتتغير من الإعدادات.</p>
            </section>
          </div>
        </>
      )}
    </>
  );
}
