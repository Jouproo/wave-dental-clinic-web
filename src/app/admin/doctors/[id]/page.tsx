export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import DoctorForm from "../DoctorForm";

export default async function EditDoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();
  const { data: doctor, error } = await supabase.from("doctors").select("*").eq("id", id).single();

  if (error || !doctor) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">تعديل بيانات الطبيب</h1>
      <p className="text-slate-500 mb-8">{doctor.name}</p>
      <DoctorForm initial={doctor} doctorId={id} />
    </div>
  );
}
