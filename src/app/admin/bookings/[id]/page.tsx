export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import BookingDetail from "./BookingDetail";
import type { DbBookingRequest, DbDoctor } from "@/types/admin";

async function getXrayUrls(paths: string[]): Promise<{ path: string; url: string }[]> {
  if (paths.length === 0) return [];
  const supabase = supabaseServer();
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage.from("patient-uploads").createSignedUrl(path, 3600);
      return { path, url: data?.signedUrl ?? "" };
    })
  );
  return results.filter((r) => r.url);
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const [bookingRes, doctorsRes, servicesRes] = await Promise.all([
    supabase.from("booking_requests").select("*").eq("id", id).single(),
    supabase.from("doctors").select("*").eq("status", "active").order("display_order", { ascending: true }),
    supabase.from("services").select("id, title"),
  ]);

  if (bookingRes.error || !bookingRes.data) notFound();

  const booking = bookingRes.data as DbBookingRequest;
  const doctors = (doctorsRes.data ?? []) as DbDoctor[];
  const serviceTitle = booking.service_id
    ? (servicesRes.data ?? []).find((s: { id: string; title: string }) => s.id === booking.service_id)?.title ?? null
    : null;
  const xrays = await getXrayUrls(booking.xray_paths);

  return (
    <div className="p-8 max-w-3xl">
      <BookingDetail booking={booking} doctors={doctors} serviceTitle={serviceTitle} xrays={xrays} />
    </div>
  );
}
