import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
