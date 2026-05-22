export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ServiceForm from "../ServiceForm";
import Link from "next/link";
import { Images } from "lucide-react";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();
  const { data: service, error } = await supabase.from("services").select("*").eq("id", id).single();

  if (error || !service) notFound();

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">تعديل الخدمة</h1>
          <p className="text-slate-500">{service.title}</p>
        </div>
        <Link
          href={`/admin/services/${id}/gallery`}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          <Images className="w-4 h-4" />
          إدارة معرض قبل وبعد
        </Link>
      </div>
      <ServiceForm initial={service} />
    </div>
  );
}
