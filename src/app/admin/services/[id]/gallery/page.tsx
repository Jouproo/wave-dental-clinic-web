export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import GalleryManager from "./GalleryManager";

export default async function GalleryAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const [serviceRes, galleryRes] = await Promise.all([
    supabase.from("services").select("title").eq("id", id).single(),
    supabase.from("gallery").select("*").eq("service_id", id).order("display_order", { ascending: true }),
  ]);

  if (serviceRes.error) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">معرض قبل وبعد</h1>
      <p className="text-slate-500 mb-8">{serviceRes.data.title}</p>
      <GalleryManager serviceId={id} initialItems={galleryRes.data ?? []} />
    </div>
  );
}
