"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, History, Home, ListChecks, Search, SlidersHorizontal, Upload, Users } from "lucide-react";

export function CrmTabs({ due, canImport, canSettings }: { due: number; canImport: boolean; canSettings: boolean }) {
  const path = usePathname() || "";
  const tabs = [
    { href: "/admin/crm", label: "لوحة CRM", Icon: Home, exact: true },
    { href: "/admin/crm/leads", label: "العملاء", Icon: Users },
    { href: "/admin/crm/today", label: "متابعات اليوم", Icon: ListChecks, badge: due },
    { href: "/admin/crm/activity", label: "سجل النشاط", Icon: History },
    { href: "/admin/crm/reports", label: "التقارير", Icon: BarChart3 },
    ...(canImport ? [{ href: "/admin/crm/import", label: "الاستيراد", Icon: Upload }] : []),
    ...(canSettings ? [{ href: "/admin/crm/settings", label: "الإعدادات", Icon: SlidersHorizontal }] : []),
  ];
  const on = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
  return (
    <nav className="crm-tabs" aria-label="أقسام CRM">
      {tabs.map(({ href, label, Icon, exact, badge }) => (
        <Link key={href} href={href} aria-current={on(href, exact) ? "page" : undefined}>
          <Icon className="w-[17px] h-[17px]" /> {label}
          {badge ? <b>{badge > 99 ? "99+" : badge}</b> : null}
        </Link>
      ))}
    </nav>
  );
}

/** Global CRM search — opens the leads list filtered by name / phone / code. */
export function CrmSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="crm-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        router.push(v ? `/admin/crm/leads?q=${encodeURIComponent(v)}` : "/admin/crm/leads");
      }}
    >
      <Search className="w-[18px] h-[18px]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الموبايل أو الكود…" aria-label="بحث في العملاء" />
    </form>
  );
}
