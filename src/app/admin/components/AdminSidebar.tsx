"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Image, UserRound, Stethoscope, LogOut, Settings, Users } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/admin", label: "الرئيسية", icon: Home, exact: true },
  { href: "/admin/hero", label: "الهيرو", icon: Image, exact: false },
  { href: "/admin/doctors", label: "الأطباء", icon: UserRound, exact: false },
  { href: "/admin/services", label: "الخدمات", icon: Stethoscope, exact: false },
  { href: "/admin/clinic", label: "العيادة", icon: Settings, exact: false },
  { href: "/admin/members", label: "المسؤولون", icon: Users, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  return (
    <aside className="w-56 bg-white border-l border-gray-200 flex flex-col shadow-sm min-h-screen">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-gray-100">
        <p className="text-xs text-gray-400 mt-0.5">لوحة التحكم</p>
        <h2 className="font-bold text-blue-700 text-base leading-tight">Wave Dental</h2>
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
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
