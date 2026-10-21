import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Public, unauthenticated upload endpoint — patients aren't logged in.
// Files land in the PRIVATE "patient-uploads" bucket (not "clinic-assets"),
// so only a storage *path* is returned here, never a public URL. The admin
// dashboard generates short-lived signed URLs to view these on demand.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB — keep tight, the Heroku dyno is memory-constrained

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return true; // some clients omit both; don't block on absence alone
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 403 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES + 1024 * 50 /* small multipart overhead allowance */) {
    return NextResponse.json({ error: "حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)" }, { status: 413 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم. المسموح: صور JPG/PNG/WEBP أو ملف PDF" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `xray/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = supabaseServer();
  const { error } = await supabase.storage
    .from("patient-uploads")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}
