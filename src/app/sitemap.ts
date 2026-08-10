import type { MetadataRoute } from "next";
import { clinicConfig } from "@/config/clinic";
import { services as staticServices } from "@/data/services";
import { supabaseServer } from "@/lib/supabase";

async function getActiveServiceIds(): Promise<string[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return staticServices.map((s) => s.id);
    }
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("services")
      .select("id")
      .eq("status", "active");
    if (error || !data || data.length === 0) {
      return staticServices.map((s) => s.id);
    }
    return data.map((s: { id: string }) => s.id);
  } catch {
    return staticServices.map((s) => s.id);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clinicConfig.seo.url;
  const now = new Date();
  const serviceIds = await getActiveServiceIds();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...serviceIds.map((id) => ({
      url: `${base}/services/${id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
