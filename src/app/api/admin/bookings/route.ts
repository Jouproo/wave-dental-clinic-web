import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";

// Unlike doctors/services, this table holds patient PII — GET is gated too.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestType = searchParams.get("request_type");
  const status = searchParams.get("status");

  const supabase = supabaseServer();
  let query = supabase.from("booking_requests").select("*").order("created_at", { ascending: false });
  if (requestType) query = query.eq("request_type", requestType);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
