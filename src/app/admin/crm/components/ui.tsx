import Link from "next/link";
import { MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { Tone } from "@/lib/crm-config";

export function Badge({ tone, children, flat }: { tone?: Tone | string | null; children: React.ReactNode; flat?: boolean }) {
  return <span className={`tn tn-${tone || "slate"}${flat ? " flat" : ""}`}>{children}</span>;
}

export function Kpi({ label, value, hint, href, variant }: {
  label: string; value: number | string; hint?: React.ReactNode; href?: string; variant?: "alert" | "warn" | "good" | "focus";
}) {
  const body = (
    <>
      <small>{label}</small>
      <strong>{typeof value === "number" ? value.toLocaleString("en") : value}</strong>
      {hint ? <em>{hint}</em> : null}
    </>
  );
  const cls = `kpi${variant ? ` ${variant}` : ""}`;
  return href ? <Link className={cls} href={href}>{body}</Link> : <div className={cls}>{body}</div>;
}

export interface BarItem { label: string; count: number; tone?: Tone | string | null; href?: string; note?: string }

export function Bars({ items, empty = "لا توجد بيانات", total }: { items: BarItem[]; empty?: string; total?: number }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.some((i) => i.count)) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <div className="bars">
      {items.map((i) => {
        const pct = total ? Math.round((i.count / total) * 100) : null;
        const body = (
          <>
            <span title={i.label}>{i.label}</span>
            <span className="bar-track"><span className={`bar-fill tn-${i.tone || "blue"}`} style={{ width: `${(i.count / max) * 100}%` }} /></span>
            <b>{i.count.toLocaleString("en")}{pct != null && <i>{pct}%</i>}</b>
          </>
        );
        return i.href
          ? <Link key={i.label} href={i.href} className="bar-row" title={i.note}>{body}</Link>
          : <div key={i.label} className="bar-row" title={i.note}>{body}</div>;
      })}
    </div>
  );
}

/** Call / WhatsApp / original-chat buttons, shown only when the data exists. Opening WhatsApp sends nothing. */
export function ContactActions({ phone, waPhone, chatUrl, compact }: {
  phone: string | null; waPhone?: string | null; chatUrl?: string | null; compact?: boolean;
}) {
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  const waDigits = (waPhone || phone || "").replace(/\D/g, "");
  const wa = waDigits.length >= 11 ? `https://wa.me/${waDigits}` : null;
  if (!tel && !wa && !chatUrl) return <span className="text-xs text-slate-400">لا توجد بيانات تواصل</span>;
  return (
    <div className="quick-acts">
      {tel && <a className="act call" href={tel} title="اتصال"><Phone className="w-4 h-4" />{!compact && "اتصال"}</a>}
      {wa && <a className="act wa" href={wa} target="_blank" rel="noopener" title="واتساب"><MessageCircle className="w-4 h-4" />{!compact && "واتساب"}</a>}
      {chatUrl && <a className="act" href={chatUrl} target="_blank" rel="noopener" title="فتح المحادثة الأصلية"><MessagesSquare className="w-4 h-4" />{!compact && "المحادثة"}</a>}
    </div>
  );
}

/** Link to the leads table with filters (only params the leads table understands). */
export function leadsHref(params: Record<string, string | undefined> = {}): string {
  const p = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  const s = p.toString();
  return `/admin/crm/leads${s ? `?${s}` : ""}`;
}
