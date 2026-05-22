export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import { Users, Stethoscope, Images, ImageIcon } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const supabase = supabaseServer();
  const [docRes, svcRes, galRes, heroRes] = await Promise.all([
    supabase.from("doctors").select("*", { count: "exact", head: true }),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase.from("gallery").select("*", { count: "exact", head: true }),
    supabase.from("hero_settings").select("background_image_url").eq("id", 1).single(),
  ]);
  return {
    doctors: docRes.count ?? 0,
    services: svcRes.count ?? 0,
    gallery: galRes.count ?? 0,
    heroSet: !!heroRes.data?.background_image_url,
  };
}

export default async function AdminHomePage() {
  const stats = await getStats().catch(() => ({ doctors: 0, services: 0, gallery: 0, heroSet: false }));

  const cards = [
    { label: "الأطباء", value: stats.doctors, icon: Users, href: "/admin/doctors", color: "blue" },
    { label: "الخدمات", value: stats.services, icon: Stethoscope, href: "/admin/services", color: "sky" },
    { label: "معرض الصور", value: stats.gallery, icon: Images, href: "/admin/services", color: "indigo" },
    { label: "صورة الهيرو", value: stats.heroSet ? "مضبوطة ✓" : "غير مضبوطة", icon: ImageIcon, href: "/admin/hero", color: "violet" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">مرحباً بك</h1>
      <p className="text-slate-500 mb-8">إدارة محتوى موقع Wave Dental Clinic</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4">روابط سريعة</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/doctors/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
            + إضافة طبيب
          </Link>
          <Link href="/admin/services/new" className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors">
            + إضافة خدمة
          </Link>
          <Link href="/admin/hero" className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors">
            تعديل الهيرو
          </Link>
          <Link href="/" target="_blank" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
            عرض الموقع ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
