import type { Metadata } from "next";
import AdminSidebar from "./components/AdminSidebar";

export const metadata: Metadata = {
  title: "لوحة التحكم - Wave Dental Clinic",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
