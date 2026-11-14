export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { getCrmConfig, loadStaff } from "@/lib/crm-stats";
import { fmtStamp } from "@/lib/crm-config";
import { DEFAULT_CLASSIFICATION_THRESHOLDS, DEFAULT_SCORING_WEIGHTS, type ClassificationThresholds, type ScoringWeights } from "@/lib/lead-scoring";
import SettingsClient from "./SettingsClient";

const ROLE_LABELS: Record<string, string> = { admin: "مدير النظام", sales_manager: "مدير مبيعات", sales_agent: "موظف مبيعات" };
const ACTION_LABELS: Record<string, string> = {
  "crm.settings_update": "تعديل إعدادات CRM", "crm.rescore_all": "إعادة حساب التقييم",
  "leads.bulk_archive": "أرشفة جماعية", "leads.bulk_restore": "استرجاع جماعي", "leads.bulk_assign": "توزيع جماعي", "leads.bulk_stage": "تغيير مرحلة جماعي",
};

export default async function CrmSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!sessionHasPermission(session, "crm.settings.manage")) {
    return <p className="crm-alert err">الإعدادات متاحة لمدير النظام بس.</p>;
  }
  const sb = supabaseServer();
  const [{ config, stored }, scoring, users, audit, staff] = await Promise.all([
    getCrmConfig(),
    sb.from("crm_settings").select("scoring_weights, classification_thresholds").eq("id", 1).maybeSingle(),
    sb.from("admin_users").select("id, name, email, role, status").order("name"),
    sb.from("audit_logs").select("id, actor_id, action, entity_type, created_at, after").order("created_at", { ascending: false }).limit(25),
    loadStaff(),
  ]);
  const w = { ...DEFAULT_SCORING_WEIGHTS, ...(scoring.data?.scoring_weights ?? {}) } as ScoringWeights;
  const th = { ...DEFAULT_CLASSIFICATION_THRESHOLDS, ...(scoring.data?.classification_thresholds ?? {}) } as ClassificationThresholds;

  return (
    <>
      <div className="crm-head">
        <div><h1>إعدادات CRM</h1><p>المراحل والألوان والقوائم والتقييم والتوقيت — كله من هنا من غير كود.</p></div>
      </div>

      {!stored && (
        <p className="crm-alert warn">
          الإعدادات شغالة بالقيم الافتراضية. عشان تقدر تحفظ تعديلاتك، شغّل ملف <b dir="ltr">supabase/migrations/crm_settings_v2.sql</b> مرة واحدة في Supabase → SQL Editor.
        </p>
      )}

      <SettingsClient initialConfig={config} initialWeights={w} initialThresholds={th} />

      <section className="crm-card">
        <div className="card-head"><h2>الفريق والصلاحيات</h2><Link className="card-link" href="/admin/members">إدارة المسؤولين</Link></div>
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>الاسم</th><th>الإيميل</th><th>الدور</th><th>الحالة</th></tr></thead>
            <tbody>
              {(users.data ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="font-bold">{u.name || "—"}</td>
                  <td dir="ltr" className="text-right">{u.email}</td>
                  <td>{ROLE_LABELS[u.role] ?? u.role}</td>
                  <td>{u.status === "disabled" ? <span className="tn tn-red">موقوف</span> : <span className="tn tn-green">نشط</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="def">مدير النظام: كل حاجة. مدير المبيعات: يشوف كل العملاء ويوزّعهم. موظف المبيعات: يشوف عملاءه المسندين له بس. إضافة موظف أو تغيير دوره من «إدارة المسؤولين».</p>
      </section>

      <section className="crm-card">
        <h2>سجل التدقيق</h2>
        {(audit.data ?? []).length === 0 ? <p className="text-sm text-slate-500">مفيش أحداث مسجلة.</p> : (
          <div className="table-wrap">
            <table className="dtable">
              <thead><tr><th>الوقت</th><th>مين</th><th>الإجراء</th><th>التفاصيل</th></tr></thead>
              <tbody>
                {(audit.data ?? []).map((a) => {
                  const after = (a.after ?? {}) as Record<string, unknown>;
                  const detail = typeof after.count === "number" ? `${after.count} عميل` : typeof after.changed === "number" ? `${after.changed} اتغيروا من ${after.scanned}` : "";
                  return (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap">{fmtStamp(a.created_at, config.timezone)}</td>
                      <td>{a.actor_id ? staff.get(a.actor_id) ?? "—" : "النظام"}</td>
                      <td>{ACTION_LABELS[a.action] ?? a.action}</td>
                      <td className="text-slate-500">{detail}{after.reason ? ` · ${after.reason}` : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
