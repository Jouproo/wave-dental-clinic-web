"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change or custom close event from sidebar button
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("admin-sidebar-close", handler);
    return () => window.removeEventListener("admin-sidebar-close", handler);
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">

      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`
          fixed top-0 right-0 h-full z-40 lg:hidden
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <AdminSidebar />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-blue-700 text-sm">Wave Dental — لوحة التحكم</span>
          <div className="w-9" />
        </div>

        {children}
      </main>
    </div>
  );
}
