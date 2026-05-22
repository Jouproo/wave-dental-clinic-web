import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const [serviceRes, galleryRes] = await Promise.all([
    supabase.from("services").select("*").eq("id", id).single(),
    supabase
      .from("gallery")
      .select("*")
      .eq("service_id", id)
      .order("display_order", { ascending: true }),
  ]);

  if (serviceRes.error) return NextResponse.json({ error: serviceRes.error.message }, { status: 404 });

  return NextResponse.json({
    ...serviceRes.data,
    gallery: galleryRes.data ?? [],
  });
}
