export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import Link from "next/link";
import ServicesTable from "./ServicesTable";

export default async function ServicesAdminPage() {
  const supabase = supabaseServer();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الخدمات</h1>
          <p className="text-slate-500 mt-1">إدارة الخدمات المعروضة في الموقع</p>
        </div>
        <Link
          href="/admin/services/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          + إضافة خدمة
        </Link>
      </div>

      <ServicesTable services={services ?? []} />
    </div>
  );
}
