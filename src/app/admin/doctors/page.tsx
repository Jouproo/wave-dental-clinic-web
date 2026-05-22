export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import Link from "next/link";
import DoctorsTable from "./DoctorsTable";

export default async function DoctorsAdminPage() {
  const supabase = supabaseServer();
  const { data: doctors } = await supabase
    .from("doctors")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">الأطباء</h1>
          <p className="text-slate-500 mt-1">إدارة قائمة الأطباء المعروضين في الموقع</p>
        </div>
        <Link
          href="/admin/doctors/new"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          + إضافة طبيب
        </Link>
      </div>

      <DoctorsTable doctors={doctors ?? []} />
    </div>
  );
}
