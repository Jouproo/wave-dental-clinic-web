"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCcw, RotateCcw, X } from "lucide-react";
import { ALL_STAGES, DEFAULT_CRM_CONFIG, TONES, TONE_LABELS, type CrmConfig, type Tone } from "@/lib/crm-config";
import { PIPELINE_STAGES } from "@/lib/crm-labels";
import type { ClassificationThresholds, ScoringWeights } from "@/lib/lead-scoring";
import type { LeadStage } from "@/types/admin";

const ZONES = ["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Qatar", "Europe/London", "UTC"];

function ListEditor({ title, hint, items, onChange, placeholder }: {
  title: string; hint: string; items: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (t && !items.includes(t)) onChange([...items, t]);
    setV("");
  };
  return (
    <section className="crm-card">
      <h2>{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((s, i) => (
          <span key={s} className="chip-x">
            {s}
            <button type="button" aria-label={`حذف ${s}`} onClick={() => onChange(items.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={add} disabled={!v.trim()}><Plus className="w-4 h-4" /> إضافة</button>
      </div>
      <p className="def">{hint}</p>
    </section>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="crm-field">
      <span>{label}</span>
      <input className="input" type="number" min={0} max={1000} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function SettingsClient({ initialConfig, initialWeights, initialThresholds }: {
  initialConfig: CrmConfig; initialWeights: ScoringWeights; initialThresholds: ClassificationThresholds;
}) {
  const router = useRouter();
  const [cfg, setCfg] = useState(initialConfig);
  const [w, setW] = useState(initialWeights);
  const [th, setTh] = useState(initialThresholds);
  const [saving, setSaving] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = JSON.stringify([cfg, w, th]) !== JSON.stringify([initialConfig, initialWeights, initialThresholds]);
  const scoringDirty = JSON.stringify([w, th]) !== JSON.stringify([initialWeights, initialThresholds]);
  const setStage = (s: LeadStage, patch: Partial<{ label: string; color: Tone }>) =>
    setCfg({ ...cfg, stages: { ...cfg.stages, [s]: { ...cfg.stages[s], ...patch } } });

  async function save() {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/crm/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: cfg, scoring_weights: w, classification_thresholds: th }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg({ ok: false, text: d.error ?? "فشل الحفظ" }); return; }
    setMsg({ ok: true, text: scoringDirty ? "اتحفظت ✓ — التقييم الجديد هيتطبق على العملاء الجداد. لو عايزه على القدام دوس «إعادة حساب التقييم»." : "اتحفظت الإعدادات ✓" });
    router.refresh();
  }

  async function rescore() {
    if (!confirm("إعادة حساب التقييم والتصنيف لكل العملاء النشطين بالأوزان المحفوظة؟")) return;
    setRescoring(true); setMsg(null);
    const res = await fetch("/api/admin/crm/settings", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setRescoring(false);
    setMsg(res.ok ? { ok: true, text: `اتراجع ${d.scanned} عميل — ${d.changed} اتغير تقييمهم ✓` } : { ok: false, text: d.error ?? "فشل" });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <section className="crm-card">
        <h2>عام</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="crm-field">
            <span>المنطقة الزمنية</span>
            <select className="input" value={cfg.timezone} onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })}>
              {[...new Set([cfg.timezone, ...ZONES])].map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
            <small>«النهارده» و«المتأخر» بيتحسبوا بالتوقيت ده.</small>
          </label>
          <label className="crm-field">
            <span>العميل الجديد يعتبر «قديم» بعد (يوم)</span>
            <input className="input" type="number" min={1} max={365} value={cfg.stale_days} onChange={(e) => setCfg({ ...cfg, stale_days: Number(e.target.value) })} />
            <small>بيظهر في لوحة CRM تحت «عملاء محتاجين قرار».</small>
          </label>
        </div>
      </section>

      <section className="crm-card">
        <div className="card-head">
          <h2>المراحل والألوان</h2>
          <button type="button" className="card-link inline-flex items-center gap-1" onClick={() => setCfg({ ...cfg, stages: DEFAULT_CRM_CONFIG.stages })}><RotateCcw className="w-3.5 h-3.5" /> الافتراضي</button>
        </div>
        {ALL_STAGES.map((s) => (
          <div key={s} className="set-row">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`tn tn-${cfg.stages[s].color} shrink-0 hidden sm:inline-flex`}>{cfg.stages[s].label || "…"}</span>
              <input className="input" value={cfg.stages[s].label} maxLength={40} onChange={(e) => setStage(s, { label: e.target.value })} aria-label={`اسم مرحلة ${s}`} />
              <small className="text-slate-400 hidden md:inline whitespace-nowrap">{PIPELINE_STAGES.includes(s) ? "المسار الأساسي" : "مرحلة جانبية"}</small>
            </div>
            <select className="input w-auto" value={cfg.stages[s].color} onChange={(e) => setStage(s, { color: e.target.value as Tone })} aria-label="اللون">
              {TONES.map((t) => <option key={t} value={t}>{TONE_LABELS[t]}</option>)}
            </select>
          </div>
        ))}
        <p className="def">الأسماء والألوان بتتغير في كل مكان في الـ CRM (الجدول، صفحة العميل، اللوحة، التقارير). ترتيب المراحل ومعناها ثابت عشان التقارير ومعدل التحويل يفضلوا صح.</p>
      </section>

      <div className="crm-two">
        <ListEditor title="المصادر" items={cfg.sources} onChange={(v) => setCfg({ ...cfg, sources: v })} placeholder="مثلاً: حملة تقويم ديسمبر"
          hint="بتظهر في إضافة عميل والفلاتر والاستيراد. حذف مصدر مش بيغيّر العملاء القدام اللي عليه." />
        <ListEditor title="أسباب الأرشفة" items={cfg.archive_reasons} onChange={(v) => setCfg({ ...cfg, archive_reasons: v })} placeholder="سبب جديد…"
          hint="بتظهر لما تأرشف عميل أو مجموعة عملاء." />
      </div>

      <section className="crm-card">
        <div className="card-head">
          <h2>تقييم العملاء (Lead Scoring)</h2>
          <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={rescore} disabled={rescoring || scoringDirty} title={scoringDirty ? "احفظ الأول" : undefined}>
            {rescoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} إعادة حساب التقييم
          </button>
        </div>
        <div className="grid gap-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-600 mb-2">حجم الحالة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(w.case_size).map((k) => <NumField key={k} label={k} value={w.case_size[k]} onChange={(n) => setW({ ...w, case_size: { ...w.case_size, [k]: n } })} />)}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-600 mb-2">موعد البدء</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(w.start_timing).map((k) => <NumField key={k} label={k} value={w.start_timing[k]} onChange={(n) => setW({ ...w, start_timing: { ...w.start_timing, [k]: n } })} />)}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-600 mb-2">إشارات تانية</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <NumField label="سأل عن السعر" value={w.asked_price} onChange={(n) => setW({ ...w, asked_price: n })} />
              <NumField label="فتح ماسنجر" value={w.opened_messenger} onChange={(n) => setW({ ...w, opened_messenger: n })} />
              <NumField label="رقم صالح" value={w.valid_phone} onChange={(n) => setW({ ...w, valid_phone: n })} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-600 mb-2">حدود التصنيف</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <NumField label="🔥 Hot من" value={th.hot_min} onChange={(n) => setTh({ ...th, hot_min: n })} />
              <NumField label="Warm من" value={th.warm_min} onChange={(n) => setTh({ ...th, warm_min: n })} />
            </div>
          </div>
        </div>
        <p className="def">النقاط بتتجمع لكل عميل. لو المجموع ≥ «Hot من» يبقى Hot، ولو ≥ «Warm من» يبقى Warm، غير كده Cold. تغيير الأوزان بيأثر على العملاء الجداد بس، لحد ما تدوس «إعادة حساب التقييم».</p>
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
        <button type="button" className="crm-btn crm-btn-blue" onClick={save} disabled={!dirty || saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ الإعدادات
        </button>
        {dirty && !saving && <button type="button" className="crm-btn crm-btn-outline crm-btn-sm" onClick={() => { setCfg(initialConfig); setW(initialWeights); setTh(initialThresholds); setMsg(null); }}>تراجع</button>}
        {msg ? <span className={`crm-alert ${msg.ok ? "ok" : "err"} py-1.5`}>{msg.text}</span> : <span className="text-sm text-slate-500">{dirty ? "فيه تعديلات مش محفوظة" : "كل حاجة محفوظة"}</span>}
      </div>
    </>
  );
}
