export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { crmContext, loadLeadRows, loadStageMoves, loadStaff, countBy, type LeadRow } from "@/lib/crm-stats";
import { ALL_STAGES, CLASSIFICATION_TONES, CLOSED_STAGES, QUALIFICATION_TONES, WON_STAGES, addDays, dayStart, daysBetween, fmtDay, stageLabel, stageTone } from "@/lib/crm-config";
import { CLASSIFICATION_LABELS, PIPELINE_STAGES, QUALIFICATION_LABELS } from "@/lib/crm-labels";
import { Bars, Kpi, leadsHref } from "../components/ui";

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const PERIODS = [7, 30, 90, 365];
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "—");

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const sp = await searchParams;
  const { scope, config, today } = await crmContext(session);
  const tz = config.timezone;

  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const custom = Boolean(sp.from && YMD.test(sp.from));
  let from = custom ? sp.from! : addDays(today, -(days - 1));
  let to = sp.to && YMD.test(sp.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];
  const span = daysBetween(from, to) + 1;

  const [rows, moves, staff] = await Promise.all([
    loadLeadRows(scope),
    loadStageMoves(scope, dayStart(from, tz).toISOString(), dayStart(addDays(to, 1), tz).toISOString()),
    loadStaff(),
  ]);

  // Cohort = leads that entered in the period (archived ones included: they did come in).
  const cohort = rows.filter((r) => r.entry_date >= from && r.entry_date <= to);
  const won = (r: LeadRow) => WON_STAGES.includes(r.stage);
  const reachedIdx = (r: LeadRow) => PIPELINE_STAGES.indexOf(r.stage);
  const movedTo = (stage: string) => new Set(moves.filter((m) => m.to_stage === stage).map((m) => m.lead_id)).size;
  const cohortWon = cohort.filter(won).length;
  const cohortLost = cohort.filter((r) => ["lost", "not_interested", "unqualified"].includes(r.stage)).length;
  const qualified = cohort.filter((r) => r.qualification_status === "qualified").length;

  // Funnel: how far each cohort lead has got along the main pipeline (by its current stage).
  const funnel = PIPELINE_STAGES.map((s, i) => ({ stage: s, count: cohort.filter((r) => reachedIdx(r) >= i).length }));

  // Daily intake.
  const daily = new Map<string, number>();
  for (const r of cohort) daily.set(r.entry_date, (daily.get(r.entry_date) ?? 0) + 1);
  const dayKeys = span <= 120 ? Array.from({ length: span }, (_, i) => addDays(from, i)) : [];
  const maxDay = Math.max(1, ...dayKeys.map((d) => daily.get(d) ?? 0));

  // Source performance.
  const bySource = new Map<string, LeadRow[]>();
  for (const r of cohort) { const k = r.source || ""; bySource.set(k, [...(bySource.get(k) ?? []), r]); }
  const sourceRows = [...bySource.entries()].map(([k, list]) => ({
    key: k, total: list.length,
    hot: list.filter((r) => r.classification === "Hot").length,
    qualified: list.filter((r) => r.qualification_status === "qualified").length,
    exam: list.filter((r) => reachedIdx(r) >= PIPELINE_STAGES.indexOf("exam_booked")).length,
    won: list.filter(won).length,
  })).sort((a, b) => b.total - a.total);

  // Team.
  const ids = new Set<string>([...rows.map((r) => r.assigned_to ?? ""), ...moves.map((m) => m.changed_by ?? "")].filter(Boolean));
  const t0 = dayStart(today, tz).getTime();
  const team = [...ids, ""].map((id) => {
    const mine = rows.filter((r) => !r.archived_at && (r.assigned_to ?? "") === id);
    const myCohort = cohort.filter((r) => (r.assigned_to ?? "") === id);
    return {
      id, name: id ? staff.get(id) ?? "—" : "بدون مسؤول",
      total: mine.length,
      open: mine.filter((r) => !CLOSED_STAGES.includes(r.stage)).length,
      overdue: mine.filter((r) => !CLOSED_STAGES.includes(r.stage) && r.next_follow_up_at && Date.parse(r.next_follow_up_at) < t0).length,
      moves: id ? moves.filter((m) => m.changed_by === id).length : 0,
      cohort: myCohort.length,
      won: myCohort.filter(won).length,
    };
  }).filter((t) => t.total || t.moves || t.cohort).sort((a, b) => b.total - a.total);

  const lossReasons = countBy(cohort.filter((r) => r.loss_reason), (r) => r.loss_reason).sort((a, b) => b.count - a.count);
  const services = countBy(cohort, (r) => r.service_interest).sort((a, b) => b.count - a.count);
  const periodLink = (n: number) => `?days=${n}`;

  return (
    <>
      <div className="crm-head">
        <div>
          <h1>التقارير</h1>
          <p>من قاعدة البيانات مباشرة{scope.kind === "all" ? "" : " — لعملائك بس"} · الفترة: {fmtDay(from, today)} ← {fmtDay(to, today)} ({span} يوم)</p>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="seg" role="group" aria-label="الفترة">
          {PERIODS.map((n) => <Link key={n} href={periodLink(n)} aria-pressed={!custom && days === n}>{n === 365 ? "سنة" : `${n} يوم`}</Link>)}
        </div>
        <input className="input w-auto py-2" type="date" name="from" defaultValue={from} aria-label="من" />
        <input className="input w-auto py-2" type="date" name="to" defaultValue={to} aria-label="إلى" />
        <button className="crm-btn crm-btn-outline crm-btn-sm">تطبيق</button>
      </form>

      <div className="kpis">
        <Kpi label="عملاء جدد في الفترة" value={cohort.length} hint={`متوسط ${(cohort.length / span).toFixed(1)} في اليوم`} href={leadsHref({ date_from: from, date_to: to, view: "all" })} variant="focus" />
        <Kpi label="مؤهلين" value={qualified} hint={`${pct(qualified, cohort.length)} من الجدد`} href={leadsHref({ date_from: from, date_to: to, qualification_status: "qualified", view: "all" })} />
        <Kpi label={`${stageLabel(config, "exam_booked")} (حركة)`} value={movedTo("exam_booked")} hint="اتنقلوا للمرحلة دي جوه النظام في الفترة" />
        <Kpi label={`${stageLabel(config, "exam_attended")} (حركة)`} value={movedTo("exam_attended")} hint="اتنقلوا للمرحلة دي جوه النظام في الفترة" />
        <Kpi label={`${stageLabel(config, "treatment_started")} (حركة)`} value={movedTo("treatment_started")} hint="اتنقلوا للمرحلة دي جوه النظام في الفترة" variant="good" />
        <Kpi label="معدل التحويل" value={pct(cohortWon, cohort.length)} hint={`${cohortWon} من ${cohort.length} بدأوا علاج أو خلصوا`} variant="good" />
        <Kpi label="خسارة / غير مهتم" value={cohortLost} hint={`${pct(cohortLost, cohort.length)} من الجدد`} variant={cohortLost ? "alert" : undefined} />
        <Kpi label="تغييرات مراحل" value={moves.length} hint="كل نقلة مرحلة اتسجلت في الفترة" href="/admin/crm/activity" />
      </div>

      <div className="crm-two">
        <section className="crm-card">
          <h2>قمع التحويل</h2>
          <div className="funnel">
            {funnel.map((f, i) => (
              <div key={f.stage} className="funnel-step">
                <span title={stageLabel(config, f.stage)}>{stageLabel(config, f.stage)}</span>
                <span><span className={`bar tn-${stageTone(config, f.stage)}`} style={{ width: `${cohort.length ? Math.max(2, (f.count / cohort.length) * 100) : 2}%` }}>{f.count || ""}</span></span>
                <em>{i === 0 ? "100%" : pct(f.count, cohort.length)}</em>
              </div>
            ))}
          </div>
          <p className="def">عملاء الفترة ({cohort.length}) حسب أبعد مرحلة في المسار الأساسي وصلوا لها، بناءً على مرحلتهم الحالية. العملاء في مراحل جانبية (لم يرد / غير مهتم / خسارة) بيتحسبوا في الخطوة الأولى بس.</p>
        </section>

        <section className="crm-card">
          <h2>العملاء الجدد يوم بيوم</h2>
          {dayKeys.length ? (
            <>
              <div className="trend" aria-label="عدد العملاء الجدد في كل يوم">
                {dayKeys.map((d) => <span key={d} style={{ height: `${((daily.get(d) ?? 0) / maxDay) * 100}%` }} title={`${fmtDay(d, today)}: ${daily.get(d) ?? 0}`} />)}
              </div>
              <div className="trend-axis"><span>{fmtDay(from, today)}</span><span>أعلى يوم: {maxDay}</span><span>{fmtDay(to, today)}</span></div>
            </>
          ) : <p className="text-sm text-slate-500">الرسم اليومي بيظهر للفترات لحد 120 يوم.</p>}
          <p className="def">حسب «تاريخ الدخول» للعميل. عدّي على أي عمود عشان تشوف اليوم والعدد.</p>
        </section>
      </div>

      <section className="crm-card">
        <h2>أداء المصادر والحملات</h2>
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>المصدر</th><th className="num">عملاء</th><th className="num">🔥 Hot</th><th className="num">مؤهل</th><th className="num">وصل كشف+</th><th className="num">بدأ علاج+</th><th className="num">التحويل</th></tr></thead>
            <tbody>
              {sourceRows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500">مفيش عملاء في الفترة</td></tr>}
              {sourceRows.map((s) => (
                <tr key={s.key}>
                  <td>{s.key ? <Link className="font-bold text-[var(--navy)] hover:underline" href={leadsHref({ source: s.key, date_from: from, date_to: to, view: "all" })}>{s.key}</Link> : <span className="text-slate-500">غير محدد</span>}</td>
                  <td className="num"><b>{s.total}</b></td>
                  <td className="num">{s.hot}</td>
                  <td className="num">{s.qualified}</td>
                  <td className="num">{s.exam}</td>
                  <td className="num">{s.won}</td>
                  <td className="num"><b>{pct(s.won, s.total)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="def">«وصل كشف+» = مرحلته الحالية حجز كشف أو أبعد في المسار. «التحويل» = بدأ علاج أو مكتمل ÷ عملاء المصدر.</p>
      </section>

      <div className="crm-two">
        <section className="crm-card">
          <h2>المراحل الحالية لعملاء الفترة</h2>
          <Bars total={cohort.length} items={countBy(cohort, (r) => r.stage, ALL_STAGES).map((b) => ({ label: stageLabel(config, b.key), count: b.count, tone: stageTone(config, b.key), href: leadsHref({ stage: b.key, date_from: from, date_to: to, view: "all" }) }))} empty="مفيش عملاء في الفترة" />
        </section>
        <section className="crm-card">
          <h2>التصنيف والتأهيل</h2>
          <Bars total={cohort.length} items={countBy(cohort, (r) => r.classification, ["Hot", "Warm", "Cold"]).map((b) => ({ label: CLASSIFICATION_LABELS[b.key as "Hot"] ?? b.key, count: b.count, tone: CLASSIFICATION_TONES[b.key], href: leadsHref({ classification: b.key, date_from: from, date_to: to, view: "all" }) }))} empty="مفيش عملاء في الفترة" />
          <div className="h-4" />
          <Bars total={cohort.length} items={countBy(cohort, (r) => r.qualification_status, Object.keys(QUALIFICATION_LABELS)).map((b) => ({ label: QUALIFICATION_LABELS[b.key as "qualified"] ?? b.key, count: b.count, tone: QUALIFICATION_TONES[b.key], href: leadsHref({ qualification_status: b.key, date_from: from, date_to: to, view: "all" }) }))} empty="" />
        </section>
      </div>

      <div className="crm-two">
        <section className="crm-card">
          <h2>الخدمات المطلوبة</h2>
          <Bars total={cohort.length} items={services.map((b) => ({ label: b.key || "غير محدد", count: b.count, tone: "teal" }))} empty="مفيش عملاء في الفترة" />
        </section>
        <section className="crm-card">
          <h2>أسباب الخسارة</h2>
          <Bars total={lossReasons.reduce((a, b) => a + b.count, 0)} items={lossReasons.map((b) => ({ label: b.key, count: b.count, tone: "red" }))} empty="مفيش أسباب خسارة مسجلة لعملاء الفترة" />
        </section>
      </div>

      <section className="crm-card">
        <h2>أداء الفريق</h2>
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>المسؤول</th><th className="num">عملاء نشطين</th><th className="num">مفتوح</th><th className="num">متأخر</th><th className="num">نقلات مراحل في الفترة</th><th className="num">جدد في الفترة</th><th className="num">بدأ علاج+</th><th className="num">التحويل</th></tr></thead>
            <tbody>
              {team.map((t) => (
                <tr key={t.id || "none"}>
                  <td><Link className="font-bold text-[var(--navy)] hover:underline" href={t.id ? leadsHref({ assigned_to: t.id }) : leadsHref({ unassigned: "1" })}>{t.name}</Link></td>
                  <td className="num"><b>{t.total}</b></td>
                  <td className="num">{t.open}</td>
                  <td className="num">{t.overdue ? <Link className="text-red-700 font-bold hover:underline" href={`/admin/crm/today?who=${t.id || "none"}#overdue`}>{t.overdue}</Link> : 0}</td>
                  <td className="num">{t.moves}</td>
                  <td className="num">{t.cohort}</td>
                  <td className="num">{t.won}</td>
                  <td className="num"><b>{pct(t.won, t.cohort)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="def">«نقلات مراحل» = عدد مرات تغيير المرحلة اللي سجلها الموظف بنفسه في الفترة (من سجل المراحل). «التحويل» محسوب على العملاء الجدد في الفترة المسندين له.</p>
      </section>
    </>
  );
}
