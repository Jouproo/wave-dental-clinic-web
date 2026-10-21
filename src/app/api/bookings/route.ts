import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import type { BookingRequestType } from "@/types/admin";

const MIN_FILL_MS = 2000; // reject submissions faster than a human could plausibly fill the form
const MAX_PER_IP_PER_WINDOW = 3;
const WINDOW_MINUTES = 10;

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  }

  const body = await req.json();

  // Honeypot — a field real patients never see or fill. Bots that fill every
  // input trip this. Respond as if it succeeded so the bot doesn't adapt.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, id: "ok" }, { status: 201 });
  }

  // Minimum fill-time — bots submit near-instantly after loading the page.
  const renderedAt = Number(body.rendered_at);
  if (!renderedAt || Date.now() - renderedAt < MIN_FILL_MS) {
    return NextResponse.json({ ok: true, id: "ok" }, { status: 201 });
  }

  const requestType: BookingRequestType = body.request_type === "implant_diagnosis" ? "implant_diagnosis" : "appointment";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const xrayPaths: string[] = Array.isArray(body.xray_paths) ? body.xray_paths.filter((p: unknown) => typeof p === "string") : [];

  if (!name || name.length > 120) {
    return NextResponse.json({ error: "من فضلك أدخل اسمك" }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "من فضلك أدخل رقم هاتف صحيح" }, { status: 400 });
  }
  if (requestType === "implant_diagnosis") {
    if (xrayPaths.length === 0) {
      return NextResponse.json({ error: "من فضلك ارفع أشعة واحدة على الأقل" }, { status: 400 });
    }
    if (!body.consent_given) {
      return NextResponse.json({ error: "من فضلك وافق على إرسال بياناتك الطبية لمراجعة الطبيب" }, { status: 400 });
    }
  }

  const supabase = supabaseServer();
  const ip = getClientIp(req);

  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("booking_requests")
    .select("id", { count: "exact", head: true })
    .eq("submitter_ip", ip)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_PER_IP_PER_WINDOW) {
    return NextResponse.json({ error: "تم إرسال عدة طلبات، من فضلك حاول مرة أخرى بعد قليل" }, { status: 429 });
  }

  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      request_type: requestType,
      name,
      phone,
      age: Number.isFinite(Number(body.age)) && body.age ? Number(body.age) : null,
      service_id: typeof body.service_id === "string" && body.service_id ? body.service_id : null,
      preferred_date: typeof body.preferred_date === "string" && body.preferred_date ? body.preferred_date : null,
      preferred_time: typeof body.preferred_time === "string" ? body.preferred_time.trim() || null : null,
      message: typeof body.message === "string" ? body.message.trim().slice(0, 2000) || null : null,
      xray_paths: xrayPaths.slice(0, 5),
      consent_given: Boolean(body.consent_given),
      submitter_ip: ip,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
