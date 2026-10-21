"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image, UserRound, Stethoscope, LogOut, Settings, Users, ExternalLink, Newspaper, CalendarCheck, Briefcase } from "lucide-react";
import { clsx } from "clsx";
import type { Role } from "@/lib/permissions";

const adminNavItems = [
  { href: "/admin", label: "الرئيسية", icon: Home, exact: true },
  { href: "/admin/crm", label: "CRM - العملاء المحتملين", icon: Briefcase, exact: false },
  { href: "/admin/bookings", label: "الحجوزات", icon: CalendarCheck, exact: false },
  { href: "/admin/hero", label: "الهيرو", icon: Image, exact: false },
  { href: "/admin/doctors", label: "الأطباء", icon: UserRound, exact: false },
  { href: "/admin/services", label: "الخدمات", icon: Stethoscope, exact: false },
  { href: "/admin/blog", label: "المقالات", icon: Newspaper, exact: false },
  { href: "/admin/clinic", label: "العيادة", icon: Settings, exact: false },
  { href: "/admin/members", label: "المسؤولون", icon: Users, exact: false },
];

const salesNavItems = [
  { href: "/admin/crm", label: "CRM - العملاء المحتملين", icon: Briefcase, exact: false },
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
    <aside className="w-56 bg-white border-l border-gray-200 flex flex-col shadow-sm min-h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">لوحة التحكم</p>
          <h2 className="font-bold text-blue-700 text-base leading-tight">Wave Dental</h2>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("admin-sidebar-close"))}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          aria-label="إغلاق القائمة"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* View site + Logout */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          عرض الموقع
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
