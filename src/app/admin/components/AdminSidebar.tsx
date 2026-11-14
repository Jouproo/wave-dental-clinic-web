"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import InstallAppButton from "./InstallApp";
import { Home, Image, UserRound, Stethoscope, LogOut, Settings, Users, ExternalLink, Newspaper, CalendarCheck, Briefcase } from "lucide-react";
import { clsx } from "clsx";
import type { Role } from "@/lib/permissions";

const adminNavItems = [
  { href: "/admin", label: "الرئيسية", icon: Home, exact: true },
  { href: "/admin/crm", label: "CRM", icon: Briefcase, exact: false },
  { href: "/admin/bookings", label: "الحجوزات", icon: CalendarCheck, exact: false },
  { href: "/admin/hero", label: "الهيرو", icon: Image, exact: false },
  { href: "/admin/doctors", label: "الأطباء", icon: UserRound, exact: false },
  { href: "/admin/services", label: "الخدمات", icon: Stethoscope, exact: false },
  { href: "/admin/blog", label: "المقالات", icon: Newspaper, exact: false },
  { href: "/admin/clinic", label: "العيادة", icon: Settings, exact: false },
  { href: "/admin/members", label: "المسؤولون", icon: Users, exact: false },
];

const salesNavItems = [
  { href: "/admin/crm", label: "CRM", icon: Briefcase, exact: false },
  { href: "/admin/bookings", label: "الحجوزات", icon: CalendarCheck, exact: false },
];

export default function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  // UI-only convenience — the real restriction is enforced server-side
  // (proxy.ts advisory redirect + admin/layout.tsx's DB-backed session check
  // + each API route's own permission check), so this filtering can never
  // be the only thing standing between a sales account and an admin-only page.
  const navItems = role === "admin" ? adminNavItems : salesNavItems;

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    // Hard navigation, not router.replace() — same reasoning as the login
    // page: a client-side soft nav across the login/logged-in layout
    // boundary can reuse a stale cached render instead of fetching fresh.
    window.location.href = "/admin/login";
  }

  return (
    <aside className="w-60 bg-brand-950 text-white flex flex-col min-h-screen lg:sticky lg:top-0 lg:h-screen">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-300">لوحة التحكم</p>
          <h2 className="font-extrabold text-white text-lg leading-tight">Wave Dental</h2>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("admin-sidebar-close"))}
          className="lg:hidden p-1.5 rounded-lg text-brand-200 hover:bg-white/10 transition-colors"
          aria-label="إغلاق القائمة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors border",
                active
                  ? "bg-white/10 text-white border-brand-500 shadow-[0_0_0_1px_rgba(40,151,240,.35)]"
                  : "text-brand-100/80 border-transparent hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* View site + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <InstallAppButton variant="sidebar" />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100/80 hover:bg-white/5 hover:text-white transition-colors w-full"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          عرض الموقع
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100/80 hover:bg-red-500/15 hover:text-red-200 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
