import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import ResultsClient, { type ResultCase } from "./ResultsClient";

async function getRealCases(): Promise<ResultCase[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    const supabase = supabaseServer();
    const [galleryRes, servicesRes] = await Promise.all([
      supabase
        .from("gallery")
        .select("*")
        .eq("featured_home", true)
        .not("before_image_url", "is", null)
        .not("after_image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("services").select("id, title"),
    ]);

    if (galleryRes.error || !galleryRes.data) return [];

    const titleMap = new Map<string, string>(
      (servicesRes.data ?? staticServices).map((s: { id: string; title: string }) => [s.id, s.title])
    );

    return galleryRes.data
      .filter((g) => g.before_image_url && g.after_image_url)
      .map((g) => ({
        id: g.id,
        serviceId: g.service_id,
        serviceTitle: titleMap.get(g.service_id) ?? "خدماتنا",
        before: g.before_image_url as string,
        after: g.after_image_url as string,
        caption: g.caption ?? "",
      }));
  } catch {
    return [];
  }
}

export default async function ResultsSection() {
  const cases = await getRealCases();
  return <ResultsClient cases={cases} />;
}
