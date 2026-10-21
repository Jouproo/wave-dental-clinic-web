export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import BookingsTable from "./BookingsTable";
import type { DbBookingRequest } from "@/types/admin";

export default async function BookingsAdminPage() {
  const supabase = supabaseServer();
  const { data: bookings } = await supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">الحجوزات وطلبات التشخيص</h1>
        <p className="text-slate-500 mt-1">طلبات الحجز أونلاين وطلبات تشخيص زراعة الأسنان المجاني</p>
      </div>

      <BookingsTable bookings={(bookings ?? []) as DbBookingRequest[]} />
    </div>
  );
}
